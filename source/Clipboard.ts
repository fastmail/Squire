import { cleanupBRs } from './Clean';
import { isWin, isGecko, isLegacyEdge, notWS } from './Constants';
import { createElement, detach } from './node/Node';
import { getStartBlockOfRange, getEndBlockOfRange } from './range/Block';
import { createRange, deleteContentsOfRange } from './range/InsertDelete';
import {
    moveRangeBoundariesDownTree,
    moveRangeBoundariesUpTree,
} from './range/Boundaries';

import type { Squire } from './Editor';

// ---

const indexOf = Array.prototype.indexOf;

// The (non-standard but supported enough) innerText property is based on the
// render tree in Firefox and possibly other browsers, so we must insert the
// DOM node into the document to ensure the text part is correct.
const setClipboardData = (
    event: ClipboardEvent,
    contents: Node,
    root: HTMLElement,
    toCleanHTML: null | ((html: string) => string),
    toPlainText: null | ((html: string) => string),
    plainTextOnly: boolean,
): void => {
    const clipboardData = event.clipboardData!;
    const body = document.body;
    const node = createElement('DIV') as HTMLDivElement;
    let html: string | undefined;
    let text: string | undefined;

    if (
        contents.childNodes.length === 1 &&
        contents.childNodes[0] instanceof Text
    ) {
        // Replace nbsp with regular space;
        // eslint-disable-next-line no-irregular-whitespace
        text = contents.childNodes[0].data.replace(/ /g, ' ');
        plainTextOnly = true;
    } else {
        node.appendChild(contents);
        html = node.innerHTML;
        if (toCleanHTML) {
            html = toCleanHTML(html);
        }
    }

    if (text !== undefined) {
        // Do nothing; we were copying plain text to start
    } else if (toPlainText && html !== undefined) {
        text = toPlainText(html);
    } else {
        // Firefox will add an extra new line for BRs at the end of block when
        // calculating innerText, even though they don't actually affect
        // display, so we need to remove them first.
        cleanupBRs(node, root, true);
        node.setAttribute(
            'style',
            'position:fixed;overflow:hidden;bottom:100%;right:100%;',
        );
        body.appendChild(node);
        text = node.innerText || node.textContent!;
        // Replace nbsp with regular space
        // eslint-disable-next-line no-irregular-whitespace
        text = text.replace(/ /g, ' ');
        body.removeChild(node);
    }
    // Firefox (and others?) returns unix line endings (\n) even on Windows.
    // If on Windows, normalise to \r\n, since Notepad and some other crappy
    // apps do not understand just \n.
    if (isWin) {
        text = text.replace(/\r?\n/g, '\r\n');
    }

    if (!plainTextOnly && html && text !== html) {
        clipboardData.setData('text/html', html);
    }
    clipboardData.setData('text/plain', text);
    event.preventDefault();
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
    if (!isLegacyEdge && event.clipboardData) {
        // Clipboard content should include all parents within block, or all
        // parents up to root if selection across blocks
        const startBlock = getStartBlockOfRange(range, root);
        const endBlock = getEndBlockOfRange(range, root);
        let copyRoot = root;
        // If the content is not in well-formed blocks, the start and end block
        // may be the same, but actually the range goes outside it. Must check!
        if (
            startBlock === endBlock &&
            startBlock?.contains(range.commonAncestorContainer)
        ) {
            copyRoot = startBlock;
        }
        // Extract the contents
        let contents: Node;
        if (removeRangeFromDocument) {
            contents = deleteContentsOfRange(range, root);
        } else {
            // Clone range to mutate, then move up as high as possible without
            // passing the copy root node.
            range = range.cloneRange();
            moveRangeBoundariesDownTree(range);
            moveRangeBoundariesUpTree(range, copyRoot, copyRoot, root);
            contents = range.cloneContents();
        }
        // Add any other parents not in extracted content, up to copy root
        let parent = range.commonAncestorContainer;
        if (parent instanceof Text) {
            parent = parent.parentNode!;
        }
        while (parent && parent !== copyRoot) {
            const newContents = parent.cloneNode(false);
            newContents.appendChild(contents);
            contents = newContents;
            parent = parent.parentNode!;
        }
        // Set clipboard data
        setClipboardData(
            event,
            contents,
            root,
            toCleanHTML,
            toPlainText,
            plainTextOnly,
        );
        return true;
    }
    return false;
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
        // but also an HTML version (referencing the original URL of the image)
        // and a plain text version.
        //
        // However, when you copy in Excel, you get html, rtf, text, image;
        // in this instance you want the html version! So let's try using
        // the presence of text/rtf as an indicator to choose the html version
        // over the image.
        if (hasImage && !(hasRTF && htmlItem)) {
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
                    let isLink = false;
                    const range = this.getSelection();
                    if (!range.collapsed && notWS.test(range.toString())) {
                        const match = this.linkRegExp.exec(text);
                        isLink = !!match && match[0].length === text.length;
                    }
                    if (isLink) {
                        this.makeLink(text);
                    } else {
                        this.insertPlainText(text, true);
                    }
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

// On Windows you can drag an drop text. We can't handle this ourselves, because
// as far as I can see, there's no way to get the drop insertion point. So just
// save an undo state and hope for the best.
const _onDrop = function (this: Squire, event: DragEvent): void {
    // it's possible for dataTransfer to be null, let's avoid it.
    if (!event.dataTransfer) {
        return;
    }
    const types = event.dataTransfer.types;
    let l = types.length;
    let hasPlain = false;
    let hasHTML = false;
    while (l--) {
        switch (types[l]) {
            case 'text/plain':
                hasPlain = true;
                break;
            case 'text/html':
                hasHTML = true;
                break;
            default:
                return;
        }
    }
    if (hasHTML || (hasPlain && this.saveUndoState)) {
        this.saveUndoState();
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
};
