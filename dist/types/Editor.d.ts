type EventHandler = {
    handleEvent: (e: Event) => void;
} | ((e: Event) => void);
type KeyHandlerFunction = (x: Squire, y: KeyboardEvent, z: Range) => void;
type TagAttributes = {
    [key: string]: {
        [key: string]: string;
    };
};
interface SquireConfig {
    blockTag: string;
    blockAttributes: null | Record<string, string>;
    tagAttributes: TagAttributes;
    classNames: {
        color: string;
        fontFamily: string;
        fontSize: string;
        highlight: string;
    };
    undo: {
        documentSizeThreshold: number;
        undoLimit: number;
    };
    addLinks: boolean;
    willCutCopy: null | ((html: string) => string);
    toPlainText: null | ((html: string) => string);
    sanitizeToDOMFragment: (html: string, editor: Squire) => DocumentFragment;
    didError: (x: any) => void;
}
declare class Squire {
    _root: HTMLElement;
    _config: SquireConfig;
    _isFocused: boolean;
    _lastSelection: Range;
    _willRestoreSelection: boolean;
    _mayHaveZWS: boolean;
    _lastAnchorNode: Node | null;
    _lastFocusNode: Node | null;
    _path: string;
    _events: Map<string, Array<EventHandler>>;
    _undoIndex: number;
    _undoStack: Array<string>;
    _undoStackLength: number;
    _isInUndoState: boolean;
    _ignoreChange: boolean;
    _ignoreAllChanges: boolean;
    _isShiftDown: boolean;
    _keyHandlers: Record<string, KeyHandlerFunction>;
    _mutation: MutationObserver;
    constructor(root: HTMLElement, config?: Partial<SquireConfig>);
    destroy(): void;
    _makeConfig(userConfig?: object): SquireConfig;
    setKeyHandler(key: string, fn: KeyHandlerFunction): this;
    _beforeInput(event: InputEvent): void;
    handleEvent(event: Event): void;
    fireEvent(type: string, detail?: Event | object): Squire;
    /**
     * Subscribing to these events won't automatically add a listener to the
     * document node, since these events are fired in a custom manner by the
     * editor code.
     */
    customEvents: Set<string>;
    addEventListener(type: string, fn: EventHandler): Squire;
    removeEventListener(type: string, fn?: EventHandler): Squire;
    focus(): Squire;
    blur(): Squire;
    _enableRestoreSelection(): void;
    _disableRestoreSelection(): void;
    _restoreSelection(): void;
    _removeZWS(): void;
    startSelectionId: string;
    endSelectionId: string;
    _saveRangeToBookmark(range: Range): void;
    _getRangeAndRemoveBookmark(range?: Range): Range | null;
    getSelection(): Range;
    setSelection(range: Range): Squire;
    _moveCursorTo(toStart: boolean): Squire;
    moveCursorToStart(): Squire;
    moveCursorToEnd(): Squire;
    getCursorPosition(): DOMRect;
    getPath(): string;
    _updatePathOnEvent(): void;
    _updatePath(range: Range, force?: boolean): void;
    _getPath(node: Node): string;
    modifyDocument(modificationFn: () => void): Squire;
    _docWasChanged(): void;
    /**
     * Leaves bookmark.
     */
    _recordUndoState(range: Range, replace?: boolean): Squire;
    saveUndoState(range?: Range): Squire;
    undo(): Squire;
    redo(): Squire;
    getRoot(): HTMLElement;
    _getRawHTML(): string;
    _setRawHTML(html: string): Squire;
    getHTML(withBookmark?: boolean): string;
    setHTML(html: string): Squire;
    /**
     * Insert HTML at the cursor location. If the selection is not collapsed
     * insertTreeFragmentIntoRange will delete the selection so that it is
     * replaced by the html being inserted.
     */
    insertHTML(html: string, isPaste?: boolean): Squire;
    insertElement(el: Element, range?: Range): Squire;
    insertImage(src: string, attributes: Record<string, string>): HTMLImageElement;
    insertPlainText(plainText: string, isPaste: boolean): Squire;
    getSelectedText(range?: Range): string;
    /**
     * Extracts the font-family and font-size (if any) of the element
     * holding the cursor. If there's a selection, returns an empty object.
     */
    getFontInfo(range?: Range): Record<string, string | undefined>;
    /**
     * Looks for matching tag and attributes, so won't work if <strong>
     * instead of <b> etc.
     */
    hasFormat(tag: string, attributes?: Record<string, string> | null, range?: Range): boolean;
    changeFormat(add: {
        tag: string;
        attributes?: Record<string, string>;
    } | null, remove?: {
        tag: string;
        attributes?: Record<string, string>;
    } | null, range?: Range, partial?: boolean): Squire;
    _addFormat(tag: string, attributes: Record<string, string> | null, range: Range): Range;
    _removeFormat(tag: string, attributes: Record<string, string>, range: Range, partial?: boolean): Range;
    bold(): Squire;
    removeBold(): Squire;
    italic(): Squire;
    removeItalic(): Squire;
    underline(): Squire;
    removeUnderline(): Squire;
    strikethrough(): Squire;
    removeStrikethrough(): Squire;
    subscript(): Squire;
    removeSubscript(): Squire;
    superscript(): Squire;
    removeSuperscript(): Squire;
    makeLink(url: string, attributes?: Record<string, string>): Squire;
    removeLink(): Squire;
    linkRegExp: RegExp;
    addDetectedLinks(searchInNode: DocumentFragment | Node, root?: DocumentFragment | HTMLElement): Squire;
    setFontFace(name: string | null): Squire;
    setFontSize(size: string | null): Squire;
    setTextColor(color: string | null): Squire;
    setHighlightColor(color: string | null): Squire;
    _ensureBottomLine(): void;
    createDefaultBlock(children?: Node[]): HTMLElement;
    tagAfterSplit: Record<string, string>;
    splitBlock(lineBreakOnly: boolean, range?: Range): Squire;
    forEachBlock(fn: (el: HTMLElement) => any, mutates: boolean, range?: Range): Squire;
    modifyBlocks(modify: (x: DocumentFragment) => Node, range?: Range): Squire;
    setTextAlignment(alignment: string): Squire;
    setTextDirection(direction: string | null): Squire;
    _getListSelection(range: Range, root: Element): [Node, Node | null, Node | null] | null;
    increaseListLevel(range?: Range): Squire;
    decreaseListLevel(range?: Range): Squire;
    _makeList(frag: DocumentFragment, type: string): DocumentFragment;
    makeUnorderedList(): Squire;
    makeOrderedList(): Squire;
    removeList(): Squire;
    increaseQuoteLevel(range?: Range): Squire;
    decreaseQuoteLevel(range?: Range): Squire;
    removeQuote(range?: Range): Squire;
    replaceWithBlankLine(range?: Range): Squire;
    code(): Squire;
    removeCode(): Squire;
    toggleCode(): Squire;
    _removeFormatting(root: DocumentFragment | Element, clean: DocumentFragment | Element): DocumentFragment | Element;
    removeAllFormatting(range?: Range): Squire;
}
export { Squire };
export type { SquireConfig };
//# sourceMappingURL=Editor.d.ts.map