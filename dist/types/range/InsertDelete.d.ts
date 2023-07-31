declare function createRange(startContainer: Node, startOffset: number): Range;
declare function createRange(startContainer: Node, startOffset: number, endContainer: Node, endOffset: number): Range;
declare const insertNodeInRange: (range: Range, node: Node) => void;
/**
 * Removes the contents of the range and returns it as a DocumentFragment.
 * The range at the end will be at the same position, with the edges just
 * before/after the split. If the start/end have the same parents, it will
 * be collapsed.
 */
declare const extractContentsOfRange: (range: Range, common: Node | null, root: Element) => DocumentFragment;
declare const deleteContentsOfRange: (range: Range, root: Element) => DocumentFragment;
declare const insertTreeFragmentIntoRange: (range: Range, frag: DocumentFragment, root: Element) => void;
export { createRange, deleteContentsOfRange, extractContentsOfRange, insertNodeInRange, insertTreeFragmentIntoRange, };
//# sourceMappingURL=InsertDelete.d.ts.map