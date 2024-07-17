import type { Squire } from './Editor';
declare const extractRangeToClipboard: (event: ClipboardEvent, range: Range, root: HTMLElement, removeRangeFromDocument: boolean, toCleanHTML: null | ((html: string) => string), toPlainText: null | ((html: string) => string), plainTextOnly: boolean) => boolean;
declare const _onCut: (this: Squire, event: ClipboardEvent) => void;
declare const _onCopy: (this: Squire, event: ClipboardEvent) => void;
declare const _monitorShiftKey: (this: Squire, event: KeyboardEvent) => void;
declare const _onPaste: (this: Squire, event: ClipboardEvent) => void;
declare const _onDrop: (this: Squire, event: DragEvent) => void;
export { extractRangeToClipboard, _onCut, _onCopy, _monitorShiftKey, _onPaste, _onDrop, };
//# sourceMappingURL=Clipboard.d.ts.map