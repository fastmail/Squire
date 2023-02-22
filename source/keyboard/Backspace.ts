import type { Squire } from '../Editor';
import { getPreviousBlock } from '../node/Block';
import {
    fixContainer,
    mergeContainers,
    mergeWithBlock,
} from '../node/MergeSplit';
import { getNearest } from '../node/Node';
import {
    getStartBlockOfRange,
    rangeDoesStartAtBlockBoundary,
} from '../range/Block';
import { moveRangeBoundariesDownTree } from '../range/Boundaries';
import { deleteContentsOfRange } from '../range/InsertDelete';
import { afterDelete, detachUneditableNode } from './KeyHelpers';

// ---

const Backspace = (self: Squire, event: KeyboardEvent, range: Range): void => {
    const root: Element = self._root;
    self._removeZWS();
    // Record undo checkpoint.
    self.saveUndoState(range);
    if (!range.collapsed) {
        // If not collapsed, delete contents
        event.preventDefault();
        deleteContentsOfRange(range, root);
        afterDelete(self, range);
    } else if (rangeDoesStartAtBlockBoundary(range, root)) {
        // If at beginning of block, merge with previous
        event.preventDefault();
        const startBlock = getStartBlockOfRange(range, root);
        if (!startBlock) {
            return;
        }
        let current = startBlock;
        // In case inline data has somehow got between blocks.
        fixContainer(current.parentNode!, root);
        // Now get previous block
        const previous = getPreviousBlock(current, root);
        // Must not be at the very beginning of the text area.
        if (previous) {
            // If not editable, just delete whole block.
            if (!(previous as HTMLElement).isContentEditable) {
                detachUneditableNode(previous, root);
                return;
            }
            // Otherwise merge.
            mergeWithBlock(previous, current, range, root);
            // If deleted line between containers, merge newly adjacent
            // containers.
            current = previous.parentNode as HTMLElement;
            while (current !== root && !current.nextSibling) {
                current = current.parentNode as HTMLElement;
            }
            if (
                current !== root &&
                (current = current.nextSibling as HTMLElement)
            ) {
                mergeContainers(current, root);
            }
            self.setSelection(range);
            // If at very beginning of text area, allow backspace
            // to break lists/blockquote.
        } else if (current) {
            if (
                getNearest(current, root, 'UL') ||
                getNearest(current, root, 'OL')
            ) {
                // Break list
                self.decreaseListLevel(range);
                return;
            } else if (getNearest(current, root, 'BLOCKQUOTE')) {
                // Break blockquote
                self.removeQuote(range);
                return;
            }
            self.setSelection(range);
            self._updatePath(range, true);
        }
    } else {
        // If deleting text inside a link that looks like a URL, delink.
        // This is to allow you to easily correct auto-linked text.
        moveRangeBoundariesDownTree(range);
        const text = range.startContainer;
        const offset = range.startOffset;
        const a = text.parentNode;
        if (
            text instanceof Text &&
            a instanceof HTMLAnchorElement &&
            offset &&
            a.href.includes(text.data)
        ) {
            text.deleteData(offset - 1, 1);
            self.setSelection(range);
            self.removeLink();
            event.preventDefault();
        } else {
            // Otherwise, leave to browser but check afterwards whether it has
            // left behind an empty inline tag.
            self.setSelection(range);
            setTimeout(() => {
                afterDelete(self);
            }, 0);
        }
    }
};

// ---

export { Backspace };
