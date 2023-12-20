import { detach, getLength } from '../node/Node';
import { moveRangeBoundariesDownTree } from '../range/Boundaries';
import { deleteContentsOfRange } from '../range/InsertDelete';

import type { Squire } from '../Editor';
import { linkifyText } from './KeyHelpers';
import {
    getStartBlockOfRange,
    rangeDoesEndAtBlockBoundary,
} from '../range/Block';
import { SHOW_TEXT, TreeIterator } from '../node/TreeIterator';
import { ZWS } from '../Constants';

// ---

const Space = (self: Squire, event: KeyboardEvent, range: Range): void => {
    let node: Node | null;
    const root = self._root;
    self._recordUndoState(range);
    self._getRangeAndRemoveBookmark(range);

    // Delete the selection if not collapsed
    if (!range.collapsed) {
        deleteContentsOfRange(range, root);
        self._ensureBottomLine();
        self.setSelection(range);
        self._updatePath(range, true);
    } else if (rangeDoesEndAtBlockBoundary(range, root)) {
        const block = getStartBlockOfRange(range, root);
        if (block && block.nodeName !== 'PRE') {
            const text = block.textContent?.trimEnd().replace(ZWS, '');
            if (text === '*' || text === '1.') {
                event.preventDefault();
                self.insertPlainText(' ', false);
                self._docWasChanged();
                self.saveUndoState(range);
                const walker = new TreeIterator<Text>(block, SHOW_TEXT);
                let textNode: Text | null;
                while ((textNode = walker.nextNode())) {
                    detach(textNode);
                }
                if (text === '*') {
                    self.makeUnorderedList();
                } else {
                    self.makeOrderedList();
                }
                return;
            }
        }
    }

    // If the cursor is at the end of a link (<a>foo|</a>) then move it
    // outside of the link (<a>foo</a>|) so that the space is not part of
    // the link text.
    node = range.endContainer;
    if (range.endOffset === getLength(node)) {
        do {
            if (node.nodeName === 'A') {
                range.setStartAfter(node);
                break;
            }
        } while (
            !node.nextSibling &&
            (node = node.parentNode) &&
            node !== root
        );
    }

    // Linkify text
    if (self._config.addLinks) {
        const linkRange = range.cloneRange();
        moveRangeBoundariesDownTree(linkRange);
        const textNode = linkRange.startContainer as Text;
        const offset = linkRange.startOffset;
        setTimeout(() => {
            linkifyText(self, textNode, offset);
        }, 0);
    }

    self.setSelection(range);
};

// ---

export { Space };
