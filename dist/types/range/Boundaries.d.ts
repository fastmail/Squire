declare const isNodeContainedInRange: (range: Range, node: Node, partial: boolean) => boolean;
/**
 * Moves the range to an equivalent position with the start/end as deep in
 * the tree as possible.
 */
declare const moveRangeBoundariesDownTree: (range: Range) => void;
declare const moveRangeBoundariesUpTree: (range: Range, startMax: Node, endMax: Node, root: Node) => void;
declare const moveRangeBoundaryOutOf: (range: Range, tag: string, root: Element) => Range;
export { isNodeContainedInRange, moveRangeBoundariesDownTree, moveRangeBoundariesUpTree, moveRangeBoundaryOutOf, };
//# sourceMappingURL=Boundaries.d.ts.map