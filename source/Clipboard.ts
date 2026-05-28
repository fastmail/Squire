import { isWin, isGecko, isLegacyEdge, notWS } from './Constants';
import { createElement, detach } from './node/Node';
import { getStartBlockOfRange, getEndBlockOfRange } from './range/Block';
import { createRange, deleteContentsOfRange } from './range/InsertDelete';

import type { Squire } from './Editor';
import { getTextContentsOfRange } from './range/Contents';
import { resetNodeCategoryCache } from './node/Category';

// ---

const indexOf = Array.prototype.indexOf;

const extractRange = (
    range: Range,
    root: HTMLElement,
    removeRangeFromDocument: boolean,
    toCleanHTML: null | ((html: string) => string),
    toPlainText: null | ((html: string) => string),
): [string, string | undefined] => {
    // First get the plain text version from the range (unless we have a custom
    // HTML -> Text conversion fn)
    let text = toPlainText ? '' : getTextContentsOfRange(range);

    // Clipboard content should include all parents within block, or all
    // parents up to root if selection across blocks
    const startBlock = getStartBlockOfRange(range, root);
    const endBlock = getEndBlockOfRange(range, root);
    let parent = range.commonAncestorContainer;
    let copyRoot = root;

    // If the content is not in well-formed blocks, the start and end block
    // may be the same, but actually the range goes outside it. Must check!
    if (startBlock === endBlock && startBlock?.contains(parent)) {
        copyRoot = startBlock;
    }

    // Extract the contents
    let contents: Node;
    if (removeRangeFromDocument) {
        contents = deleteContentsOfRange(range, root);
    } else {
        contents = range.cloneContents();
    }

    // Add any other parents not in extracted content, up to copy root
    if (parent instanceof Text) {
        parent = parent.parentNode!;
    }
    while (parent && parent !== copyRoot) {
        const newContents = parent.cloneNode(false);
        newContents.appendChild(contents);
        contents = newContents;
        parent = parent.parentNode!;
    }

    // Get HTML version of data
    let html: string | undefined;
    if (
        contents.childNodes.length === 1 &&
        contents.childNodes[0] instanceof Text
    ) {
        // Replace nbsp with regular space;
        // eslint-disable-next-line no-irregular-whitespace
        text = contents.childNodes[0].data.replace(/ /g, ' ');
        html = undefined;
    } else {
        const node = createElement('DIV') as HTMLDivElement;
        node.appendChild(contents);
        html = node.innerHTML;
        if (toCleanHTML) {
            html = toCleanHTML(html);
        }
    }

    // Get Text version of data if converting from HTML
    if (toPlainText && html !== undefined) {
        text = toPlainText(html);
    }

    // If Text and HTML versions are the same, we only have plain text
    if (text === html) {
        html = undefined;
    }

    // Firefox (and others?) returns unix line endings (\n) even on Windows.
    // If on Windows, normalise to \r\n, since Notepad and some other crappy
    // apps do not understand just \n.
    if (isWin) {
        text = text.replace(/\r?\n/g, '\r\n');
    }

    // Mark that this HTML came internally so we preserve fonts etc.
    if (html) {
        html = '<!-- squire -->' + html;
    }

    return [text, html];
};

const extractRangeToClipboard = (
    event: ClipboardEvent,
    range: Range,
    root: HTMLElement,
    removeRangeFromDocument: boolean,
    toCleanHTML: null | ((html: string) => string),
    toPlainText: null | ((html: string) => string),
    plainTextOnly: boolean,
): boolean => {
    // Edge only seems to support setting plain text as of 2016-03-11.
    const clipboardData = event.clipboardData;
    if (isLegacyEdge || !clipboardData) {
        return false;
    }
    let [text, html] = extractRange(
        range,
        root,
        removeRangeFromDocument,
        toCleanHTML,
        toPlainText,
    );

    // Set clipboard data
    if (!plainTextOnly && html) {
        clipboardData.setData('text/html', html);
    }
    clipboardData.setData('text/plain', text);
    event.preventDefault();

    return true;
};

// ---

const _onCut = function (this: Squire, event: ClipboardEvent): void {
    const range: Range = this.getSelection();
    const root: HTMLElement = this._root;

    // Nothing to do
    if (range.collapsed) {
        event.preventDefault();
        return;
    }

    // Save undo checkpoint
    this.saveUndoState(range);

    const handled = extractRangeToClipboard(
        event,
        range,
        root,
        true,
        this._config.willCutCopy,
        this._config.toPlainText,
        false,
    );
    if (!handled) {
        setTimeout(() => {
            try {
                // If all content removed, ensure div at start of root.
                this._ensureBottomLine();
            } catch (error) {
                this._config.didError(error);
            }
        }, 0);
    }

    this.setSelection(range);
};

const _onCopy = function (this: Squire, event: ClipboardEvent): void {
    extractRangeToClipboard(
        event,
        this.getSelection(),
        this._root,
        false,
        this._config.willCutCopy,
        this._config.toPlainText,
        false,
    );
};

// Need to monitor for shift key like this, as event.shiftKey is not available
// in paste event.
const _monitorShiftKey = function (this: Squire, event: KeyboardEvent): void {
    this._isShiftDown = event.shiftKey;
};

const _onPaste = function (this: Squire, event: ClipboardEvent): void {
    const clipboardData = event.clipboardData;
    const items = clipboardData?.items;
    const choosePlain: boolean | undefined = this._isShiftDown;
    let hasRTF = false;
    let hasImage = false;
    let plainItem: null | DataTransferItem = null;
    let htmlItem: null | DataTransferItem = null;

    // Current HTML5 Clipboard interface
    // ---------------------------------
    // https://html.spec.whatwg.org/multipage/interaction.html
    if (items) {
        let l = items.length;
        while (l--) {
            const item = items[l];
            const type = item.type;
            if (type === 'text/html') {
                htmlItem = item;
                // iOS copy URL gives you type text/uri-list which is just a list
                // of 1 or more URLs separated by new lines. Can just treat as
                // plain text.
            } else if (type === 'text/plain' || type === 'text/uri-list') {
                plainItem = item;
            } else if (type === 'text/rtf') {
                hasRTF = true;
            } else if (/^image\/.*/.test(type)) {
                hasImage = true;
            }
        }

        // Treat image paste as a drop of an image file. When you copy
        // an image in Chrome/Firefox (at least), it copies the image data
        // but also an HTML version (referencing the original URL of the image).
        // When you copy in One Note you get plain + html + image. When you
        // copy in Excel, you get html, rtf, text, image.
        //
        // So we want:
        // image + html -> image
        // image + plain + html -> html
        // image + rtf + html -> html
        if (hasImage && !(hasRTF && htmlItem) && !plainItem) {
            event.preventDefault();
            this.fireEvent('pasteImage', {
                clipboardData,
            });
            return;
        }

        // Edge only provides access to plain text as of 2016-03-11 and gives no
        // indication there should be an HTML part. However, it does support
        // access to image data, so we check for that first. Otherwise though,
        // fall through to fallback clipboard handling methods
        if (!isLegacyEdge) {
            event.preventDefault();
            if (htmlItem && (!choosePlain || !plainItem)) {
                htmlItem.getAsString((html) => {
                    this.insertHTML(html, true);
                });
            } else if (plainItem) {
                plainItem.getAsString((text) => {
                    // If we have a selection and text is solely a URL,
                    // just make the text a link.
                    const range = this.getSelection();
                    if (!range.collapsed && notWS.test(range.toString())) {
                        const match = this.linkRegExp.exec(text);
                        const isLink =
                            !!match && match[0].length === text.length;
                        if (isLink) {
                            const href = match[1]
                                ? /^(?:ht|f)tps?:/i.test(match[1])
                                    ? match[1]
                                    : 'http://' + match[1]
                                : 'mailto:' + match[0];
                            this.makeLink(href);
                            return;
                        }
                    }
                    this.insertPlainText(text, true);
                });
            }
            return;
        }
    }

    // Old interface
    // -------------

    // Safari (and indeed many other OS X apps) copies stuff as text/rtf
    // rather than text/html; even from a webpage in Safari. The only way
    // to get an HTML version is to fallback to letting the browser insert
    // the content. Same for getting image data. *Sigh*.
    //
    // Firefox is even worse: it doesn't even let you know that there might be
    // an RTF version on the clipboard, but it will also convert to HTML if you
    // let the browser insert the content. I've filed
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1254028
    const types = clipboardData?.types;
    if (
        !isLegacyEdge &&
        types &&
        (indexOf.call(types, 'text/html') > -1 ||
            (!isGecko &&
                indexOf.call(types, 'text/plain') > -1 &&
                indexOf.call(types, 'text/rtf') < 0))
    ) {
        event.preventDefault();
        // Abiword on Linux copies a plain text and html version, but the HTML
        // version is the empty string! So always try to get HTML, but if none,
        // insert plain text instead. On iOS, Facebook (and possibly other
        // apps?) copy links as type text/uri-list, but also insert a **blank**
        // text/plain item onto the clipboard. Why? Who knows.
        let data;
        if (!choosePlain && (data = clipboardData.getData('text/html'))) {
            this.insertHTML(data, true);
        } else if (
            (data = clipboardData.getData('text/plain')) ||
            (data = clipboardData.getData('text/uri-list'))
        ) {
            this.insertPlainText(data, true);
        }
        return;
    }

    // No interface. Includes all versions of IE :(
    // --------------------------------------------

    const body = document.body;
    const range = this.getSelection();
    const startContainer = range.startContainer;
    const startOffset = range.startOffset;
    const endContainer = range.endContainer;
    const endOffset = range.endOffset;

    // We need to position the pasteArea in the visible portion of the screen
    // to stop the browser auto-scrolling.
    let pasteArea: Element = createElement('DIV', {
        contenteditable: 'true',
        style: 'position:fixed; overflow:hidden; top:0; right:100%; width:1px; height:1px;',
    });
    body.appendChild(pasteArea);
    range.selectNodeContents(pasteArea);
    this.setSelection(range);

    // A setTimeout of 0 means this is added to the back of the
    // single javascript thread, so it will be executed after the
    // paste event.
    setTimeout(() => {
        try {
            // Get the pasted content and clean
            let html = '';
            let next: Element = pasteArea;
            let first: Node | null;

            // #88: Chrome can apparently split the paste area if certain
            // content is inserted; gather them all up.
            while ((pasteArea = next)) {
                next = pasteArea.nextSibling as Element;
                detach(pasteArea);
                // Safari and IE like putting extra divs around things.
                first = pasteArea.firstChild;
                if (
                    first &&
                    first === pasteArea.lastChild &&
                    first instanceof HTMLDivElement
                ) {
                    pasteArea = first;
                }
                html += pasteArea.innerHTML;
            }

            this.setSelection(
                createRange(
                    startContainer,
                    startOffset,
                    endContainer,
                    endOffset,
                ),
            );

            if (html) {
                this.insertHTML(html, true);
            }
        } catch (error) {
            this._config.didError(error);
        }
    }, 0);
};

// Record the selection when a drag starts inside the editor so that on drop
// we can move (rather than copy) the dragged content explicitly, rather than
// relying on the browser's default move-on-drop behaviour (which we
// preventDefault to take control of the insertion point).
const _onDragStart = function (this: Squire): void {
    const range = this.getSelection();
    if (
        range &&
        !range.collapsed &&
        this._root.contains(range.commonAncestorContainer)
    ) {
        this._dragRange = range.cloneRange();
    } else {
        this._dragRange = null;
    }
};

const _onDragEnd = function (this: Squire): void {
    this._dragRange = null;
};

// Find the caret position at the given client coordinates as a collapsed
// Range, but only if the position lies inside the editor root. Returns null
// otherwise (e.g. the drop landed on the editor's padding or outside it
// entirely).
const getCaretRangeFromPoint = (
    x: number,
    y: number,
    root: HTMLElement,
): Range | null => {
    let range: Range | null = null;
    const doc = document as Document & {
        caretPositionFromPoint?: (
            x: number,
            y: number,
        ) => { offsetNode: Node; offset: number } | null;
        caretRangeFromPoint?: (x: number, y: number) => Range | null;
    };
    if (doc.caretPositionFromPoint) {
        const pos = doc.caretPositionFromPoint(x, y);
        if (pos) {
            range = document.createRange();
            range.setStart(pos.offsetNode, pos.offset);
            range.collapse(true);
        }
    } else if (doc.caretRangeFromPoint) {
        range = doc.caretRangeFromPoint(x, y);
    }
    if (range && !root.contains(range.commonAncestorContainer)) {
        return null;
    }
    return range;
};

// Whether `point` (a collapsed range) lies within [source.start, source.end],
// inclusive. We bail in that case rather than try to drop content into the
// region we're about to delete.
const pointIsWithinRange = (point: Range, source: Range): boolean => {
    return (
        point.compareBoundaryPoints(Range.START_TO_START, source) >= 0 &&
        point.compareBoundaryPoints(Range.END_TO_END, source) <= 0
    );
};

const _onDrop = function (this: Squire, event: DragEvent): void {
    const dataTransfer = event.dataTransfer;
    if (!dataTransfer) {
        return;
    }

    const types = dataTransfer.types;
    let hasPlain = false;
    let hasHTML = false;
    for (let i = 0, l = types.length; i < l; i += 1) {
        switch (types[i]) {
            case 'text/plain':
                hasPlain = true;
                break;
            case 'text/html':
                hasHTML = true;
                break;
        }
    }
    // We only handle text drops here. For files, images, URLs, etc. let any
    // other listeners (or the browser's default) deal with it.
    if (!hasPlain && !hasHTML) {
        return;
    }

    event.preventDefault();

    const root = this._root;
    let dropRange = getCaretRangeFromPoint(event.clientX, event.clientY, root);
    // Capture and clear the source range up front so an early return doesn't
    // leave it set for a subsequent drop.
    const dragRange = this._dragRange;
    this._dragRange = null;

    if (!dropRange) {
        return;
    }

    // For internal drags, bail if the drop lands inside the dragged
    // selection (would be a no-op move at best, content-eating bug at worst),
    // and skip the source deletion if the user asked for a copy (Ctrl/Alt).
    let text, html;
    if (dragRange) {
        if (pointIsWithinRange(dropRange, dragRange)) {
            return;
        }
        this._recordUndoState(dragRange, this._isInUndoState);
        const bookmark = document.createComment('');
        dropRange.insertNode(bookmark);
        this._getRangeAndRemoveBookmark(dragRange);
        [text, html] = extractRange(
            dragRange,
            root,
            dataTransfer.dropEffect !== 'copy',
            this._config.willCutCopy,
            this._config.toPlainText,
        );
        bookmark.replaceWith(
            createElement('INPUT', {
                id: this.startSelectionId,
                type: 'hidden',
            }),
            createElement('INPUT', {
                id: this.endSelectionId,
                type: 'hidden',
            }),
        );
        this._getRangeAndRemoveBookmark(dropRange);
        resetNodeCategoryCache();
    } else {
        this.saveUndoState(dropRange);
        if (hasHTML) {
            html = dataTransfer.getData('text/html');
        } else {
            text = dataTransfer.getData('text/plain');
        }
    }

    this.setSelection(dropRange);

    if (html !== undefined) {
        this.insertHTML(html, true);
    } else if (text !== undefined) {
        this.insertPlainText(text, true);
    }
};

// ---

export {
    extractRangeToClipboard,
    _onCut,
    _onCopy,
    _monitorShiftKey,
    _onPaste,
    _onDrop,
    _onDragStart,
    _onDragEnd,
};
