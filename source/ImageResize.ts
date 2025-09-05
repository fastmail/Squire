import { getNextBlock, getPreviousBlock } from './node/Block';
import { createElement } from './node/Node';
import { getStartBlockOfRange } from './range/Block';

// ---

// Configuration for image resizing
const RESIZE_HANDLE_SIZE = 8;
const MIN_IMAGE_SIZE = 40;
const MAX_IMAGE_SIZE = 1200;

type ResizeHandle = {
    element: HTMLElement;
    cursor: string;
    position: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
};

const handlePositions: Array<{
    pos: ResizeHandle['position'];
    cursor: string;
}> = [
    { pos: 'nw', cursor: 'nwse-resize' },
    { pos: 'n', cursor: 'ns-resize' },
    { pos: 'ne', cursor: 'nesw-resize' },
    { pos: 'e', cursor: 'ew-resize' },
    { pos: 'se', cursor: 'nwse-resize' },
    { pos: 's', cursor: 'ns-resize' },
    { pos: 'sw', cursor: 'nesw-resize' },
    { pos: 'w', cursor: 'ew-resize' },
];

const keyHandlers = {
    ArrowUp: (editor, range, root) => {
        const block = getStartBlockOfRange(range, root);
        const prev = getPreviousBlock(block, root);
        range.selectNodeContents(prev);
        range.collapse(false);
        editor.setSelection(range).focus();
    },
    ArrowDown: (editor, range, root) => {
        const block = getStartBlockOfRange(range, root);
        const next = getNextBlock(block, root);
        range.selectNodeContents(next);
        range.collapse(true);
        editor.setSelection(range).focus();
    },
    Delete: (editor, range /* , root */) => {
        editor.replaceWithBlankLine(range);
    },
    Backspace: (editor, range /* , root */) => {
        editor.replaceWithBlankLine(range);
    },
};

class ImageResizer {
    private _editor: any;
    private _root: HTMLElement;
    private _currentImage: HTMLImageElement | null = null;
    private _resizeContainer: HTMLElement | null = null;
    private _handles: ResizeHandle[] | null = null;
    private _currentHandle: ResizeHandle | null = null;
    private _startX = 0;
    private _startY = 0;
    private _startWidth = 0;
    private _startHeight = 0;
    private _maxWidth = MAX_IMAGE_SIZE;
    private _originalRatio = 1;

    constructor(root: HTMLElement, editor) {
        this._editor = editor;
        this._root = root;

        // Register this object as the event handler
        document.addEventListener('click', this);
        editor.addEventListener('drop', this);
    }

    destroy(): void {
        this._deselectImage();
        this._editor.removeEventListener('drop', this);
        document.removeEventListener('click', this);
    }

    // EventListener interface implementation
    handleEvent(event: Event): void {
        switch (event.type) {
            case 'click':
                this._onClick(event as PointerEvent);
                break;
            case 'pointerdown':
                this._onPointerDown(event as PointerEvent);
                break;
            case 'pointermove':
                this._onPointerMove(event as PointerEvent);
                break;
            case 'pointercancel':
            case 'pointerup':
                this._onPointerUp(event as PointerEvent);
                break;
            case 'keydown':
                this._onKeyDown(event as KeyboardEvent);
                break;
            case 'drop':
                this._deselectImage();
                break;
        }
    }

    // ---

    private _onClick(event: PointerEvent): void {
        const target = event.target as HTMLElement;
        if (target.nodeName === 'IMG' && this._root.contains(target)) {
            event.stopPropagation();
            this._selectImage(target as HTMLImageElement);
        } else if (
            this._currentImage &&
            !this._handles.some((handle) => handle.element === target)
        ) {
            this._deselectImage();
        }
    }

    private _deselectImage(): void {
        if (!this._currentImage) {
            return;
        }

        document.removeEventListener('keydown', this);

        if (this._currentHandle) {
            this._onPointerUp({
                preventDefault() {},
                target: this._currentHandle.element,
            });
        }
        this._handles.forEach(({ element }) =>
            element.removeEventListener('pointerdown', this),
        );
        this._resizeContainer.remove();

        this._handles = null;
        this._resizeContainer = null;
        this._currentImage = null;
    }

    private _selectImage(image: HTMLImageElement): void {
        if (this._currentImage === image) {
            return; // Already selected
        }

        // Deselect current image if any
        this._deselectImage();

        this._root.blur();

        const handles = handlePositions.map(({ pos, cursor }) => {
            const offset = RESIZE_HANDLE_SIZE / 2;
            let positionStyle = '';

            switch (pos) {
                case 'nw':
                    positionStyle = `left: -${offset}px; top: -${offset}px;`;
                    break;
                case 'n':
                    positionStyle = `left: calc(50% - ${offset}px); top: -${offset}px;`;
                    break;
                case 'ne':
                    positionStyle = `right: -${offset}px; top: -${offset}px;`;
                    break;
                case 'e':
                    positionStyle = `right: -${offset}px; top: calc(50% - ${offset}px);`;
                    break;
                case 'se':
                    positionStyle = `right: -${offset}px; bottom: -${offset}px;`;
                    break;
                case 's':
                    positionStyle = `left: calc(50% - ${offset}px); bottom: -${offset}px;`;
                    break;
                case 'sw':
                    positionStyle = `left: -${offset}px; bottom: -${offset}px;`;
                    break;
                case 'w':
                    positionStyle = `left: -${offset}px; top: calc(50% - ${offset}px);`;
                    break;
            }

            const handle = createElement('div', {
                class: `squire-resize-handle squire-resize-handle-${pos}`,
                style: `
                    position: absolute;
                    width: ${RESIZE_HANDLE_SIZE}px;
                    height: ${RESIZE_HANDLE_SIZE}px;
                    background: #0067b9;
                    border: 1px solid #fff;
                    cursor: ${cursor};
                    pointer-events: auto;
                    touch-action: none;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                    ${positionStyle}
                `,
            });
            handle.addEventListener('pointerdown', this);
            return {
                element: handle,
                cursor,
                position: pos,
            };
        });
        const resizeContainer = createElement(
            'div',
            {
                class: 'squire-image-resize-container',
                style: 'position: absolute; pointer-events: none; z-index: 1000;',
            },
            handles.map((handle) => handle.element),
        );

        this._currentImage = image;
        this._resizeContainer = resizeContainer;
        this._handles = handles;
        this._root.appendChild(this._resizeContainer);

        const naturalWidth = image.naturalWidth;
        this._originalRatio = naturalWidth / image.naturalHeight;
        this._maxWidth = Math.min(
            naturalWidth * 2,
            image.parentElement.offsetWidth,
            MAX_IMAGE_SIZE,
        );

        this._positionResizeContainer();
        document.addEventListener('keydown', this);
    }

    private _positionResizeContainer(): void {
        const resizeContainer = this._resizeContainer;
        const root = this._root;
        const rootRect = root.getBoundingClientRect();
        const imageRect = this._currentImage.getBoundingClientRect();

        // Position relative to editor
        const top = imageRect.top - rootRect.top + root.scrollTop;
        const left = imageRect.left - rootRect.left + root.scrollLeft;
        const width = imageRect.width;
        const height = imageRect.height;

        resizeContainer.style.top = top + 'px';
        resizeContainer.style.left = left + 'px';
        resizeContainer.style.width = width + 'px';
        resizeContainer.style.height = height + 'px';
    }

    private _onPointerDown(event: PointerEvent): void {
        if (this._currentHandle) {
            return;
        }
        const target = event.target as HTMLElement;
        const currentHandle =
            this._handles.find((h) => h.element === target) || null;

        if (!currentHandle) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();

        target.addEventListener('pointermove', this);
        target.addEventListener('pointerup', this);
        target.addEventListener('pointercancel', this);
        target.setPointerCapture(event.pointerId);
        this._currentHandle = currentHandle;

        this._startX = event.clientX;
        this._startY = event.clientY;

        const currentImage = this._currentImage;
        const style = getComputedStyle(currentImage);
        this._startWidth = parseFloat(style.width);
        this._startHeight = parseFloat(style.height);

        document.body.style.cursor = currentHandle.cursor;
    }

    private _onPointerMove(event: PointerEvent): void {
        event.preventDefault();

        const deltaX = event.clientX - this._startX;
        const deltaY = event.clientY - this._startY;

        const maxWidth = this._maxWidth;
        const originalRatio = this._originalRatio;
        let newWidth = this._startWidth;
        let newHeight = this._startHeight;

        // Calculate new dimensions based on which handle is being dragged
        switch (this._currentHandle.position) {
            case 'sw':
            case 'nw':
            case 'w':
                newWidth -= 2 * deltaX;
                break;
            case 'se':
            case 'ne':
            case 'e':
                newWidth += 2 * deltaX;
                break;
            case 'n':
                newHeight -= deltaY;
                newWidth = newHeight * originalRatio;
                break;
            case 's':
                newHeight += deltaY;
                newWidth = newHeight * originalRatio;
                break;
        }

        // Apply min/max constraints
        if (newWidth < MIN_IMAGE_SIZE) {
            newWidth = MIN_IMAGE_SIZE;
        } else if (newWidth > maxWidth) {
            newWidth = maxWidth;
        }

        // Apply the new size
        const currentImageStyle = this._currentImage.style;
        currentImageStyle.width = newWidth + 'px';
        currentImageStyle.height = 'auto';

        // Update resize container position
        this._positionResizeContainer();
    }

    private _onPointerUp(
        event: PointerEvent | { preventDefault(): void; target: HTMLElement },
    ): void {
        event.preventDefault();

        const target = event.target;
        target.removeEventListener('pointermove', this);
        target.removeEventListener('pointerup', this);
        target.removeEventListener('pointercancel', this);

        this._currentHandle = null;

        document.body.style.cursor = '';
    }

    private _onKeyDown(event: KeyboardEvent): void {
        event.preventDefault();
        event.stopPropagation();
        const keyHandler = keyHandlers[event.key];
        if (!keyHandler) {
            return;
        }
        const image = this._currentImage;
        const editor = this._editor;
        const root = this._root;
        this._deselectImage();
        const range = editor.getSelection();
        range.selectNode(image);
        keyHandler(editor, range, root);
    }
}

// ---

export { ImageResizer };
