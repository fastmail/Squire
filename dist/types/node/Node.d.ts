declare const createElement: (tag: string, props?: Record<string, string> | null, children?: Node[]) => HTMLElement;
declare const areAlike: (node: HTMLElement | Node, node2: HTMLElement | Node) => boolean;
declare const hasTagAttributes: (node: Node | Element, tag: string, attributes?: Record<string, string> | null) => boolean;
declare const getNearest: (node: Node | null, root: Element | DocumentFragment, tag: string, attributes?: Record<string, string> | null) => Node | null;
declare const getNodeBeforeOffset: (node: Node, offset: number) => Node;
declare const getNodeAfterOffset: (node: Node, offset: number) => Node | null;
declare const getLength: (node: Node) => number;
declare const empty: (node: Node) => DocumentFragment;
declare const detach: (node: Node) => Node;
declare const replaceWith: (node: Node, node2: Node) => void;
export { areAlike, createElement, detach, empty, getLength, getNearest, getNodeAfterOffset, getNodeBeforeOffset, hasTagAttributes, replaceWith, };
//# sourceMappingURL=Node.d.ts.map