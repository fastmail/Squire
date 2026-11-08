import { isLineBreak } from './node/Whitespace';
import type { SquireConfig } from './Editor';
type WSCache = {
    before: WeakMap<Node, boolean>;
    after: WeakMap<Node, boolean>;
};
declare const cleanTree: (node: Node, config: SquireConfig, preserveWS?: boolean, wsCache?: WSCache) => Node;
declare const removeEmptyInlines: (node: Node) => void;
declare const cleanupBRs: (node: Element | DocumentFragment, root: Element, keepForBlankLine: boolean) => void;
declare const escapeHTML: (text: string) => string;
export { cleanTree, cleanupBRs, isLineBreak, removeEmptyInlines, escapeHTML };
//# sourceMappingURL=Clean.d.ts.map