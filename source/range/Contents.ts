import { SHOW_ELEMENT_OR_TEXT, TreeIterator } from '../node/TreeIterator';
import { isNodeContainedInRange } from './Boundaries';
import { isInline } from '../node/Category';

// ---

const getTextContentsOfRange = (range: Range) => {
    if (range.collapsed) {
        return '';
    }
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;
    const walker = new TreeIterator<Element | Text>(
        range.commonAncestorContainer,
        SHOW_ELEMENT_OR_TEXT,
        (node) => {
            return isNodeContainedInRange(range, node, true);
        },
    );
    walker.currentNode = startContainer;

    let node: Node | null = startContainer;
    let textContent = '';
    let addedTextInBlock = false;
    let value: string;

    if (
        (!(node instanceof Element) && !(node instanceof Text)) ||
        !walker.filter(node)
    ) {
        node = walker.nextNode();
    }

    while (node) {
        if (node instanceof Text) {
            value = node.data;
            if (value && /\S/.test(value)) {
                if (node === endContainer) {
                    value = value.slice(0, range.endOffset);
                }
                if (node === startContainer) {
                    value = value.slice(range.startOffset);
                }
                textContent += value;
                addedTextInBlock = true;
            }
        } else if (
            node.nodeName === 'BR' ||
            (addedTextInBlock && !isInline(node))
        ) {
            textContent += '\n';
            addedTextInBlock = false;
        }
        node = walker.nextNode();
    }
    // Replace nbsp with regular space;
    // eslint-disable-next-line no-irregular-whitespace
    textContent = textContent.replace(/ /g, ' ');

    return textContent;
};

// ---

export { getTextContentsOfRange };
