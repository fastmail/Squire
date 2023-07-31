declare const fixCursor: (node: Node) => Node;
declare const fixContainer: (container: Node, root: Element | DocumentFragment) => Node;
declare const split: (node: Node, offset: number | Node | null, stopNode: Node, root: Element | DocumentFragment) => Node | null;
declare const mergeInlines: (node: Node, range: Range) => void;
declare const mergeWithBlock: (block: Node, next: Node, range: Range, root: Element) => void;
declare const mergeContainers: (node: Node, root: Element) => void;
export { fixContainer, fixCursor, mergeContainers, mergeInlines, mergeWithBlock, split, };
//# sourceMappingURL=MergeSplit.d.ts.map