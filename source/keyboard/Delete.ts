import { getNextBlock } from '../node/Block';
import {
    fixContainer,
    mergeWithBlock,
    mergeContainers,
} from '../node/MergeSplit';
import { detach } from '../node/Node';
import {
    rangeDoesEndAtBlockBoundary,
    getStartBlockOfRange,
} from '../range/Block';
import {
    moveRangeBoundariesUpTree,
    moveRangeBoundariesDownTree,
} from '../range/Boundaries';
import { deleteContentsOfRange } from '../range/InsertDelete';
import { afterDelete, detachUneditableNode } from './KeyHelpers';

import type { Squire } from '../Editor';

// ---

const Delete = (self: Squire, event: KeyboardEvent, range: Range): void => {
    const root = self._root;
    let current: Node | null;
    let next: Node | null;
    let originalRange: Range;
    let cursorContainer: Node;
    let cursorOffset: number;
    let nodeAfterCursor: Node;
    self._removeZWS();
    // Record undo checkpoint.
    self.saveUndoState(range);
    // If not collapsed, delete contents
    if (!range.collapsed) {
        event.preventDefault();
        deleteContentsOfRange(range, root);
        afterDelete(self, range);
        // If at end of block, merge next into this block
    } else if (rangeDoesEndAtBlockBoundary(range, root)) {
        event.preventDefault();
        current = getStartBlockOfRange(range, root);
        if (!current) {
            return;
        }
        // In case inline data has somehow got between blocks.
        fixContainer(current.parentNode!, root);
        // Now get next block
        next = getNextBlock(current, root);
        // Must not be at the very end of the text area.
        if (next) {
            // If not editable, just delete whole block.
            if (!(next as HTMLElement).isContentEditable) {
                detachUneditableNode(next, root);
                return;
            }
            // Otherwise merge.
            mergeWithBlock(current, next, range, root);
            // If deleted line between containers, merge newly adjacent
            // containers.
            next = current.parentNode!;
            while (next !== root && !next.nextSibling) {
                next = next.parentNode!;
            }
            if (next !== root && (next = next.nextSibling)) {
                mergeContainers(next, root);
            }
            self.setSelection(range);
            self._updatePath(range, true);
        }
        // Otherwise, leave to browser but check afterwards whether it has
        // left behind an empty inline tag.
    } else {
        // But first check if the cursor is just before an IMG tag. If so,
        // delete it ourselves, because the browser won't if it is not
        // inline.
        originalRange = range.cloneRange();
        moveRangeBoundariesUpTree(range, root, root, root);
        cursorContainer = range.endContainer;
        cursorOffset = range.endOffset;
        if (cursorContainer instanceof Element) {
            nodeAfterCursor = cursorContainer.childNodes[cursorOffset];
            if (nodeAfterCursor && nodeAfterCursor.nodeName === 'IMG') {
                event.preventDefault();
                detach(nodeAfterCursor);
                moveRangeBoundariesDownTree(range);
                afterDelete(self, range);
                return;
            }
        }
        self.setSelection(originalRange);
        setTimeout(() => {
            afterDelete(self);
        }, 0);
    }
};

// ---

export { Delete };
