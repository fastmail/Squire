import { cleanupBRs } from '../Clean';
import {
    split,
    fixCursor,
    mergeWithBlock,
    fixContainer,
    mergeContainers,
} from '../node/MergeSplit';
import { detach, getNearest, getLength } from '../node/Node';
import { TreeIterator, SHOW_ELEMENT_OR_TEXT } from '../node/TreeIterator';
import { isInline, isContainer, isLeaf } from '../node/Category';
import { getNextBlock, isEmptyBlock, getPreviousBlock } from '../node/Block';
import {
    getStartBlockOfRange,
    getEndBlockOfRange,
    rangeDoesEndAtBlockBoundary,
    rangeDoesStartAtBlockBoundary,
} from './Block';
import {
    moveRangeBoundariesDownTree,
    moveRangeBoundariesUpTree,
} from './Boundaries';

// ---

function createRange(startContainer: Node, startOffset: number): Range;
function createRange(
    startContainer: Node,
    startOffset: number,
    endContainer: Node,
    endOffset: number,
): Range;
function createRange(
    startContainer: Node,
    startOffset: number,
    endContainer?: Node,
    endOffset?: number,
): Range {
    const range = document.createRange();
    range.setStart(startContainer, startOffset);
    if (endContainer && typeof endOffset === 'number') {
        range.setEnd(endContainer, endOffset);
    } else {
        range.setEnd(startContainer, startOffset);
    }
    return range;
}

const insertNodeInRange = (range: Range, node: Node): void => {
    // Insert at start.
    let { startContainer, startOffset, endContainer, endOffset } = range;
    let children: NodeListOf<ChildNode>;

    // If part way through a text node, split it.
    if (startContainer instanceof Text) {
        const parent = startContainer.parentNode!;
        children = parent.childNodes;
        if (startOffset === startContainer.length) {
            startOffset = Array.from(children).indexOf(startContainer) + 1;
            if (range.collapsed) {
                endContainer = parent;
                endOffset = startOffset;
            }
        } else {
            if (startOffset) {
                const afterSplit = startContainer.splitText(startOffset);
                if (endContainer === startContainer) {
                    endOffset -= startOffset;
                    endContainer = afterSplit;
                } else if (endContainer === parent) {
                    endOffset += 1;
                }
                startContainer = afterSplit;
            }
            startOffset = Array.from(children).indexOf(
                startContainer as ChildNode,
            );
        }
        startContainer = parent;
    } else {
        children = startContainer.childNodes;
    }

    const childCount = children.length;

    if (startOffset === childCount) {
        startContainer.appendChild(node);
    } else {
        startContainer.insertBefore(node, children[startOffset]);
    }

    if (startContainer === endContainer) {
        endOffset += children.length - childCount;
    }

    range.setStart(startContainer, startOffset);
    range.setEnd(endContainer, endOffset);
};

/**
 * Removes the contents of the range and returns it as a DocumentFragment.
 * The range at the end will be at the same position, with the edges just
 * before/after the split. If the start/end have the same parents, it will
 * be collapsed.
 */
const extractContentsOfRange = (
    range: Range,
    common: Node | null,
    root: Element,
): DocumentFragment => {
    const frag = document.createDocumentFragment();
    if (range.collapsed) {
        return frag;
    }

    if (!common) {
        common = range.commonAncestorContainer;
    }
    if (common instanceof Text) {
        common = common.parentNode!;
    }

    const startContainer = range.startContainer;
    const startOffset = range.startOffset;

    let endContainer = split(range.endContainer, range.endOffset, common, root);
    let endOffset = 0;

    let node = split(startContainer, startOffset, common, root);
    while (node && node !== endContainer) {
        const next = node.nextSibling;
        frag.appendChild(node);
        node = next;
    }

    // Merge text nodes if adjacent
    node = endContainer && endContainer.previousSibling;
    if (node && node instanceof Text && endContainer instanceof Text) {
        endOffset = node.length;
        node.appendData(endContainer.data);
        detach(endContainer);
        endContainer = node;
    }

    range.setStart(startContainer, startOffset);
    if (endContainer) {
        range.setEnd(endContainer, endOffset);
    } else {
        // endContainer will be null if at end of parent's child nodes list.
        range.setEnd(common, common.childNodes.length);
    }

    fixCursor(common);

    return frag;
};

/**
 * Returns the next/prev node that's part of the same inline content.
 */
const getAdjacentInlineNode = (
    iterator: TreeIterator<Node>,
    method: 'nextNode' | 'previousPONode',
    node: Node,
): Node | null => {
    iterator.currentNode = node;
    let nextNode: Node | null;
    while ((nextNode = iterator[method]())) {
        if (nextNode instanceof Text || isLeaf(nextNode)) {
            return nextNode;
        }
        if (!isInline(nextNode)) {
            return null;
        }
    }
    return null;
};

const deleteContentsOfRange = (
    range: Range,
    root: Element,
): DocumentFragment => {
    const startBlock = getStartBlockOfRange(range, root);
    let endBlock = getEndBlockOfRange(range, root);
    const needsMerge = startBlock !== endBlock;

    // Move boundaries up as much as possible without exiting block,
    // to reduce need to split.
    if (startBlock && endBlock) {
        moveRangeBoundariesDownTree(range);
        moveRangeBoundariesUpTree(range, startBlock, endBlock, root);
    }

    // Remove selected range
    const frag = extractContentsOfRange(range, null, root);

    // Move boundaries back down tree as far as possible.
    moveRangeBoundariesDownTree(range);

    // If we split into two different blocks, merge the blocks.
    if (needsMerge) {
        // endBlock will have been split, so need to refetch
        endBlock = getEndBlockOfRange(range, root);
        if (startBlock && endBlock && startBlock !== endBlock) {
            mergeWithBlock(startBlock, endBlock, range, root);
        }
    }

    // Ensure block has necessary children
    if (startBlock) {
        fixCursor(startBlock);
    }

    // Ensure root has a block-level element in it.
    const child = root.firstChild;
    if (!child || child.nodeName === 'BR') {
        fixCursor(root);
        if (root.firstChild) {
            range.selectNodeContents(root.firstChild);
        }
    }

    range.collapse(true);

    // Now we may need to swap a space for a nbsp if the browser is going
    // to swallow it due to HTML whitespace rules:
    const startContainer = range.startContainer;
    const startOffset = range.startOffset;
    const iterator = new TreeIterator(root, SHOW_ELEMENT_OR_TEXT);

    // Find the character after cursor point
    let afterNode: Node | null = startContainer;
    let afterOffset = startOffset;
    if (!(afterNode instanceof Text) || afterOffset === afterNode.data.length) {
        afterNode = getAdjacentInlineNode(iterator, 'nextNode', afterNode);
        afterOffset = 0;
    }

    // Find the character before cursor point
    let beforeNode: Node | null = startContainer;
    let beforeOffset = startOffset - 1;
    if (!(beforeNode instanceof Text) || beforeOffset === -1) {
        beforeNode = getAdjacentInlineNode(
            iterator,
            'previousPONode',
            afterNode ||
                (startContainer instanceof Text
                    ? startContainer
                    : startContainer.childNodes[startOffset] || startContainer),
        );
        if (beforeNode instanceof Text) {
            beforeOffset = beforeNode.data.length;
        }
    }

    // If range starts at block boundary and character after cursor point
    // is a space, replace with nbsp
    let node = null;
    let offset = 0;
    if (
        afterNode instanceof Text &&
        afterNode.data.charAt(afterOffset) === ' ' &&
        rangeDoesStartAtBlockBoundary(range, root)
    ) {
        node = afterNode;
        offset = afterOffset;
    } else if (
        beforeNode instanceof Text &&
        beforeNode.data.charAt(beforeOffset) === ' '
    ) {
        // If character before cursor point is a space, replace with nbsp
        // if either:
        // a) There is a space after it; or
        // b) The point after is the end of the block
        if (
            (afterNode instanceof Text &&
                afterNode.data.charAt(afterOffset) === ' ') ||
            rangeDoesEndAtBlockBoundary(range, root)
        ) {
            node = beforeNode;
            offset = beforeOffset;
        }
    }
    if (node) {
        node.replaceData(offset, 1, ' '); // nbsp
    }
    // Range needs to be put back in place
    range.setStart(startContainer, startOffset);
    range.collapse(true);

    return frag;
};

// Contents of range will be deleted.
// After method, range will be around inserted content
const insertTreeFragmentIntoRange = (
    range: Range,
    frag: DocumentFragment,
    root: Element,
): void => {
    const firstInFragIsInline = frag.firstChild && isInline(frag.firstChild);
    let node: Node | null;

    // Fixup content: ensure no top-level inline, and add cursor fix elements.
    fixContainer(frag, root);
    node = frag;
    while ((node = getNextBlock(node, root))) {
        fixCursor(node);
    }

    // Delete any selected content.
    if (!range.collapsed) {
        deleteContentsOfRange(range, root);
    }

    // Move range down into text nodes.
    moveRangeBoundariesDownTree(range);
    range.collapse(false); // collapse to end

    // Where will we split up to? First blockquote parent, otherwise root.
    const stopPoint =
        getNearest(range.endContainer, root, 'BLOCKQUOTE') || root;

    // Merge the contents of the first block in the frag with the focused block.
    // If there are contents in the block after the focus point, collect this
    // up to insert in the last block later. This preserves the style that was
    // present in this bit of the page.
    //
    // If the block being inserted into is empty though, replace it instead of
    // merging if the fragment had block contents.
    // e.g. <blockquote><p>Foo</p></blockquote>
    // This seems a reasonable approximation of user intent.
    let block = getStartBlockOfRange(range, root);
    let blockContentsAfterSplit: DocumentFragment | null = null;
    const firstBlockInFrag = getNextBlock(frag, frag);
    const replaceBlock = !firstInFragIsInline && !!block && isEmptyBlock(block);
    if (
        block &&
        firstBlockInFrag &&
        !replaceBlock &&
        // Don't merge table cells or PRE elements into block
        !getNearest(firstBlockInFrag, frag, 'PRE') &&
        !getNearest(firstBlockInFrag, frag, 'TABLE')
    ) {
        moveRangeBoundariesUpTree(range, block, block, root);
        range.collapse(true); // collapse to start
        let container = range.endContainer;
        let offset = range.endOffset;
        // Remove trailing <br> – we don't want this considered content to be
        // inserted again later
        cleanupBRs(block as HTMLElement, root, false);
        if (isInline(container)) {
            // Split up to block parent.
            const nodeAfterSplit = split(
                container,
                offset,
                getPreviousBlock(container, root) || root,
                root,
            ) as Node;
            container = nodeAfterSplit.parentNode!;
            offset = Array.from(container.childNodes).indexOf(
                nodeAfterSplit as ChildNode,
            );
        }
        if (/*isBlock( container ) && */ offset !== getLength(container)) {
            // Collect any inline contents of the block after the range point
            blockContentsAfterSplit = document.createDocumentFragment();
            while ((node = container.childNodes[offset])) {
                blockContentsAfterSplit.appendChild(node);
            }
        }
        // And merge the first block in.
        mergeWithBlock(container, firstBlockInFrag, range, root);

        // And where we will insert
        offset =
            Array.from(container.parentNode!.childNodes).indexOf(
                container as ChildNode,
            ) + 1;
        container = container.parentNode!;
        range.setEnd(container, offset);
    }

    // Is there still any content in the fragment?
    if (getLength(frag)) {
        if (replaceBlock && block) {
            range.setEndBefore(block);
            range.collapse(false);
            detach(block);
        }
        moveRangeBoundariesUpTree(range, stopPoint, stopPoint, root);
        // Now split after block up to blockquote (if a parent) or root
        let nodeAfterSplit = split(
            range.endContainer,
            range.endOffset,
            stopPoint,
            root,
        ) as Node | null;
        const nodeBeforeSplit = nodeAfterSplit
            ? nodeAfterSplit.previousSibling
            : stopPoint.lastChild;
        stopPoint.insertBefore(frag, nodeAfterSplit);
        if (nodeAfterSplit) {
            range.setEndBefore(nodeAfterSplit);
        } else {
            range.setEnd(stopPoint, getLength(stopPoint));
        }
        block = getEndBlockOfRange(range, root);

        // Get a reference that won't be invalidated if we merge containers.
        moveRangeBoundariesDownTree(range);
        const container = range.endContainer;
        const offset = range.endOffset;

        // Merge inserted containers with edges of split
        if (nodeAfterSplit && isContainer(nodeAfterSplit)) {
            mergeContainers(nodeAfterSplit, root);
        }
        nodeAfterSplit = nodeBeforeSplit && nodeBeforeSplit.nextSibling;
        if (nodeAfterSplit && isContainer(nodeAfterSplit)) {
            mergeContainers(nodeAfterSplit, root);
        }
        range.setEnd(container, offset);
    }

    // Insert inline content saved from before.
    if (blockContentsAfterSplit && block) {
        const tempRange = range.cloneRange();
        fixCursor(blockContentsAfterSplit);
        mergeWithBlock(block, blockContentsAfterSplit, tempRange, root);
        range.setEnd(tempRange.endContainer, tempRange.endOffset);
    }
    moveRangeBoundariesDownTree(range);
};

// ---

export {
    createRange,
    deleteContentsOfRange,
    extractContentsOfRange,
    insertNodeInRange,
    insertTreeFragmentIntoRange,
};
