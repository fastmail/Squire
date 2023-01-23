import { getLength } from '../node/Node';
import { moveRangeBoundariesDownTree } from '../range/Boundaries';
import { deleteContentsOfRange } from '../range/InsertDelete';

import type { Squire } from '../Editor';
import { linkifyText } from './KeyHelpers';

// ---

const Space = (self: Squire, _: KeyboardEvent, range: Range): void => {
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
