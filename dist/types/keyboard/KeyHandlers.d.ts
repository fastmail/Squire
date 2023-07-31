import type { Squire } from '../Editor';
declare const _onKey: (this: Squire, event: KeyboardEvent) => void;
type KeyHandler = (self: Squire, event: KeyboardEvent, range: Range) => void;
declare const keyHandlers: Record<string, KeyHandler>;
export { _onKey, keyHandlers };
//# sourceMappingURL=KeyHandlers.d.ts.map