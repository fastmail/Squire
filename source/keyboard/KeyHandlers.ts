import {
    isMac,
    isWin,
    isIOS,
    ctrlKey,
    supportsInputEvents,
} from '../Constants';
import { deleteContentsOfRange } from '../range/InsertDelete';
import type { Squire } from '../Editor';
import { Enter } from './Enter';
import { Backspace } from './Backspace';
import { Delete } from './Delete';
import { ShiftTab, Tab } from './Tab';
import { Space } from './Space';
import { rangeDoesEndAtBlockBoundary } from '../range/Block';
import { moveRangeBoundariesDownTree } from '../range/Boundaries';

// ---

const _onKey = function (this: Squire, event: KeyboardEvent): void {
    if (event.defaultPrevented) {
        return;
    }

    // We need to apply the Backspace/delete handlers regardless of
    // control key modifiers.
    let key = event.key;
    let modifiers = '';
    if (key !== 'Backspace' && key !== 'Delete') {
        if (event.altKey) {
            modifiers += 'Alt-';
        }
        if (event.ctrlKey) {
            modifiers += 'Ctrl-';
        }
        if (event.metaKey) {
            modifiers += 'Meta-';
        }
        if (event.shiftKey) {
            modifiers += 'Shift-';
        }
    }
    // However, on Windows, Shift-Delete is apparently "cut" (WTF right?), so
    // we want to let the browser handle Shift-Delete in this situation.
    if (isWin && event.shiftKey && key === 'Delete') {
        modifiers += 'Shift-';
    }
    key = modifiers + key;

    const range: Range = this.getSelection();
    if (this._keyHandlers[key]) {
        this._keyHandlers[key](this, event, range);
    } else if (
        !range.collapsed &&
        // !event.isComposing stops us from blatting Kana-Kanji conversion in
        // Safari
        !event.isComposing &&
        !event.ctrlKey &&
        !event.metaKey &&
        key.length === 1
    ) {
        // Record undo checkpoint.
        this.saveUndoState(range);
        // Delete the selection
        deleteContentsOfRange(range, this._root);
        this._ensureBottomLine();
        this.setSelection(range);
        this._updatePath(range, true);
    }
};

// ---

type KeyHandler = (self: Squire, event: KeyboardEvent, range: Range) => void;

const keyHandlers: Record<string, KeyHandler> = {
    'Backspace': Backspace,
    'Delete': Delete,
    'Tab': Tab,
    'Shift-Tab': ShiftTab,
    ' ': Space,
    'ArrowLeft'(self: Squire): void {
        self._removeZWS();
    },
    'ArrowRight'(self: Squire, event: KeyboardEvent, range: Range): void {
        self._removeZWS();
        // Allow right arrow to always break out of <code> block.
        const root = self.getRoot();
        if (rangeDoesEndAtBlockBoundary(range, root)) {
            moveRangeBoundariesDownTree(range);
            let node: Node | null = range.endContainer;
            do {
                if (node.nodeName === 'CODE') {
                    let next = node.nextSibling;
                    if (!(next instanceof Text)) {
                        const textNode = document.createTextNode(' '); // nbsp
                        node.parentNode!.insertBefore(textNode, next);
                        next = textNode;
                    }
                    range.setStart(next, 1);
                    self.setSelection(range);
                    event.preventDefault();
                    break;
                }
            } while (
                !node.nextSibling &&
                (node = node.parentNode) &&
                node !== root
            );
        }
    },
};

if (!supportsInputEvents) {
    keyHandlers.Enter = Enter;
    keyHandlers['Shift-Enter'] = Enter;
}

// System standard for page up/down on Mac/iOS is to just scroll, not move the
// cursor. On Linux/Windows, it should move the cursor, but some browsers don't
// implement this natively. Override to support it.
if (!isMac && !isIOS) {
    keyHandlers.PageUp = (self: Squire) => {
        self.moveCursorToStart();
    };
    keyHandlers.PageDown = (self: Squire) => {
        self.moveCursorToEnd();
    };
}

// ---

const mapKeyToFormat = (
    tag: string,
    remove?: { tag: string } | null,
): KeyHandler => {
    remove = remove || null;
    return (self: Squire, event: Event) => {
        event.preventDefault();
        const range = self.getSelection();
        if (self.hasFormat(tag, null, range)) {
            self.changeFormat(null, { tag }, range);
        } else {
            self.changeFormat({ tag }, remove, range);
        }
    };
};

keyHandlers[ctrlKey + 'b'] = mapKeyToFormat('B');
keyHandlers[ctrlKey + 'i'] = mapKeyToFormat('I');
keyHandlers[ctrlKey + 'u'] = mapKeyToFormat('U');
keyHandlers[ctrlKey + 'Shift-7'] = mapKeyToFormat('S');
keyHandlers[ctrlKey + 'Shift-5'] = mapKeyToFormat('SUB', { tag: 'SUP' });
keyHandlers[ctrlKey + 'Shift-6'] = mapKeyToFormat('SUP', { tag: 'SUB' });

keyHandlers[ctrlKey + 'Shift-8'] = (
    self: Squire,
    event: KeyboardEvent,
): void => {
    event.preventDefault();
    const path = self.getPath();
    if (!/(?:^|>)UL/.test(path)) {
        self.makeUnorderedList();
    } else {
        self.removeList();
    }
};
keyHandlers[ctrlKey + 'Shift-9'] = (
    self: Squire,
    event: KeyboardEvent,
): void => {
    event.preventDefault();
    const path = self.getPath();
    if (!/(?:^|>)OL/.test(path)) {
        self.makeOrderedList();
    } else {
        self.removeList();
    }
};

keyHandlers[ctrlKey + '['] = (self: Squire, event: KeyboardEvent): void => {
    event.preventDefault();
    const path = self.getPath();
    if (/(?:^|>)BLOCKQUOTE/.test(path) || !/(?:^|>)[OU]L/.test(path)) {
        self.decreaseQuoteLevel();
    } else {
        self.decreaseListLevel();
    }
};
keyHandlers[ctrlKey + ']'] = (self: Squire, event: KeyboardEvent): void => {
    event.preventDefault();
    const path = self.getPath();
    if (/(?:^|>)BLOCKQUOTE/.test(path) || !/(?:^|>)[OU]L/.test(path)) {
        self.increaseQuoteLevel();
    } else {
        self.increaseListLevel();
    }
};

keyHandlers[ctrlKey + 'd'] = (self: Squire, event: KeyboardEvent): void => {
    event.preventDefault();
    self.toggleCode();
};

keyHandlers[ctrlKey + 'z'] = (self: Squire, event: KeyboardEvent): void => {
    event.preventDefault();
    self.undo();
};
keyHandlers[ctrlKey + 'y'] = keyHandlers[ctrlKey + 'Shift-z'] = (
    self: Squire,
    event: KeyboardEvent,
): void => {
    event.preventDefault();
    self.redo();
};

export { _onKey, keyHandlers };
