import { isLeaf } from '../node/Category';
import { getLength, getNearest } from '../node/Node';
import { isLineBreak } from '../node/Whitespace';
import { TEXT_NODE } from '../Constants';

// ---

const START_TO_START = 0; // Range.START_TO_START
const START_TO_END = 1; // Range.START_TO_END
const END_TO_END = 2; // Range.END_TO_END
const END_TO_START = 3; // Range.END_TO_START

const isNodeContainedInRange = (
    range: Range,
    node: Node,
    partial: boolean,
): boolean => {
    const nodeRange = document.createRange();
    nodeRange.selectNode(node);
    if (partial) {
        // Node must not finish before range starts or start after range
        // finishes.
        const nodeEndBeforeStart =
            range.compareBoundaryPoints(END_TO_START, nodeRange) > -1;
        const nodeStartAfterEnd =
            range.compareBoundaryPoints(START_TO_END, nodeRange) < 1;
        return !nodeEndBeforeStart && !nodeStartAfterEnd;
    } else {
        // Node must start after range starts and finish before range
        // finishes
        const nodeStartAfterStart =
            range.compareBoundaryPoints(START_TO_START, nodeRange) < 1;
        const nodeEndBeforeEnd =
            range.compareBoundaryPoints(END_TO_END, nodeRange) > -1;
        return nodeStartAfterStart && nodeEndBeforeEnd;
    }
};

/**
 * Moves the range to an equivalent position with the start/end as deep in
 * the tree as possible.
 */
const moveRangeBoundariesDownTree = (range: Range): void => {
    let { startContainer, startOffset, endContainer, endOffset } = range;

    while (!(startContainer instanceof Text)) {
        let child: ChildNode | null = startContainer.childNodes[startOffset];
        if (!child || isLeaf(child)) {
            if (startOffset) {
                child = startContainer.childNodes[startOffset - 1];
                if (child instanceof Text) {
                    // Need a new variable to satisfy TypeScript's type checker
                    // for some reason.
                    let textChild: Text = child;
                    // If we have an empty text node next to another text node,
                    // just skip and remove it.
                    let prev: ChildNode | null;
                    while (
                        !textChild.length &&
                        (prev = textChild.previousSibling) &&
                        prev instanceof Text
                    ) {
                        textChild.remove();
                        textChild = prev;
                    }
                    startContainer = textChild;
                    startOffset = textChild.data.length;
                }
            }
            break;
        }
        startContainer = child;
        startOffset = 0;
    }
    if (endOffset) {
        while (!(endContainer instanceof Text)) {
            const child = endContainer.childNodes[endOffset - 1];
            if (!child || isLeaf(child)) {
                if (
                    child &&
                    child.nodeName === 'BR' &&
                    !isLineBreak(child as Element, false)
                ) {
                    endOffset -= 1;
                    continue;
                }
                break;
            }
            endContainer = child;
            endOffset = getLength(endContainer);
        }
    } else {
        while (!(endContainer instanceof Text)) {
            const child = endContainer.firstChild!;
            if (!child || isLeaf(child)) {
                break;
            }
            endContainer = child;
        }
    }

    range.setStart(startContainer, startOffset);
    range.setEnd(endContainer, endOffset);
};

const moveRangeBoundariesUpTree = (
    range: Range,
    startMax: Node,
    endMax: Node,
    root: Node,
): void => {
    let startContainer = range.startContainer;
    let startOffset = range.startOffset;
    let endContainer = range.endContainer;
    let endOffset = range.endOffset;
    let parent: Node;

    if (!startMax) {
        startMax = range.commonAncestorContainer;
    }
    if (!endMax) {
        endMax = startMax;
    }

    while (
        !startOffset &&
        startContainer !== startMax &&
        startContainer !== root
    ) {
        parent = startContainer.parentNode!;
        startOffset = Array.from(parent.childNodes).indexOf(
            startContainer as ChildNode,
        );
        startContainer = parent;
    }

    while (true) {
        if (endContainer === endMax || endContainer === root) {
            break;
        }
        if (
            endContainer.nodeType !== TEXT_NODE &&
            endContainer.childNodes[endOffset] &&
            endContainer.childNodes[endOffset].nodeName === 'BR' &&
            !isLineBreak(endContainer.childNodes[endOffset] as Element, false)
        ) {
            endOffset += 1;
        }
        if (endOffset !== getLength(endContainer)) {
            break;
        }
        parent = endContainer.parentNode!;
        endOffset =
            Array.from(parent.childNodes).indexOf(endContainer as ChildNode) +
            1;
        endContainer = parent;
    }

    range.setStart(startContainer, startOffset);

    if (startContainer instanceof HTMLElement && !startContainer.isContentEditable) {
        range.setStart(endContainer, endOffset);
    }

    range.setEnd(endContainer, endOffset);
};

const moveRangeBoundaryOutOf = (
    range: Range,
    tag: string,
    root: Element,
): Range => {
    let parent = getNearest(range.endContainer, root, tag);
    if (parent && (parent = parent.parentNode)) {
        const clone = range.cloneRange();
        moveRangeBoundariesUpTree(clone, parent, parent, root);
        if (clone.endContainer === parent) {
            range.setStart(clone.endContainer, clone.endOffset);
            range.setEnd(clone.endContainer, clone.endOffset);
        }
    }
    return range;
};

// ---

export {
    isNodeContainedInRange,
    moveRangeBoundariesDownTree,
    moveRangeBoundariesUpTree,
    moveRangeBoundaryOutOf,
};
