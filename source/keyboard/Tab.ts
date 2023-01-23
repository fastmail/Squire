import {
    rangeDoesStartAtBlockBoundary,
    getStartBlockOfRange,
} from '../range/Block';
import { getNearest } from '../node/Node';

import type { Squire } from '../Editor';

// ---

const Tab = (self: Squire, event: KeyboardEvent, range: Range): void => {
    const root = self._root;
    self._removeZWS();
    // If no selection and at start of block
    if (range.collapsed && rangeDoesStartAtBlockBoundary(range, root)) {
        let node: Node = getStartBlockOfRange(range, root)!;
        // Iterate through the block's parents
        let parent: Node | null;
        while ((parent = node.parentNode)) {
            // If we find a UL or OL (so are in a list, node must be an LI)
            if (parent.nodeName === 'UL' || parent.nodeName === 'OL') {
                // Then increase the list level
                event.preventDefault();
                self.increaseListLevel(range);
                break;
            }
            node = parent;
        }
    }
};

const ShiftTab = (self: Squire, event: KeyboardEvent, range: Range): void => {
    const root = self._root;
    self._removeZWS();
    // If no selection and at start of block
    if (range.collapsed && rangeDoesStartAtBlockBoundary(range, root)) {
        // Break list
        const node = range.startContainer;
        if (getNearest(node, root, 'UL') || getNearest(node, root, 'OL')) {
            event.preventDefault();
            self.decreaseListLevel(range);
        }
    }
};

// ---

export { Tab, ShiftTab };
