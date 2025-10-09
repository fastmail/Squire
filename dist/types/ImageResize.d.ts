import type { Squire } from './Editor';
declare class ImageResizer {
    private _editor;
    private _root;
    private _currentImage;
    private _resizeContainer;
    private _handles;
    private _currentHandle;
    private _startX;
    private _startY;
    private _startWidth;
    private _startHeight;
    private _maxWidth;
    private _originalRatio;
    constructor(root: HTMLElement, editor: Squire);
    destroy(): void;
    handleEvent(event: Event): void;
    private _onClick;
    private _deselectImage;
    private _selectImage;
    private _positionResizeContainer;
    private _onPointerDown;
    private _onPointerMove;
    private _onPointerUp;
    private _onKeyDown;
}
export { ImageResizer };
//# sourceMappingURL=ImageResize.d.ts.map