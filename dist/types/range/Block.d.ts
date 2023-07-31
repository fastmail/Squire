declare const getStartBlockOfRange: (range: Range, root: Element | DocumentFragment) => HTMLElement | null;
declare const getEndBlockOfRange: (range: Range, root: Element | DocumentFragment) => HTMLElement | null;
declare const rangeDoesStartAtBlockBoundary: (range: Range, root: Element) => boolean;
declare const rangeDoesEndAtBlockBoundary: (range: Range, root: Element) => boolean;
declare const expandRangeToBlockBoundaries: (range: Range, root: Element) => void;
export { getStartBlockOfRange, getEndBlockOfRange, rangeDoesStartAtBlockBoundary, rangeDoesEndAtBlockBoundary, expandRangeToBlockBoundaries, };
//# sourceMappingURL=Block.d.ts.map