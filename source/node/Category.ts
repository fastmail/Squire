import { ELEMENT_NODE, TEXT_NODE, DOCUMENT_FRAGMENT_NODE } from '../Constants';

// ---

const inlineNodeNames =
    /^(?:#text|A(?:BBR|CRONYM)?|B(?:R|D[IO])?|C(?:ITE|ODE)|D(?:ATA|EL|FN)|EM|FONT|HR|I(?:FRAME|MG|NPUT|NS)?|KBD|Q|R(?:P|T|UBY)|S(?:AMP|MALL|PAN|TR(?:IKE|ONG)|U[BP])?|TIME|U|VAR|WBR)$/;

const leafNodeNames = new Set(['BR', 'HR', 'IFRAME', 'IMG', 'INPUT']);

const UNKNOWN = 0;
const INLINE = 1;
const BLOCK = 2;
const CONTAINER = 3;

// ---

let cache: WeakMap<Node, number> = new WeakMap();

const resetNodeCategoryCache = (): void => {
    cache = new WeakMap();
};

// ---

const isLeaf = (node: Node): boolean => {
    return leafNodeNames.has(node.nodeName);
};

const getNodeCategory = (node: Node): number => {
    switch (node.nodeType) {
        case TEXT_NODE:
            return INLINE;
        case ELEMENT_NODE:
        case DOCUMENT_FRAGMENT_NODE:
            if (cache.has(node)) {
                return cache.get(node) as number;
            }
            break;
        default:
            return UNKNOWN;
    }

    let nodeCategory: number;
    if (!Array.from(node.childNodes).every(isInline)) {
        // Malformed HTML can have block tags inside inline tags. Need to treat
        // these as containers rather than inline. See #239.
        nodeCategory = CONTAINER;
    } else if (inlineNodeNames.test(node.nodeName)) {
        nodeCategory = INLINE;
    } else {
        nodeCategory = BLOCK;
    }
    cache.set(node, nodeCategory);
    return nodeCategory;
};

const isInline = (node: Node): boolean => {
    return getNodeCategory(node) === INLINE;
};

const isBlock = (node: Node): boolean => {
    return getNodeCategory(node) === BLOCK;
};

const isContainer = (node: Node): boolean => {
    return getNodeCategory(node) === CONTAINER;
};

// ---

export {
    getNodeCategory,
    isBlock,
    isContainer,
    isInline,
    isLeaf,
    leafNodeNames,
    resetNodeCategoryCache,
};
