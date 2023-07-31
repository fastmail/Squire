type NODE_TYPE = 1 | 4 | 5;
declare const SHOW_ELEMENT = 1;
declare const SHOW_TEXT = 4;
declare const SHOW_ELEMENT_OR_TEXT = 5;
declare class TreeIterator<T extends Node> {
    root: Node;
    currentNode: Node;
    nodeType: NODE_TYPE;
    filter: (n: T) => boolean;
    constructor(root: Node, nodeType: NODE_TYPE, filter?: (n: T) => boolean);
    isAcceptableNode(node: Node): boolean;
    nextNode(): T | null;
    previousNode(): T | null;
    previousPONode(): T | null;
}
export { TreeIterator, SHOW_ELEMENT, SHOW_TEXT, SHOW_ELEMENT_OR_TEXT };
//# sourceMappingURL=TreeIterator.d.ts.map