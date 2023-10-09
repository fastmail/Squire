import { ZWS, notWS } from '../Constants';
import { isInline } from './Category';
import { getLength } from './Node';
import { SHOW_ELEMENT_OR_TEXT, SHOW_TEXT, TreeIterator } from './TreeIterator';

// ---

const notWSTextNode = (node: Node): boolean => {
    return node instanceof Element
        ? node.nodeName === 'BR'
        : // okay if data is 'undefined' here.
          notWS.test((node as CharacterData).data);
};

const isLineBreak = (br: Element, isLBIfEmptyBlock: boolean): boolean => {
    let block = br.parentNode!;
    while (isInline(block)) {
        block = block.parentNode!;
    }
    const walker = new TreeIterator<Element | Text>(
        block,
        SHOW_ELEMENT_OR_TEXT,
        notWSTextNode,
    );
    walker.currentNode = br;
    return !!walker.nextNode() || (isLBIfEmptyBlock && !walker.previousNode());
};

// --- Workaround for browsers that can't focus empty text nodes

// WebKit bug: https://bugs.webkit.org/show_bug.cgi?id=15256

// Walk down the tree starting at the root and remove any ZWS. If the node only
// contained ZWS space then remove it too. We may want to keep one ZWS node at
// the bottom of the tree so the block can be selected. Define that node as the
// keepNode.
const removeZWS = (root: Node, keepNode?: Node | null): void => {
    const walker = new TreeIterator<Text>(root, SHOW_TEXT);
    let textNode: Text | null;
    let index: number;
    while ((textNode = walker.nextNode())) {
        while (
            (index = textNode.data.indexOf(ZWS)) > -1 &&
            // eslint-disable-next-line no-unmodified-loop-condition
            (!keepNode || textNode.parentNode !== keepNode)
        ) {
            if (textNode.length === 1) {
                let node: Node = textNode;
                let parent = node.parentNode;
                while (parent) {
                    parent.removeChild(node);
                    walker.currentNode = parent;
                    if (!isInline(parent) || getLength(parent)) {
                        break;
                    }
                    node = parent;
                    parent = node.parentNode;
                }
                break;
            } else {
                textNode.deleteData(index, 1);
            }
        }
    }
};

// ---

export { isLineBreak, removeZWS };
