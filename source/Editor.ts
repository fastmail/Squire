import {
    TreeIterator,
    SHOW_TEXT,
    SHOW_ELEMENT_OR_TEXT,
} from './node/TreeIterator';
import {
    createElement,
    detach,
    empty,
    getNearest,
    hasTagAttributes,
    replaceWith,
} from './node/Node';
import {
    isLeaf,
    isInline,
    resetNodeCategoryCache,
    isContainer,
    isBlock,
} from './node/Category';
import { isLineBreak, removeZWS } from './node/Whitespace';
import {
    moveRangeBoundariesDownTree,
    isNodeContainedInRange,
    moveRangeBoundaryOutOf,
    moveRangeBoundariesUpTree,
} from './range/Boundaries';
import {
    createRange,
    deleteContentsOfRange,
    extractContentsOfRange,
    insertNodeInRange,
    insertTreeFragmentIntoRange,
} from './range/InsertDelete';
import {
    fixContainer,
    fixCursor,
    mergeContainers,
    mergeInlines,
    split,
} from './node/MergeSplit';
import { getBlockWalker, getNextBlock, isEmptyBlock } from './node/Block';
import { cleanTree, cleanupBRs, escapeHTML, removeEmptyInlines } from './Clean';
import { cantFocusEmptyTextNodes, isAndroid, ZWS } from './Constants';
import {
    expandRangeToBlockBoundaries,
    getEndBlockOfRange,
    getStartBlockOfRange,
    rangeDoesEndAtBlockBoundary,
    rangeDoesStartAtBlockBoundary,
} from './range/Block';
import {
    _monitorShiftKey,
    _onCopy,
    _onCut,
    _onDrop,
    _onPaste,
} from './Clipboard';
import { keyHandlers, _onKey } from './keyboard/KeyHandlers';
import { linkifyText } from './keyboard/KeyHelpers';
import { getTextContentsOfRange } from './range/Contents';

declare const DOMPurify: any;

// ---

type EventHandler = { handleEvent: (e: Event) => void } | ((e: Event) => void);

type KeyHandlerFunction = (x: Squire, y: KeyboardEvent, z: Range) => void;

type TagAttributes = {
    [key: string]: { [key: string]: string };
};

interface SquireConfig {
    blockTag: string;
    blockAttributes: null | Record<string, string>;
    tagAttributes: TagAttributes;
    classNames: {
        color: string;
        fontFamily: string;
        fontSize: string;
        highlight: string;
    };
    undo: {
        documentSizeThreshold: number;
        undoLimit: number;
    };
    addLinks: boolean;
    willCutCopy: null | ((html: string) => string);
    toPlainText: null | ((html: string) => string);
    sanitizeToDOMFragment: (html: string, editor: Squire) => DocumentFragment;
    didError: (x: any) => void;
}

// ---

class Squire {
    _root: HTMLElement;
    _config: SquireConfig;

    _isFocused: boolean;
    _lastSelection: Range;
    _willRestoreSelection: boolean;
    _mayHaveZWS: boolean;

    _lastAnchorNode: Node | null;
    _lastFocusNode: Node | null;
    _path: string;

    _events: Map<string, Array<EventHandler>>;

    _undoIndex: number;
    _undoStack: Array<string>;
    _undoStackLength: number;
    _isInUndoState: boolean;
    _ignoreChange: boolean;
    _ignoreAllChanges: boolean;

    _isShiftDown: boolean;
    _keyHandlers: Record<string, KeyHandlerFunction>;

    _mutation: MutationObserver;

    constructor(root: HTMLElement, config?: Partial<SquireConfig>) {
        this._root = root;

        this._config = this._makeConfig(config);

        this._isFocused = false;
        this._lastSelection = createRange(root, 0);
        this._willRestoreSelection = false;
        this._mayHaveZWS = false;

        this._lastAnchorNode = null;
        this._lastFocusNode = null;
        this._path = '';

        this._events = new Map();

        this._undoIndex = -1;
        this._undoStack = [];
        this._undoStackLength = 0;
        this._isInUndoState = false;
        this._ignoreChange = false;
        this._ignoreAllChanges = false;

        // Add event listeners
        this.addEventListener('selectionchange', this._updatePathOnEvent);

        // On blur, restore focus except if the user taps or clicks to focus a
        // specific point. Can't actually use click event because focus happens
        // before click, so use mousedown/touchstart
        this.addEventListener('blur', this._enableRestoreSelection);
        this.addEventListener('mousedown', this._disableRestoreSelection);
        this.addEventListener('touchstart', this._disableRestoreSelection);
        this.addEventListener('focus', this._restoreSelection);

        // Clipboard support
        this._isShiftDown = false;
        this.addEventListener('cut', _onCut as (e: Event) => void);
        this.addEventListener('copy', _onCopy as (e: Event) => void);
        this.addEventListener('paste', _onPaste as (e: Event) => void);
        this.addEventListener('drop', _onDrop as (e: Event) => void);
        this.addEventListener(
            'keydown',
            _monitorShiftKey as (e: Event) => void,
        );
        this.addEventListener('keyup', _monitorShiftKey as (e: Event) => void);

        // Keyboard support
        this.addEventListener('keydown', _onKey as (e: Event) => void);
        this._keyHandlers = Object.create(keyHandlers);

        const mutation = new MutationObserver(() => this._docWasChanged());
        mutation.observe(root, {
            childList: true,
            attributes: true,
            characterData: true,
            subtree: true,
        });
        this._mutation = mutation;

        // Make it editable
        root.setAttribute('contenteditable', 'true');

        // Modern browsers let you override their default content editable
        // handling!
        this.addEventListener(
            'beforeinput',
            this._beforeInput as (e: Event) => void,
        );

        this.setHTML('');
    }

    destroy(): void {
        this._events.forEach((_, type) => {
            this.removeEventListener(type);
        });

        this._mutation.disconnect();

        this._undoIndex = -1;
        this._undoStack = [];
        this._undoStackLength = 0;
    }

    _makeConfig(userConfig?: object): SquireConfig {
        const config = {
            blockTag: 'DIV',
            blockAttributes: null,
            tagAttributes: {},
            classNames: {
                color: 'color',
                fontFamily: 'font',
                fontSize: 'size',
                highlight: 'highlight',
            },
            undo: {
                documentSizeThreshold: -1, // -1 means no threshold
                undoLimit: -1, // -1 means no limit
            },
            addLinks: true,
            willCutCopy: null,
            toPlainText: null,
            sanitizeToDOMFragment: (
                html: string,
                /* editor: Squire, */
            ): DocumentFragment => {
                const frag = DOMPurify.sanitize(html, {
                    ALLOW_UNKNOWN_PROTOCOLS: true,
                    WHOLE_DOCUMENT: false,
                    RETURN_DOM: true,
                    RETURN_DOM_FRAGMENT: true,
                    FORCE_BODY: false,
                });
                return frag
                    ? document.importNode(frag, true)
                    : document.createDocumentFragment();
            },
            didError: (error: any): void => console.log(error),
        };
        if (userConfig) {
            Object.assign(config, userConfig);
            config.blockTag = config.blockTag.toUpperCase();
        }

        return config;
    }

    setKeyHandler(key: string, fn: KeyHandlerFunction) {
        this._keyHandlers[key] = fn;
        return this;
    }

    _beforeInput(event: InputEvent): void {
        switch (event.inputType) {
            case 'insertText':
                // Generally we let the browser handle text insertion, as it
                // does so fine. However, the Samsung keyboard on Android with
                // the Grammarly extension goes batshit crazy for some reason
                // and will try to disastrously rewrite the whole data, without
                // the user even doing anything (it can happen on first load
                // before the user types anything). Fortunately we can detect
                // this by looking for a new line in the data and if we see it,
                // stop it by preventing default.
                // 30-11-2023 Update: The fix for Grammarly bug prevents pasting
                // text directly from the keyboard on Android if the text to be
                // inserted contains \n, as pasting from the keyboard does not 
                // fire a true paste event. The Grammarly bug seems to have been 
                // fixed in Samsung keyboard as of v5.6.10.4, but leaving the
                // fix in place for now, as the bug is particularly destructive.
                if (isAndroid && event.data && event.data.includes('\n')) {
                    event.preventDefault();
                }
                break;
            case 'insertLineBreak':
                event.preventDefault();
                this.splitBlock(true);
                break;
            case 'insertParagraph':
                event.preventDefault();
                this.splitBlock(false);
                break;
            case 'insertOrderedList':
                event.preventDefault();
                this.makeOrderedList();
                break;
            case 'insertUnoderedList':
                event.preventDefault();
                this.makeUnorderedList();
                break;
            case 'historyUndo':
                event.preventDefault();
                this.undo();
                break;
            case 'historyRedo':
                event.preventDefault();
                this.redo();
                break;
            case 'formatBold':
                event.preventDefault();
                this.bold();
                break;
            case 'formaItalic':
                event.preventDefault();
                this.italic();
                break;
            case 'formatUnderline':
                event.preventDefault();
                this.underline();
                break;
            case 'formatStrikeThrough':
                event.preventDefault();
                this.strikethrough();
                break;
            case 'formatSuperscript':
                event.preventDefault();
                this.superscript();
                break;
            case 'formatSubscript':
                event.preventDefault();
                this.subscript();
                break;
            case 'formatJustifyFull':
            case 'formatJustifyCenter':
            case 'formatJustifyRight':
            case 'formatJustifyLeft': {
                event.preventDefault();
                let alignment = event.inputType.slice(13).toLowerCase();
                if (alignment === 'full') {
                    alignment = 'justify';
                }
                this.setTextAlignment(alignment);
                break;
            }
            case 'formatRemove':
                event.preventDefault();
                this.removeAllFormatting();
                break;
            case 'formatSetBlockTextDirection': {
                event.preventDefault();
                let dir = event.data;
                if (dir === 'null') {
                    dir = null;
                }
                this.setTextDirection(dir);
                break;
            }
            case 'formatBackColor':
                event.preventDefault();
                this.setHighlightColor(event.data);
                break;
            case 'formatFontColor':
                event.preventDefault();
                this.setTextColor(event.data);
                break;
            case 'formatFontName':
                event.preventDefault();
                this.setFontFace(event.data);
                break;
        }
    }

    // --- Events

    handleEvent(event: Event): void {
        this.fireEvent(event.type, event);
    }

    fireEvent(type: string, detail?: Event | object): Squire {
        let handlers = this._events.get(type);
        // UI code, especially modal views, may be monitoring for focus events
        // and immediately removing focus. In certain conditions, this can
        // cause the focus event to fire after the blur event, which can cause
        // an infinite loop. So we detect whether we're actually
        // focused/blurred before firing.
        if (/^(?:focus|blur)/.test(type)) {
            const isFocused = this._root === document.activeElement;
            if (type === 'focus') {
                if (!isFocused || this._isFocused) {
                    return this;
                }
                this._isFocused = true;
            } else {
                if (isFocused || !this._isFocused) {
                    return this;
                }
                this._isFocused = false;
            }
        }
        if (handlers) {
            const event: Event =
                detail instanceof Event
                    ? detail
                    : new CustomEvent(type, {
                          detail,
                      });
            // Clone handlers array, so any handlers added/removed do not
            // affect it.
            handlers = handlers.slice();
            for (const handler of handlers) {
                try {
                    if ('handleEvent' in handler) {
                        handler.handleEvent(event);
                    } else {
                        handler.call(this, event);
                    }
                } catch (error) {
                    this._config.didError(error);
                }
            }
        }
        return this;
    }

    /**
     * Subscribing to these events won't automatically add a listener to the
     * document node, since these events are fired in a custom manner by the
     * editor code.
     */
    customEvents = new Set([
        'pathChange',
        'select',
        'input',
        'pasteImage',
        'undoStateChange',
    ]);

    addEventListener(type: string, fn: EventHandler): Squire {
        let handlers = this._events.get(type);
        let target: Document | HTMLElement = this._root;
        if (!handlers) {
            handlers = [];
            this._events.set(type, handlers);
            if (!this.customEvents.has(type)) {
                if (type === 'selectionchange') {
                    target = document;
                }
                target.addEventListener(type, this, true);
            }
        }
        handlers.push(fn);
        return this;
    }

    removeEventListener(type: string, fn?: EventHandler): Squire {
        const handlers = this._events.get(type);
        let target: Document | HTMLElement = this._root;
        if (handlers) {
            if (fn) {
                let l = handlers.length;
                while (l--) {
                    if (handlers[l] === fn) {
                        handlers.splice(l, 1);
                    }
                }
            } else {
                handlers.length = 0;
            }
            if (!handlers.length) {
                this._events.delete(type);
                if (!this.customEvents.has(type)) {
                    if (type === 'selectionchange') {
                        target = document;
                    }
                    target.removeEventListener(type, this, true);
                }
            }
        }
        return this;
    }

    // --- Focus

    focus(): Squire {
        this._root.focus({ preventScroll: true });
        return this;
    }

    blur(): Squire {
        this._root.blur();
        return this;
    }

    // --- Selection and bookmarking

    _enableRestoreSelection(): void {
        this._willRestoreSelection = true;
    }

    _disableRestoreSelection(): void {
        this._willRestoreSelection = false;
    }

    _restoreSelection() {
        if (this._willRestoreSelection) {
            this.setSelection(this._lastSelection);
        }
    }

    // ---

    _removeZWS(): void {
        if (!this._mayHaveZWS) {
            return;
        }
        removeZWS(this._root);
        this._mayHaveZWS = false;
    }

    // ---

    startSelectionId = 'squire-selection-start';
    endSelectionId = 'squire-selection-end';

    _saveRangeToBookmark(range: Range): void {
        let startNode = createElement('INPUT', {
            id: this.startSelectionId,
            type: 'hidden',
        });
        let endNode = createElement('INPUT', {
            id: this.endSelectionId,
            type: 'hidden',
        });
        let temp: HTMLElement;

        insertNodeInRange(range, startNode);
        range.collapse(false);
        insertNodeInRange(range, endNode);

        // In a collapsed range, the start is sometimes inserted after the end!
        if (
            startNode.compareDocumentPosition(endNode) &
            Node.DOCUMENT_POSITION_PRECEDING
        ) {
            startNode.id = this.endSelectionId;
            endNode.id = this.startSelectionId;
            temp = startNode;
            startNode = endNode;
            endNode = temp;
        }

        range.setStartAfter(startNode);
        range.setEndBefore(endNode);
    }

    _getRangeAndRemoveBookmark(range?: Range): Range | null {
        const root = this._root;
        const start = root.querySelector('#' + this.startSelectionId);
        const end = root.querySelector('#' + this.endSelectionId);

        if (start && end) {
            let startContainer: Node = start.parentNode!;
            let endContainer: Node = end.parentNode!;
            const startOffset = Array.from(startContainer.childNodes).indexOf(
                start,
            );
            let endOffset = Array.from(endContainer.childNodes).indexOf(end);

            if (startContainer === endContainer) {
                endOffset -= 1;
            }

            start.remove();
            end.remove();

            if (!range) {
                range = document.createRange();
            }
            range.setStart(startContainer, startOffset);
            range.setEnd(endContainer, endOffset);

            // Merge any text nodes we split
            mergeInlines(startContainer, range);
            if (startContainer !== endContainer) {
                mergeInlines(endContainer, range);
            }

            // If we didn't split a text node, we should move into any adjacent
            // text node to current selection point
            if (range.collapsed) {
                startContainer = range.startContainer;
                if (startContainer instanceof Text) {
                    endContainer = startContainer.childNodes[range.startOffset];
                    if (!endContainer || !(endContainer instanceof Text)) {
                        endContainer =
                            startContainer.childNodes[range.startOffset - 1];
                    }
                    if (endContainer && endContainer instanceof Text) {
                        range.setStart(endContainer, 0);
                        range.collapse(true);
                    }
                }
            }
        }
        return range || null;
    }

    getSelection(): Range {
        const selection = window.getSelection();
        const root = this._root;
        let range: Range | null = null;
        // If not focused, always rely on cached selection; another function may
        // have set it but the DOM is not modified until focus again
        if (this._isFocused && selection && selection.rangeCount) {
            range = selection.getRangeAt(0).cloneRange();
            const startContainer = range.startContainer;
            const endContainer = range.endContainer;
            // FF can return the selection as being inside an <img>. WTF?
            if (startContainer && isLeaf(startContainer)) {
                range.setStartBefore(startContainer);
            }
            if (endContainer && isLeaf(endContainer)) {
                range.setEndBefore(endContainer);
            }
        }
        if (range && root.contains(range.commonAncestorContainer)) {
            this._lastSelection = range;
        } else {
            range = this._lastSelection;
            // Check the editor is in the live document; if not, the range has
            // probably been rewritten by the browser and is bogus
            if (!document.contains(range.commonAncestorContainer)) {
                range = null;
            }
        }
        if (!range) {
            range = createRange(root.firstElementChild || root, 0);
        }
        return range;
    }

    setSelection(range: Range): Squire {
        this._lastSelection = range;
        // If we're setting selection, that automatically, and synchronously,
        // triggers a focus event. So just store the selection and mark it as
        // needing restore on focus.
        if (!this._isFocused) {
            this._enableRestoreSelection();
        } else {
            const selection = window.getSelection();
            if (selection) {
                if ('setBaseAndExtent' in Selection.prototype) {
                    selection.setBaseAndExtent(
                        range.startContainer,
                        range.startOffset,
                        range.endContainer,
                        range.endOffset,
                    );
                } else {
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
        }
        return this;
    }

    // ---

    _moveCursorTo(toStart: boolean): Squire {
        const root = this._root;
        const range = createRange(root, toStart ? 0 : root.childNodes.length);
        moveRangeBoundariesDownTree(range);
        this.setSelection(range);
        return this;
    }

    moveCursorToStart(): Squire {
        return this._moveCursorTo(true);
    }

    moveCursorToEnd(): Squire {
        return this._moveCursorTo(false);
    }

    // ---

    getCursorPosition(): DOMRect {
        const range = this.getSelection();
        let rect = range.getBoundingClientRect();
        // If the range is outside of the viewport, some browsers at least
        // will return 0 for all the values; need to get a DOM node to find
        // the position instead.
        if (rect && !rect.top) {
            this._ignoreChange = true;
            const node = createElement('SPAN');
            node.textContent = ZWS;
            insertNodeInRange(range, node);
            rect = node.getBoundingClientRect();
            const parent = node.parentNode!;
            parent.removeChild(node);
            mergeInlines(parent, range);
        }
        return rect;
    }

    // --- Path

    getPath(): string {
        return this._path;
    }

    _updatePathOnEvent(): void {
        if (this._isFocused) {
            this._updatePath(this.getSelection());
        }
    }

    _updatePath(range: Range, force?: boolean): void {
        const anchor = range.startContainer;
        const focus = range.endContainer;
        let newPath: string;
        if (
            force ||
            anchor !== this._lastAnchorNode ||
            focus !== this._lastFocusNode
        ) {
            this._lastAnchorNode = anchor;
            this._lastFocusNode = focus;
            newPath =
                anchor && focus
                    ? anchor === focus
                        ? this._getPath(focus)
                        : '(selection)'
                    : '';
            if (this._path !== newPath) {
                this._path = newPath;
                this.fireEvent('pathChange', {
                    path: newPath,
                });
            }
        }
        this.fireEvent(range.collapsed ? 'cursor' : 'select', {
            range: range,
        });
    }

    _getPath(node: Node) {
        const root = this._root;
        const config = this._config;
        let path = '';
        if (node && node !== root) {
            const parent = node.parentNode;
            path = parent ? this._getPath(parent) : '';
            if (node instanceof HTMLElement) {
                const id = node.id;
                const classList = node.classList;
                const classNames = Array.from(classList).sort();
                const dir = node.dir;
                const styleNames = config.classNames;
                path += (path ? '>' : '') + node.nodeName;
                if (id) {
                    path += '#' + id;
                }
                if (classNames.length) {
                    path += '.';
                    path += classNames.join('.');
                }
                if (dir) {
                    path += '[dir=' + dir + ']';
                }
                if (classList.contains(styleNames.highlight)) {
                    path +=
                        '[backgroundColor=' +
                        node.style.backgroundColor.replace(/ /g, '') +
                        ']';
                }
                if (classList.contains(styleNames.color)) {
                    path +=
                        '[color=' + node.style.color.replace(/ /g, '') + ']';
                }
                if (classList.contains(styleNames.fontFamily)) {
                    path +=
                        '[fontFamily=' +
                        node.style.fontFamily.replace(/ /g, '') +
                        ']';
                }
                if (classList.contains(styleNames.fontSize)) {
                    path += '[fontSize=' + node.style.fontSize + ']';
                }
            }
        }
        return path;
    }

    // --- History

    modifyDocument(modificationFn: () => void): Squire {
        const mutation = this._mutation;
        if (mutation) {
            if (mutation.takeRecords().length) {
                this._docWasChanged();
            }
            mutation.disconnect();
        }

        this._ignoreAllChanges = true;
        modificationFn();
        this._ignoreAllChanges = false;

        if (mutation) {
            mutation.observe(this._root, {
                childList: true,
                attributes: true,
                characterData: true,
                subtree: true,
            });
            this._ignoreChange = false;
        }

        return this;
    }

    _docWasChanged(): void {
        resetNodeCategoryCache();
        this._mayHaveZWS = true;
        if (this._ignoreAllChanges) {
            return;
        }

        if (this._ignoreChange) {
            this._ignoreChange = false;
            return;
        }
        if (this._isInUndoState) {
            this._isInUndoState = false;
            this.fireEvent('undoStateChange', {
                canUndo: true,
                canRedo: false,
            });
        }
        this.fireEvent('input');
    }

    /**
     * Leaves bookmark.
     */
    _recordUndoState(range: Range, replace?: boolean): Squire {
        // Don't record if we're already in an undo state
        if (!this._isInUndoState || replace) {
            // Advance pointer to new position
            let undoIndex = this._undoIndex;
            const undoStack = this._undoStack;
            const undoConfig = this._config.undo;
            const undoThreshold = undoConfig.documentSizeThreshold;
            const undoLimit = undoConfig.undoLimit;

            if (!replace) {
                undoIndex += 1;
            }

            // Truncate stack if longer (i.e. if has been previously undone)
            if (undoIndex < this._undoStackLength) {
                undoStack.length = this._undoStackLength = undoIndex;
            }

            // Get data
            if (range) {
                this._saveRangeToBookmark(range);
            }
            const html = this._getRawHTML();

            // If this document is above the configured size threshold,
            // limit the number of saved undo states.
            // Threshold is in bytes, JS uses 2 bytes per character
            if (undoThreshold > -1 && html.length * 2 > undoThreshold) {
                if (undoLimit > -1 && undoIndex > undoLimit) {
                    undoStack.splice(0, undoIndex - undoLimit);
                    undoIndex = undoLimit;
                    this._undoStackLength = undoLimit;
                }
            }

            // Save data
            undoStack[undoIndex] = html;
            this._undoIndex = undoIndex;
            this._undoStackLength += 1;
            this._isInUndoState = true;
        }
        return this;
    }

    saveUndoState(range?: Range): Squire {
        if (!range) {
            range = this.getSelection();
        }
        this._recordUndoState(range, this._isInUndoState);
        this._getRangeAndRemoveBookmark(range);

        return this;
    }

    undo(): Squire {
        // Sanity check: must not be at beginning of the history stack
        if (this._undoIndex !== 0 || !this._isInUndoState) {
            // Make sure any changes since last checkpoint are saved.
            this._recordUndoState(this.getSelection(), false);
            this._undoIndex -= 1;
            this._setRawHTML(this._undoStack[this._undoIndex]);
            const range = this._getRangeAndRemoveBookmark();
            if (range) {
                this.setSelection(range);
            }
            this._isInUndoState = true;
            this.fireEvent('undoStateChange', {
                canUndo: this._undoIndex !== 0,
                canRedo: true,
            });
            this.fireEvent('input');
        }
        return this.focus();
    }

    redo(): Squire {
        // Sanity check: must not be at end of stack and must be in an undo
        // state.
        const undoIndex = this._undoIndex;
        const undoStackLength = this._undoStackLength;
        if (undoIndex + 1 < undoStackLength && this._isInUndoState) {
            this._undoIndex += 1;
            this._setRawHTML(this._undoStack[this._undoIndex]);
            const range = this._getRangeAndRemoveBookmark();
            if (range) {
                this.setSelection(range);
            }
            this.fireEvent('undoStateChange', {
                canUndo: true,
                canRedo: undoIndex + 2 < undoStackLength,
            });
            this.fireEvent('input');
        }
        return this.focus();
    }

    // --- Get and set data

    getRoot(): HTMLElement {
        return this._root;
    }

    _getRawHTML(): string {
        return this._root.innerHTML;
    }

    _setRawHTML(html: string): Squire {
        const root = this._root;
        root.innerHTML = html;

        let node: Element | null = root;
        const child = node.firstChild;
        if (!child || child.nodeName === 'BR') {
            const block = this.createDefaultBlock();
            if (child) {
                node.replaceChild(block, child);
            } else {
                node.appendChild(block);
            }
        } else {
            while ((node = getNextBlock(node, root))) {
                fixCursor(node);
            }
        }

        this._ignoreChange = true;

        return this;
    }

    getHTML(withBookmark?: boolean): string {
        let range: Range | undefined;
        if (withBookmark) {
            range = this.getSelection();
            this._saveRangeToBookmark(range);
        }
        const html = this._getRawHTML().replace(/\u200B/g, '');
        if (withBookmark) {
            this._getRangeAndRemoveBookmark(range);
        }
        return html;
    }

    setHTML(html: string): Squire {
        // Parse HTML into DOM tree
        const frag = this._config.sanitizeToDOMFragment(html, this);
        const root = this._root;

        // Fixup DOM tree
        cleanTree(frag, this._config);
        cleanupBRs(frag, root, false);
        fixContainer(frag, root);

        // Fix cursor
        let node: DocumentFragment | HTMLElement | null = frag;
        let child = node.firstChild;
        if (!child || child.nodeName === 'BR') {
            const block = this.createDefaultBlock();
            if (child) {
                node.replaceChild(block, child);
            } else {
                node.appendChild(block);
            }
        } else {
            while ((node = getNextBlock(node, root))) {
                fixCursor(node);
            }
        }

        // Don't fire an input event
        this._ignoreChange = true;

        // Remove existing root children and insert new content
        while ((child = root.lastChild)) {
            root.removeChild(child);
        }
        root.appendChild(frag);

        // Reset the undo stack
        this._undoIndex = -1;
        this._undoStack.length = 0;
        this._undoStackLength = 0;
        this._isInUndoState = false;

        // Record undo state
        const range =
            this._getRangeAndRemoveBookmark() ||
            createRange(root.firstElementChild || root, 0);
        this.saveUndoState(range);

        // Set inital selection
        this.setSelection(range);
        this._updatePath(range, true);

        return this;
    }

    /**
     * Insert HTML at the cursor location. If the selection is not collapsed
     * insertTreeFragmentIntoRange will delete the selection so that it is
     * replaced by the html being inserted.
     */
    insertHTML(html: string, isPaste?: boolean): Squire {
        // Parse
        const config = this._config;
        let frag = config.sanitizeToDOMFragment(html, this);

        // Record undo checkpoint
        const range = this.getSelection();
        this.saveUndoState(range);

        try {
            const root = this._root;

            if (config.addLinks) {
                this.addDetectedLinks(frag, frag);
            }
            cleanTree(frag, this._config);
            cleanupBRs(frag, root, false);
            removeEmptyInlines(frag);
            frag.normalize();

            let node: HTMLElement | DocumentFragment | null = frag;
            while ((node = getNextBlock(node, frag))) {
                fixCursor(node);
            }

            let doInsert = true;
            if (isPaste) {
                const event = new CustomEvent('willPaste', {
                    detail: {
                        fragment: frag,
                    },
                });
                this.fireEvent('willPaste', event);
                frag = event.detail.fragment;
                doInsert = !event.defaultPrevented;
            }

            if (doInsert) {
                insertTreeFragmentIntoRange(range, frag, root);
                range.collapse(false);

                // After inserting the fragment, check whether the cursor is
                // inside an <a> element and if so if there is an equivalent
                // cursor position after the <a> element. If there is, move it
                // there.
                moveRangeBoundaryOutOf(range, 'A', root);

                this._ensureBottomLine();
            }

            this.setSelection(range);
            this._updatePath(range, true);
            // Safari sometimes loses focus after paste. Weird.
            if (isPaste) {
                this.focus();
            }
        } catch (error) {
            this._config.didError(error);
        }
        return this;
    }

    insertElement(el: Element, range?: Range): Squire {
        if (!range) {
            range = this.getSelection();
        }
        range.collapse(true);
        if (isInline(el)) {
            insertNodeInRange(range, el);
            range.setStartAfter(el);
        } else {
            // Get containing block node.
            const root = this._root;
            const startNode: HTMLElement | null = getStartBlockOfRange(
                range,
                root,
            );
            let splitNode: Element | Node = startNode || root;

            let nodeAfterSplit: Node | null = null;
            // While at end of container node, move up DOM tree.
            while (splitNode !== root && !splitNode.nextSibling) {
                splitNode = splitNode.parentNode!;
            }
            // If in the middle of a container node, split up to root.
            if (splitNode !== root) {
                const parent = splitNode.parentNode!;
                nodeAfterSplit = split(
                    parent,
                    splitNode.nextSibling,
                    root,
                    root,
                ) as Node;
            }

            // If the startNode was empty remove it so that we don't end up
            // with two blank lines.
            if (startNode && isEmptyBlock(startNode)) {
                detach(startNode);
            }

            // Insert element and blank line.
            root.insertBefore(el, nodeAfterSplit);
            const blankLine = this.createDefaultBlock();
            root.insertBefore(blankLine, nodeAfterSplit);

            // Move cursor to blank line after inserted element.
            range.setStart(blankLine, 0);
            range.setEnd(blankLine, 0);
            moveRangeBoundariesDownTree(range);
        }
        this.focus();
        this.setSelection(range);
        this._updatePath(range);

        return this;
    }

    insertImage(
        src: string,
        attributes: Record<string, string>,
    ): HTMLImageElement {
        const img = createElement(
            'IMG',
            Object.assign(
                {
                    src: src,
                },
                attributes,
            ),
        ) as HTMLImageElement;
        this.insertElement(img);
        return img;
    }

    insertPlainText(plainText: string, isPaste: boolean): Squire {
        const range = this.getSelection();
        if (
            range.collapsed &&
            getNearest(range.startContainer, this._root, 'PRE')
        ) {
            const startContainer: Node = range.startContainer;
            let offset = range.startOffset;
            let textNode: Text;
            if (!startContainer || !(startContainer instanceof Text)) {
                const text = document.createTextNode('');
                startContainer.insertBefore(
                    text,
                    startContainer.childNodes[offset],
                );
                textNode = text;
                offset = 0;
            } else {
                textNode = startContainer;
            }
            let doInsert = true;
            if (isPaste) {
                const event = new CustomEvent('willPaste', {
                    detail: {
                        text: plainText,
                    },
                });
                this.fireEvent('willPaste', event);
                plainText = event.detail.text;
                doInsert = !event.defaultPrevented;
            }

            if (doInsert) {
                textNode.insertData(offset, plainText);
                range.setStart(textNode, offset + plainText.length);
                range.collapse(true);
            }
            this.setSelection(range);
            return this;
        }
        const lines = plainText.split('\n');
        const config = this._config;
        const tag = config.blockTag;
        const attributes = config.blockAttributes;
        const closeBlock = '</' + tag + '>';
        let openBlock = '<' + tag;

        for (const attr in attributes) {
            openBlock += ' ' + attr + '="' + escapeHTML(attributes[attr]) + '"';
        }
        openBlock += '>';

        for (let i = 0, l = lines.length; i < l; i += 1) {
            let line = lines[i];
            line = escapeHTML(line).replace(/ (?=(?: |$))/g, '&nbsp;');
            // We don't wrap the first line in the block, so if it gets inserted
            // into a blank line it keeps that line's formatting.
            // Wrap each line in <div></div>
            if (i) {
                line = openBlock + (line || '<BR>') + closeBlock;
            }
            lines[i] = line;
        }
        return this.insertHTML(lines.join(''), isPaste);
    }

    getSelectedText(range?: Range): string {
        return getTextContentsOfRange(range || this.getSelection());
    }

    // --- Inline formatting

    /**
     * Extracts the font-family and font-size (if any) of the element
     * holding the cursor. If there's a selection, returns an empty object.
     */
    getFontInfo(range?: Range): Record<string, string | undefined> {
        const fontInfo = {
            color: undefined,
            backgroundColor: undefined,
            fontFamily: undefined,
            fontSize: undefined,
        } as Record<string, string | undefined>;

        if (!range) {
            range = this.getSelection();
        }

        let seenAttributes = 0;
        let element: Node | null = range.commonAncestorContainer;
        if (range.collapsed || element instanceof Text) {
            if (element instanceof Text) {
                element = element.parentNode!;
            }
            while (seenAttributes < 4 && element) {
                const style = (element as HTMLElement).style;
                if (style) {
                    const color = style.color;
                    if (!fontInfo.color && color) {
                        fontInfo.color = color;
                        seenAttributes += 1;
                    }
                    const backgroundColor = style.backgroundColor;
                    if (!fontInfo.backgroundColor && backgroundColor) {
                        fontInfo.backgroundColor = backgroundColor;
                        seenAttributes += 1;
                    }
                    const fontFamily = style.fontFamily;
                    if (!fontInfo.fontFamily && fontFamily) {
                        fontInfo.fontFamily = fontFamily;
                        seenAttributes += 1;
                    }
                    const fontSize = style.fontSize;
                    if (!fontInfo.fontSize && fontSize) {
                        fontInfo.fontSize = fontSize;
                        seenAttributes += 1;
                    }
                }
                element = element.parentNode;
            }
        }
        return fontInfo;
    }

    /**
     * Looks for matching tag and attributes, so won't work if <strong>
     * instead of <b> etc.
     */
    hasFormat(
        tag: string,
        attributes?: Record<string, string> | null,
        range?: Range,
    ): boolean {
        // 1. Normalise the arguments and get selection
        tag = tag.toUpperCase();
        if (!attributes) {
            attributes = {};
        }
        if (!range) {
            range = this.getSelection();
        }

        // Move range up one level in the DOM tree if at the edge of a text
        // node, so we don't consider it included when it's not really.
        if (
            !range.collapsed &&
            range.startContainer instanceof Text &&
            range.startOffset === range.startContainer.length &&
            range.startContainer.nextSibling
        ) {
            range.setStartBefore(range.startContainer.nextSibling);
        }
        if (
            !range.collapsed &&
            range.endContainer instanceof Text &&
            range.endOffset === 0 &&
            range.endContainer.previousSibling
        ) {
            range.setEndAfter(range.endContainer.previousSibling);
        }

        // If the common ancestor is inside the tag we require, we definitely
        // have the format.
        const root = this._root;
        const common = range.commonAncestorContainer;
        if (getNearest(common, root, tag, attributes)) {
            return true;
        }

        // If common ancestor is a text node and doesn't have the format, we
        // definitely don't have it.
        if (common instanceof Text) {
            return false;
        }

        // Otherwise, check each text node at least partially contained within
        // the selection and make sure all of them have the format we want.
        const walker = new TreeIterator<Text>(common, SHOW_TEXT, (node) => {
            return isNodeContainedInRange(range!, node, true);
        });

        let seenNode = false;
        let node: Node | null;
        while ((node = walker.nextNode())) {
            if (!getNearest(node, root, tag, attributes)) {
                return false;
            }
            seenNode = true;
        }

        return seenNode;
    }

    changeFormat(
        add: { tag: string; attributes?: Record<string, string> } | null,
        remove?: { tag: string; attributes?: Record<string, string> } | null,
        range?: Range,
        partial?: boolean,
    ): Squire {
        // Normalise the arguments and get selection
        if (!range) {
            range = this.getSelection();
        }

        // Save undo checkpoint
        this.saveUndoState(range);

        if (remove) {
            range = this._removeFormat(
                remove.tag.toUpperCase(),
                remove.attributes || {},
                range,
                partial,
            );
        }
        if (add) {
            range = this._addFormat(
                add.tag.toUpperCase(),
                add.attributes || {},
                range,
            );
        }

        this.setSelection(range);
        this._updatePath(range, true);

        return this.focus();
    }

    _addFormat(
        tag: string,
        attributes: Record<string, string> | null,
        range: Range,
    ): Range {
        // If the range is collapsed we simply insert the node by wrapping
        // it round the range and focus it.
        const root = this._root;
        if (range.collapsed) {
            const el = fixCursor(createElement(tag, attributes));
            insertNodeInRange(range, el);
            const focusNode = el.firstChild || el;
            // Focus after the ZWS if present
            const focusOffset =
                focusNode instanceof Text ? focusNode.length : 0;
            range.setStart(focusNode, focusOffset);
            range.collapse(true);

            // Clean up any previous formats that may have been set on this
            // block that are unused.
            let block = el;
            while (isInline(block)) {
                block = block.parentNode!;
            }
            removeZWS(block, el);
            // Otherwise we find all the textnodes in the range (splitting
            // partially selected nodes) and if they're not already formatted
            // correctly we wrap them in the appropriate tag.
        } else {
            // Create an iterator to walk over all the text nodes under this
            // ancestor which are in the range and not already formatted
            // correctly.
            //
            // In Blink/WebKit, empty blocks may have no text nodes, just a
            // <br>. Therefore we wrap this in the tag as well, as this will
            // then cause it to apply when the user types something in the
            // block, which is presumably what was intended.
            //
            // IMG tags are included because we may want to create a link around
            // them, and adding other styles is harmless.
            const walker = new TreeIterator<Element | Text>(
                range.commonAncestorContainer,
                SHOW_ELEMENT_OR_TEXT,
                (node: Node) => {
                    return (
                        (node instanceof Text ||
                            node.nodeName === 'BR' ||
                            node.nodeName === 'IMG') &&
                        isNodeContainedInRange(range, node, true)
                    );
                },
            );

            // Start at the beginning node of the range and iterate through
            // all the nodes in the range that need formatting.
            let { startContainer, startOffset, endContainer, endOffset } =
                range;

            // Make sure we start with a valid node.
            walker.currentNode = startContainer;
            if (
                (!(startContainer instanceof Element) &&
                    !(startContainer instanceof Text)) ||
                !walker.filter(startContainer)
            ) {
                const next = walker.nextNode();
                // If there are no interesting nodes in the selection, abort
                if (!next) {
                    return range;
                }
                startContainer = next;
                startOffset = 0;
            }

            do {
                let node = walker.currentNode;
                const needsFormat = !getNearest(node, root, tag, attributes);
                if (needsFormat) {
                    // <br> can never be a container node, so must have a text
                    // node if node == (end|start)Container
                    if (
                        node === endContainer &&
                        (node as Text).length > endOffset
                    ) {
                        (node as Text).splitText(endOffset);
                    }
                    if (node === startContainer && startOffset) {
                        node = (node as Text).splitText(startOffset);
                        if (endContainer === startContainer) {
                            endContainer = node;
                            endOffset -= startOffset;
                        } else if (endContainer === startContainer.parentNode) {
                            endOffset += 1;
                        }
                        startContainer = node;
                        startOffset = 0;
                    }
                    const el = createElement(tag, attributes);
                    replaceWith(node, el);
                    el.appendChild(node);
                }
            } while (walker.nextNode());

            // Now set the selection to as it was before
            range = createRange(
                startContainer,
                startOffset,
                endContainer,
                endOffset,
            );
        }
        return range;
    }

    _removeFormat(
        tag: string,
        attributes: Record<string, string>,
        range: Range,
        partial?: boolean,
    ): Range {
        // Add bookmark
        this._saveRangeToBookmark(range);

        // We need a node in the selection to break the surrounding
        // formatted text.
        let fixer: Node | Text | null | undefined;
        if (range.collapsed) {
            if (cantFocusEmptyTextNodes) {
                fixer = document.createTextNode(ZWS);
            } else {
                fixer = document.createTextNode('');
            }
            insertNodeInRange(range, fixer!);
        }

        // Find block-level ancestor of selection
        let root = range.commonAncestorContainer;
        while (isInline(root)) {
            root = root.parentNode!;
        }

        // Find text nodes inside formatTags that are not in selection and
        // add an extra tag with the same formatting.
        const startContainer = range.startContainer;
        const startOffset = range.startOffset;
        const endContainer = range.endContainer;
        const endOffset = range.endOffset;
        const toWrap: [Node, Node][] = [];
        const examineNode = (node: Node, exemplar: Node) => {
            // If the node is completely contained by the range then
            // we're going to remove all formatting so ignore it.
            if (isNodeContainedInRange(range, node, false)) {
                return;
            }

            let child: Node;
            let next: Node;

            // If not at least partially contained, wrap entire contents
            // in a clone of the tag we're removing and we're done.
            if (!isNodeContainedInRange(range, node, true)) {
                // Ignore bookmarks and empty text nodes
                if (
                    !(node instanceof HTMLInputElement) &&
                    (!(node instanceof Text) || node.data)
                ) {
                    toWrap.push([exemplar, node]);
                }
                return;
            }

            // Split any partially selected text nodes.
            if (node instanceof Text) {
                if (node === endContainer && endOffset !== node.length) {
                    toWrap.push([exemplar, node.splitText(endOffset)]);
                }
                if (node === startContainer && startOffset) {
                    node.splitText(startOffset);
                    toWrap.push([exemplar, node]);
                }
            } else {
                // If not a text node, recurse onto all children.
                // Beware, the tree may be rewritten with each call
                // to examineNode, hence find the next sibling first.
                for (child = node.firstChild!; child; child = next) {
                    next = child.nextSibling!;
                    examineNode(child, exemplar);
                }
            }
        };
        const formatTags = Array.from(
            (root as Element).getElementsByTagName(tag),
        ).filter((el: Node): boolean => {
            return (
                isNodeContainedInRange(range, el, true) &&
                hasTagAttributes(el, tag, attributes)
            );
        });

        if (!partial) {
            formatTags.forEach((node: Node) => {
                examineNode(node, node);
            });
        }

        // Now wrap unselected nodes in the tag
        toWrap.forEach(([el, node]) => {
            el = el.cloneNode(false);
            replaceWith(node, el);
            el.appendChild(node);
        });
        // and remove old formatting tags.
        formatTags.forEach((el: Element) => {
            replaceWith(el, empty(el));
        });

        if (cantFocusEmptyTextNodes && fixer) {
            // Clean up any previous ZWS in this block. They are not needed,
            // and this works around a Chrome bug where it doesn't render the
            // text in some situations with multiple ZWS(!)
            fixer = fixer.parentNode;
            let block = fixer;
            while (block && isInline(block)) {
                block = block.parentNode;
            }
            if (block) {
                removeZWS(block, fixer);
            }
        }

        // Merge adjacent inlines:
        this._getRangeAndRemoveBookmark(range);
        if (fixer) {
            range.collapse(false);
        }
        mergeInlines(root, range);

        return range;
    }

    // ---

    bold(): Squire {
        return this.changeFormat({ tag: 'B' });
    }

    removeBold(): Squire {
        return this.changeFormat(null, { tag: 'B' });
    }

    italic(): Squire {
        return this.changeFormat({ tag: 'I' });
    }

    removeItalic(): Squire {
        return this.changeFormat(null, { tag: 'I' });
    }

    underline(): Squire {
        return this.changeFormat({ tag: 'U' });
    }

    removeUnderline(): Squire {
        return this.changeFormat(null, { tag: 'U' });
    }

    strikethrough(): Squire {
        return this.changeFormat({ tag: 'S' });
    }

    removeStrikethrough(): Squire {
        return this.changeFormat(null, { tag: 'S' });
    }

    subscript(): Squire {
        return this.changeFormat({ tag: 'SUB' }, { tag: 'SUP' });
    }

    removeSubscript(): Squire {
        return this.changeFormat(null, { tag: 'SUB' });
    }

    superscript(): Squire {
        return this.changeFormat({ tag: 'SUP' }, { tag: 'SUB' });
    }

    removeSuperscript(): Squire {
        return this.changeFormat(null, { tag: 'SUP' });
    }

    // ---

    makeLink(url: string, attributes?: Record<string, string>): Squire {
        const range = this.getSelection();
        if (range.collapsed) {
            let protocolEnd = url.indexOf(':') + 1;
            if (protocolEnd) {
                while (url[protocolEnd] === '/') {
                    protocolEnd += 1;
                }
            }
            insertNodeInRange(
                range,
                document.createTextNode(url.slice(protocolEnd)),
            );
        }
        attributes = Object.assign(
            {
                href: url,
            },
            this._config.tagAttributes.a,
            attributes,
        );

        return this.changeFormat(
            {
                tag: 'A',
                attributes: attributes as Record<string, string>,
            },
            {
                tag: 'A',
            },
            range,
        );
    }

    removeLink(): Squire {
        return this.changeFormat(
            null,
            {
                tag: 'A',
            },
            this.getSelection(),
            true,
        );
    }

    /*
    linkRegExp = new RegExp(
        // Only look on boundaries
        '\\b(?:' +
        // Capture group 1: URLs
        '(' +
            // Add links to URLS
            // Starts with:
            '(?:' +
                // http(s):// or ftp://
                '(?:ht|f)tps?:\\/\\/' +
                // or
                '|' +
                // www.
                'www\\d{0,3}[.]' +
                // or
                '|' +
                // foo90.com/
                '[a-z0-9][a-z0-9.\\-]*[.][a-z]{2,}\\/' +
            ')' +
            // Then we get one or more:
            '(?:' +
                // Run of non-spaces, non ()<>
                '[^\\s()<>]+' +
                // or
                '|' +
                // balanced parentheses (one level deep only)
                '\\([^\\s()<>]+\\)' +
            ')+' +
            // And we finish with
            '(?:' +
                // Not a space or punctuation character
                '[^\\s?&`!()\\[\\]{};:\'".,<>«»“”‘’]' +
                // or
                '|' +
                // Balanced parentheses.
                '\\([^\\s()<>]+\\)' +
            ')' +
        // Capture group 2: Emails
        ')|(' +
            // Add links to emails
            '[\\w\\-.%+]+@(?:[\\w\\-]+\\.)+[a-z]{2,}\\b' +
            // Allow query parameters in the mailto: style
            '(?:' +
                '[?][^&?\\s]+=[^\\s?&`!()\\[\\]{};:\'".,<>«»“”‘’]+' +
                '(?:&[^&?\\s]+=[^\\s?&`!()\\[\\]{};:\'".,<>«»“”‘’]+)*' +
            ')?' +
        '))',
        'i'
    );
    */
    linkRegExp =
        /\b(?:((?:(?:ht|f)tps?:\/\/|www\d{0,3}[.]|[a-z0-9][a-z0-9.\-]*[.][a-z]{2,}\/)(?:[^\s()<>]+|\([^\s()<>]+\))+(?:[^\s?&`!()\[\]{};:'".,<>«»“”‘’]|\([^\s()<>]+\)))|([\w\-.%+]+@(?:[\w\-]+\.)+[a-z]{2,}\b(?:[?][^&?\s]+=[^\s?&`!()\[\]{};:'".,<>«»“”‘’]+(?:&[^&?\s]+=[^\s?&`!()\[\]{};:'".,<>«»“”‘’]+)*)?))/i;

    addDetectedLinks(
        searchInNode: DocumentFragment | Node,
        root?: DocumentFragment | HTMLElement,
    ): Squire {
        const walker = new TreeIterator<Text>(
            searchInNode,
            SHOW_TEXT,
            (node) => !getNearest(node, root || this._root, 'A'),
        );
        const linkRegExp = this.linkRegExp;
        const defaultAttributes = this._config.tagAttributes.a;
        let node: Text | null;
        while ((node = walker.nextNode())) {
            const parent = node.parentNode!;
            let data = node.data;
            let match: RegExpExecArray | null;
            while ((match = linkRegExp.exec(data))) {
                const index = match.index;
                const endIndex = index + match[0].length;
                if (index) {
                    parent.insertBefore(
                        document.createTextNode(data.slice(0, index)),
                        node,
                    );
                }
                const child = createElement(
                    'A',
                    Object.assign(
                        {
                            href: match[1]
                                ? /^(?:ht|f)tps?:/i.test(match[1])
                                    ? match[1]
                                    : 'http://' + match[1]
                                : 'mailto:' + match[0],
                        },
                        defaultAttributes,
                    ),
                );
                child.textContent = data.slice(index, endIndex);
                parent.insertBefore(child, node);
                node.data = data = data.slice(endIndex);
            }
        }
        return this;
    }

    // ---

    setFontFace(name: string | null): Squire {
        const className = this._config.classNames.fontFamily;
        return this.changeFormat(
            name
                ? {
                      tag: 'SPAN',
                      attributes: {
                          class: className,
                          style: 'font-family: ' + name + ', sans-serif;',
                      },
                  }
                : null,
            {
                tag: 'SPAN',
                attributes: { class: className },
            },
        );
    }

    setFontSize(size: string | null): Squire {
        const className = this._config.classNames.fontSize;
        return this.changeFormat(
            size
                ? {
                      tag: 'SPAN',
                      attributes: {
                          class: className,
                          style:
                              'font-size: ' +
                              (typeof size === 'number' ? size + 'px' : size),
                      },
                  }
                : null,
            {
                tag: 'SPAN',
                attributes: { class: className },
            },
        );
    }

    setTextColor(color: string | null): Squire {
        const className = this._config.classNames.color;
        return this.changeFormat(
            color
                ? {
                      tag: 'SPAN',
                      attributes: {
                          class: className,
                          style: 'color:' + color,
                      },
                  }
                : null,
            {
                tag: 'SPAN',
                attributes: { class: className },
            },
        );
    }

    setHighlightColor(color: string | null): Squire {
        const className = this._config.classNames.highlight;
        return this.changeFormat(
            color
                ? {
                      tag: 'SPAN',
                      attributes: {
                          class: className,
                          style: 'background-color:' + color,
                      },
                  }
                : null,
            {
                tag: 'SPAN',
                attributes: { class: className },
            },
        );
    }

    // --- Block formatting

    _ensureBottomLine(): void {
        const root = this._root;
        const last = root.lastElementChild;
        if (
            !last ||
            last.nodeName !== this._config.blockTag ||
            !isBlock(last)
        ) {
            root.appendChild(this.createDefaultBlock());
        }
    }

    createDefaultBlock(children?: Node[]): HTMLElement {
        const config = this._config;
        return fixCursor(
            createElement(config.blockTag, config.blockAttributes, children),
        ) as HTMLElement;
    }

    tagAfterSplit: Record<string, string> = {
        DT: 'DD',
        DD: 'DT',
        LI: 'LI',
        PRE: 'PRE',
    };

    splitBlock(lineBreakOnly: boolean, range?: Range): Squire {
        if (!range) {
            range = this.getSelection();
        }
        const root = this._root;
        let block: Node | Element | null;
        let parent: Node | null;
        let node: Node;
        let nodeAfterSplit: Node;

        // Save undo checkpoint and remove any zws so we don't think there's
        // content in an empty block.
        this._recordUndoState(range);
        this._removeZWS();
        this._getRangeAndRemoveBookmark(range);

        // Selected text is overwritten, therefore delete the contents
        // to collapse selection.
        if (!range.collapsed) {
            deleteContentsOfRange(range, root);
        }

        // Linkify text
        if (this._config.addLinks) {
            moveRangeBoundariesDownTree(range);
            const textNode = range.startContainer as Text;
            const offset = range.startOffset;
            setTimeout(() => {
                linkifyText(this, textNode, offset);
            }, 0);
        }

        block = getStartBlockOfRange(range, root);

        // Inside a PRE, insert literal newline, unless on blank line.
        if (block && (parent = getNearest(block, root, 'PRE'))) {
            moveRangeBoundariesDownTree(range);
            node = range.startContainer;
            const offset = range.startOffset;
            if (!(node instanceof Text)) {
                node = document.createTextNode('');
                parent.insertBefore(node, parent.firstChild);
            }
            // If blank line: split and insert default block
            if (
                !lineBreakOnly &&
                node instanceof Text &&
                (node.data.charAt(offset - 1) === '\n' ||
                    rangeDoesStartAtBlockBoundary(range, root)) &&
                (node.data.charAt(offset) === '\n' ||
                    rangeDoesEndAtBlockBoundary(range, root))
            ) {
                node.deleteData(offset && offset - 1, offset ? 2 : 1);
                nodeAfterSplit = split(
                    node,
                    offset && offset - 1,
                    root,
                    root,
                ) as Node;
                node = nodeAfterSplit.previousSibling!;
                if (!node.textContent) {
                    detach(node);
                }
                node = this.createDefaultBlock();
                nodeAfterSplit.parentNode!.insertBefore(node, nodeAfterSplit);
                if (!nodeAfterSplit.textContent) {
                    detach(nodeAfterSplit);
                }
                range.setStart(node, 0);
            } else {
                (node as Text).insertData(offset, '\n');
                fixCursor(parent);
                // Firefox bug: if you set the selection in the text node after
                // the new line, it draws the cursor before the line break still
                // but if you set the selection to the equivalent position
                // in the parent, it works.
                if ((node as Text).length === offset + 1) {
                    range.setStartAfter(node);
                } else {
                    range.setStart(node, offset + 1);
                }
            }
            range.collapse(true);
            this.setSelection(range);
            this._updatePath(range, true);
            this._docWasChanged();
            return this;
        }

        // If this is a malformed bit of document or in a table;
        // just play it safe and insert a <br>.
        if (!block || lineBreakOnly || /^T[HD]$/.test(block.nodeName)) {
            // If inside an <a>, move focus out
            moveRangeBoundaryOutOf(range, 'A', root);
            insertNodeInRange(range, createElement('BR'));
            range.collapse(false);
            this.setSelection(range);
            this._updatePath(range, true);
            return this;
        }

        // If in a list, we'll split the LI instead.
        if ((parent = getNearest(block, root, 'LI'))) {
            block = parent;
        }

        if (isEmptyBlock(block as Element)) {
            if (
                getNearest(block, root, 'UL') ||
                getNearest(block, root, 'OL')
            ) {
                // Break list
                this.decreaseListLevel(range);
                return this;
                // Break blockquote
            } else if (getNearest(block, root, 'BLOCKQUOTE')) {
                this.removeQuote(range);
                return this;
            }
        }

        // Otherwise, split at cursor point.
        node = range.startContainer;
        const offset = range.startOffset;
        let splitTag = this.tagAfterSplit[block.nodeName];
        nodeAfterSplit = split(
            node,
            offset,
            block.parentNode!,
            this._root,
        ) as Node;

        const config = this._config;
        let splitProperties: Record<string, string> | null = null;
        if (!splitTag) {
            splitTag = config.blockTag;
            splitProperties = config.blockAttributes;
        }

        // Make sure the new node is the correct type.
        if (!hasTagAttributes(nodeAfterSplit, splitTag, splitProperties)) {
            block = createElement(splitTag, splitProperties);
            if ((nodeAfterSplit as HTMLElement).dir) {
                (block as HTMLElement).dir = (
                    nodeAfterSplit as HTMLElement
                ).dir;
            }
            replaceWith(nodeAfterSplit, block);
            block.appendChild(empty(nodeAfterSplit));
            nodeAfterSplit = block;
        }

        // Clean up any empty inlines if we hit enter at the beginning of the
        // block
        removeZWS(block);
        removeEmptyInlines(block);
        fixCursor(block);

        // Focus cursor
        // If there's a <b>/<i> etc. at the beginning of the split
        // make sure we focus inside it.
        while (nodeAfterSplit instanceof Element) {
            let child = nodeAfterSplit.firstChild;
            let next;

            // Don't continue links over a block break; unlikely to be the
            // desired outcome.
            if (
                nodeAfterSplit.nodeName === 'A' &&
                (!nodeAfterSplit.textContent ||
                    nodeAfterSplit.textContent === ZWS)
            ) {
                child = document.createTextNode('') as Text;
                replaceWith(nodeAfterSplit, child);
                nodeAfterSplit = child;
                break;
            }

            while (child && child instanceof Text && !child.data) {
                next = child.nextSibling;
                if (!next || next.nodeName === 'BR') {
                    break;
                }
                detach(child);
                child = next;
            }

            // 'BR's essentially don't count; they're a browser hack.
            // If you try to select the contents of a 'BR', FF will not let
            // you type anything!
            if (!child || child.nodeName === 'BR' || child instanceof Text) {
                break;
            }
            nodeAfterSplit = child;
        }
        range = createRange(nodeAfterSplit, 0);
        this.setSelection(range);
        this._updatePath(range, true);

        return this;
    }

    forEachBlock(
        fn: (el: HTMLElement) => any,
        mutates: boolean,
        range?: Range,
    ): Squire {
        if (!range) {
            range = this.getSelection();
        }

        // Save undo checkpoint
        if (mutates) {
            this.saveUndoState(range);
        }

        const root = this._root;
        let start = getStartBlockOfRange(range, root);
        const end = getEndBlockOfRange(range, root);
        if (start && end) {
            do {
                if (fn(start) || start === end) {
                    break;
                }
            } while ((start = getNextBlock(start, root)));
        }

        if (mutates) {
            this.setSelection(range);
            // Path may have changed
            this._updatePath(range, true);
        }
        return this;
    }

    modifyBlocks(modify: (x: DocumentFragment) => Node, range?: Range): Squire {
        if (!range) {
            range = this.getSelection();
        }

        // 1. Save undo checkpoint and bookmark selection
        this._recordUndoState(range, this._isInUndoState);

        // 2. Expand range to block boundaries
        const root = this._root;
        expandRangeToBlockBoundaries(range, root);

        // 3. Remove range.
        moveRangeBoundariesUpTree(range, root, root, root);
        const frag = extractContentsOfRange(range, root, root);

        // 4. Modify tree of fragment and reinsert.
        if (!range.collapsed) {
            // After extracting contents, the range edges will still be at the
            // level we began the spilt. We want to insert directly in the
            // root, so move the range up there.
            let node = range.endContainer;
            if (node === root) {
                range.collapse(false);
            } else {
                while (node.parentNode !== root) {
                    node = node.parentNode!;
                }
                range.setStartBefore(node);
                range.collapse(true);
            }
        }
        insertNodeInRange(range, modify.call(this, frag));

        // 5. Merge containers at edges
        if (range.endOffset < range.endContainer.childNodes.length) {
            mergeContainers(
                range.endContainer.childNodes[range.endOffset],
                root,
            );
        }
        mergeContainers(
            range.startContainer.childNodes[range.startOffset],
            root,
        );

        // 6. Restore selection
        this._getRangeAndRemoveBookmark(range);
        this.setSelection(range);
        this._updatePath(range, true);

        return this;
    }

    // ---

    setTextAlignment(alignment: string): Squire {
        this.forEachBlock((block: HTMLElement) => {
            const className = block.className
                .split(/\s+/)
                .filter((klass) => {
                    return !!klass && !/^align/.test(klass);
                })
                .join(' ');
            if (alignment) {
                block.className = className + ' align-' + alignment;
                block.style.textAlign = alignment;
            } else {
                block.className = className;
                block.style.textAlign = '';
            }
        }, true);
        return this.focus();
    }

    setTextDirection(direction: string | null): Squire {
        this.forEachBlock((block: HTMLElement) => {
            if (direction) {
                block.dir = direction;
            } else {
                block.removeAttribute('dir');
            }
        }, true);
        return this.focus();
    }

    // ---

    _getListSelection(
        range: Range,
        root: Element,
    ): [Node, Node | null, Node | null] | null {
        let list: Node | null = range.commonAncestorContainer;
        let startLi: Node | null = range.startContainer;
        let endLi: Node | null = range.endContainer;
        while (list && list !== root && !/^[OU]L$/.test(list.nodeName)) {
            list = list.parentNode;
        }
        if (!list || list === root) {
            return null;
        }
        if (startLi === list) {
            startLi = startLi.childNodes[range.startOffset];
        }
        if (endLi === list) {
            endLi = endLi.childNodes[range.endOffset];
        }
        while (startLi && startLi.parentNode !== list) {
            startLi = startLi.parentNode;
        }
        while (endLi && endLi.parentNode !== list) {
            endLi = endLi.parentNode;
        }
        return [list, startLi, endLi];
    }

    increaseListLevel(range?: Range) {
        if (!range) {
            range = this.getSelection();
        }

        // Get start+end li in single common ancestor
        const root = this._root;
        const listSelection = this._getListSelection(range, root);
        if (!listSelection) {
            return this.focus();
        }
        // eslint-disable-next-line prefer-const
        let [list, startLi, endLi] = listSelection;
        if (!startLi || startLi === list.firstChild) {
            return this.focus();
        }

        // Save undo checkpoint and bookmark selection
        this._recordUndoState(range, this._isInUndoState);

        // Increase list depth
        const type = list.nodeName;
        let newParent = startLi.previousSibling!;
        let listAttrs: Record<string, string> | null;
        let next: Node | null;
        if (newParent.nodeName !== type) {
            listAttrs = this._config.tagAttributes[type.toLowerCase()];
            newParent = createElement(type, listAttrs);
            list.insertBefore(newParent, startLi);
        }
        do {
            next = startLi === endLi ? null : startLi.nextSibling;
            newParent.appendChild(startLi);
        } while ((startLi = next));
        next = newParent.nextSibling;
        if (next) {
            mergeContainers(next, root);
        }

        // Restore selection
        this._getRangeAndRemoveBookmark(range);
        this.setSelection(range);
        this._updatePath(range, true);

        return this.focus();
    }

    decreaseListLevel(range?: Range) {
        if (!range) {
            range = this.getSelection();
        }

        const root = this._root;
        const listSelection = this._getListSelection(range, root);
        if (!listSelection) {
            return this.focus();
        }

        // eslint-disable-next-line prefer-const
        let [list, startLi, endLi] = listSelection;
        if (!startLi) {
            startLi = list.firstChild;
        }
        if (!endLi) {
            endLi = list.lastChild!;
        }

        // Save undo checkpoint and bookmark selection
        this._recordUndoState(range, this._isInUndoState);

        let next: Node | null;
        let insertBefore: Node | null = null;
        if (startLi) {
            // Find the new parent list node
            let newParent = list.parentNode!;

            // Split list if necessary
            insertBefore = !endLi.nextSibling
                ? list.nextSibling
                : (split(list, endLi.nextSibling, newParent, root) as Node);

            if (newParent !== root && newParent.nodeName === 'LI') {
                newParent = newParent.parentNode!;
                while (insertBefore) {
                    next = insertBefore.nextSibling;
                    endLi.appendChild(insertBefore);
                    insertBefore = next;
                }
                insertBefore = list.parentNode!.nextSibling;
            }

            const makeNotList = !/^[OU]L$/.test(newParent.nodeName);
            do {
                next = startLi === endLi ? null : startLi.nextSibling;
                list.removeChild(startLi);
                if (makeNotList && startLi.nodeName === 'LI') {
                    startLi = this.createDefaultBlock([empty(startLi)]);
                }
                newParent.insertBefore(startLi!, insertBefore);
            } while ((startLi = next));
        }

        if (!list.firstChild) {
            detach(list);
        }

        if (insertBefore) {
            mergeContainers(insertBefore, root);
        }

        // Restore selection
        this._getRangeAndRemoveBookmark(range);
        this.setSelection(range);
        this._updatePath(range, true);

        return this.focus();
    }

    _makeList(frag: DocumentFragment, type: string): DocumentFragment {
        const walker = getBlockWalker(frag, this._root);
        const tagAttributes = this._config.tagAttributes;
        const listAttrs = tagAttributes[type.toLowerCase()];
        const listItemAttrs = tagAttributes.li;
        let node: Node | null;
        while ((node = walker.nextNode())) {
            if (node.parentNode! instanceof HTMLLIElement) {
                node = node.parentNode!;
                walker.currentNode = node.lastChild!;
            }
            if (!(node instanceof HTMLLIElement)) {
                const newLi = createElement('LI', listItemAttrs);
                if ((node as HTMLElement).dir) {
                    newLi.dir = (node as HTMLElement).dir;
                }

                // Have we replaced the previous block with a new <ul>/<ol>?
                const prev: ChildNode | null = node.previousSibling;
                if (prev && prev.nodeName === type) {
                    prev.appendChild(newLi);
                    detach(node);
                    // Otherwise, replace this block with the <ul>/<ol>
                } else {
                    replaceWith(node, createElement(type, listAttrs, [newLi]));
                }
                newLi.appendChild(empty(node));
                walker.currentNode = newLi;
            } else {
                node = node.parentNode;
                const tag = node!.nodeName;
                if (tag !== type && /^[OU]L$/.test(tag)) {
                    replaceWith(
                        node!,
                        createElement(type, listAttrs, [empty(node!)]),
                    );
                }
            }
        }
        return frag;
    }

    makeUnorderedList(): Squire {
        this.modifyBlocks((frag) => this._makeList(frag, 'UL'));
        return this.focus();
    }

    makeOrderedList(): Squire {
        this.modifyBlocks((frag) => this._makeList(frag, 'OL'));
        return this.focus();
    }

    removeList(): Squire {
        this.modifyBlocks((frag) => {
            const lists = frag.querySelectorAll('UL, OL');
            const items = frag.querySelectorAll('LI');
            const root = this._root;
            for (let i = 0, l = lists.length; i < l; i += 1) {
                const list = lists[i];
                const listFrag = empty(list);
                fixContainer(listFrag, root);
                replaceWith(list, listFrag);
            }

            for (let i = 0, l = items.length; i < l; i += 1) {
                const item = items[i];
                if (isBlock(item)) {
                    replaceWith(item, this.createDefaultBlock([empty(item)]));
                } else {
                    fixContainer(item, root);
                    replaceWith(item, empty(item));
                }
            }
            return frag;
        });
        return this.focus();
    }

    // ---

    increaseQuoteLevel(range?: Range): Squire {
        this.modifyBlocks(
            (frag) =>
                createElement(
                    'BLOCKQUOTE',
                    this._config.tagAttributes.blockquote,
                    [frag],
                ),
            range,
        );
        return this.focus();
    }

    decreaseQuoteLevel(range?: Range): Squire {
        this.modifyBlocks((frag) => {
            Array.from(frag.querySelectorAll('blockquote'))
                .filter((el: Node) => {
                    return !getNearest(el.parentNode, frag, 'BLOCKQUOTE');
                })
                .forEach((el: Node) => {
                    replaceWith(el, empty(el));
                });
            return frag;
        }, range);
        return this.focus();
    }

    removeQuote(range?: Range): Squire {
        this.modifyBlocks(
            (/* frag */) =>
                this.createDefaultBlock([
                    createElement('INPUT', {
                        id: this.startSelectionId,
                        type: 'hidden',
                    }),
                    createElement('INPUT', {
                        id: this.endSelectionId,
                        type: 'hidden',
                    }),
                ]),
            range,
        );
        return this.focus();
    }

    // ---

    code(): Squire {
        const range = this.getSelection();
        if (range.collapsed || isContainer(range.commonAncestorContainer)) {
            this.modifyBlocks((frag) => {
                const root = this._root;
                const output = document.createDocumentFragment();
                const blockWalker = getBlockWalker(frag, root);
                let node: Element | Text | null;
                // 1. Extract inline content; drop all blocks and contains.
                while ((node = blockWalker.nextNode())) {
                    // 2. Replace <br> with \n in content
                    let nodes = node.querySelectorAll('BR');
                    const brBreaksLine: boolean[] = [];
                    let l = nodes.length;
                    // Must calculate whether the <br> breaks a line first,
                    // because if we have two <br>s next to each other, after
                    // the first one is converted to a block split, the second
                    // will be at the end of a block and therefore seem to not
                    // be a line break. But in its original context it was, so
                    // we should also convert it to a block split.
                    for (let i = 0; i < l; i += 1) {
                        brBreaksLine[i] = isLineBreak(nodes[i], false);
                    }
                    while (l--) {
                        const br = nodes[l];
                        if (!brBreaksLine[l]) {
                            detach(br);
                        } else {
                            replaceWith(br, document.createTextNode('\n'));
                        }
                    }
                    // 3. Remove <code>; its format clashes with <pre>
                    nodes = node.querySelectorAll('CODE');
                    l = nodes.length;
                    while (l--) {
                        replaceWith(nodes[l], empty(nodes[l]));
                    }
                    if (output.childNodes.length) {
                        output.appendChild(document.createTextNode('\n'));
                    }
                    output.appendChild(empty(node));
                }
                // 4. Replace nbsp with regular sp
                const textWalker = new TreeIterator<Text>(output, SHOW_TEXT);
                while ((node = textWalker.nextNode())) {
                    // eslint-disable-next-line no-irregular-whitespace
                    node.data = node.data.replace(/ /g, ' '); // nbsp -> sp
                }
                output.normalize();
                return fixCursor(
                    createElement('PRE', this._config.tagAttributes.pre, [
                        output,
                    ]),
                );
            }, range);
            this.focus();
        } else {
            this.changeFormat(
                {
                    tag: 'CODE',
                    attributes: this._config.tagAttributes.code,
                },
                null,
                range,
            );
        }
        return this;
    }

    removeCode(): Squire {
        const range = this.getSelection();
        const ancestor = range.commonAncestorContainer;
        const inPre = getNearest(ancestor, this._root, 'PRE');
        if (inPre) {
            this.modifyBlocks((frag) => {
                const root = this._root;
                const pres = frag.querySelectorAll('PRE');
                let l = pres.length;
                while (l--) {
                    const pre = pres[l];
                    const walker = new TreeIterator<Text>(pre, SHOW_TEXT);
                    let node: Text | null;
                    while ((node = walker.nextNode())) {
                        let value = node.data;
                        value = value.replace(/ (?= )/g, ' '); // sp -> nbsp
                        const contents = document.createDocumentFragment();
                        let index: number;
                        while ((index = value.indexOf('\n')) > -1) {
                            contents.appendChild(
                                document.createTextNode(value.slice(0, index)),
                            );
                            contents.appendChild(createElement('BR'));
                            value = value.slice(index + 1);
                        }
                        node.parentNode!.insertBefore(contents, node);
                        node.data = value;
                    }
                    fixContainer(pre, root);
                    replaceWith(pre, empty(pre));
                }
                return frag;
            }, range);
            this.focus();
        } else {
            this.changeFormat(null, { tag: 'CODE' }, range);
        }
        return this;
    }

    toggleCode(): Squire {
        if (this.hasFormat('PRE') || this.hasFormat('CODE')) {
            this.removeCode();
        } else {
            this.code();
        }
        return this;
    }

    // ---

    _removeFormatting(
        root: DocumentFragment | Element,
        clean: DocumentFragment | Element,
    ): DocumentFragment | Element {
        for (
            let node = root.firstChild, next: ChildNode | null;
            node;
            node = next
        ) {
            next = node.nextSibling;
            if (isInline(node)) {
                if (
                    node instanceof Text ||
                    node.nodeName === 'BR' ||
                    node.nodeName === 'IMG'
                ) {
                    clean.appendChild(node);
                    continue;
                }
            } else if (isBlock(node)) {
                clean.appendChild(
                    this.createDefaultBlock([
                        this._removeFormatting(
                            node as Element,
                            document.createDocumentFragment(),
                        ),
                    ]),
                );
                continue;
            }
            this._removeFormatting(node as Element, clean);
        }
        return clean;
    }

    removeAllFormatting(range?: Range): Squire {
        if (!range) {
            range = this.getSelection();
        }
        if (range.collapsed) {
            return this.focus();
        }

        const root = this._root;
        let stopNode = range.commonAncestorContainer;
        while (stopNode && !isBlock(stopNode)) {
            stopNode = stopNode.parentNode!;
        }
        if (!stopNode) {
            expandRangeToBlockBoundaries(range, root);
            stopNode = root;
        }
        if (stopNode instanceof Text) {
            return this.focus();
        }

        // Record undo point
        this.saveUndoState(range);

        // Avoid splitting where we're already at edges.
        moveRangeBoundariesUpTree(range, stopNode, stopNode, root);

        // Split the selection up to the block, or if whole selection in same
        // block, expand range boundaries to ends of block and split up to root.
        const startContainer = range.startContainer;
        let startOffset = range.startOffset;
        const endContainer = range.endContainer;
        let endOffset = range.endOffset;

        // Split end point first to avoid problems when end and start
        // in same container.
        const formattedNodes = document.createDocumentFragment();
        const cleanNodes = document.createDocumentFragment();
        const nodeAfterSplit = split(endContainer, endOffset, stopNode, root);
        let nodeInSplit = split(startContainer, startOffset, stopNode, root);
        let nextNode: ChildNode | null;

        // Then replace contents in split with a cleaned version of the same:
        // blocks become default blocks, text and leaf nodes survive, everything
        // else is obliterated.
        while (nodeInSplit !== nodeAfterSplit) {
            nextNode = nodeInSplit!.nextSibling;
            formattedNodes.appendChild(nodeInSplit!);
            nodeInSplit = nextNode;
        }
        this._removeFormatting(formattedNodes, cleanNodes);
        cleanNodes.normalize();
        nodeInSplit = cleanNodes.firstChild;
        nextNode = cleanNodes.lastChild;

        // Restore selection
        if (nodeInSplit) {
            stopNode.insertBefore(cleanNodes, nodeAfterSplit);
            const childNodes = Array.from(stopNode.childNodes) as Node[];
            startOffset = childNodes.indexOf(nodeInSplit);
            endOffset = nextNode ? childNodes.indexOf(nextNode) + 1 : 0;
        } else if (nodeAfterSplit) {
            const childNodes = Array.from(stopNode.childNodes) as Node[];
            startOffset = childNodes.indexOf(nodeAfterSplit);
            endOffset = startOffset;
        }

        // Merge text nodes at edges, if possible
        range.setStart(stopNode, startOffset);
        range.setEnd(stopNode, endOffset);
        mergeInlines(stopNode, range);

        // And move back down the tree
        moveRangeBoundariesDownTree(range);

        this.setSelection(range);
        this._updatePath(range, true);

        return this.focus();
    }
}

// ---

export { Squire };
export type { SquireConfig };
