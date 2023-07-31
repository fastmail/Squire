import { TreeIterator } from './TreeIterator';
declare const getBlockWalker: (node: Node, root: Element | DocumentFragment) => TreeIterator<HTMLElement>;
declare const getPreviousBlock: (node: Node, root: Element | DocumentFragment) => HTMLElement | null;
declare const getNextBlock: (node: Node, root: Element | DocumentFragment) => HTMLElement | null;
declare const isEmptyBlock: (block: Element) => boolean;
export { getBlockWalker, getPreviousBlock, getNextBlock, isEmptyBlock };
//# sourceMappingURL=Block.d.ts.map