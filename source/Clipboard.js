/*jshint strict:false, undef:false, unused:false */

// The (non-standard but supported enough) innerText property is based on the
// render tree in Firefox and possibly other browsers, so we must insert the
// DOM node into the document to ensure the text part is correct.
var setClipboardData =
        function ( event, contents, root, willCutCopy, toPlainText, plainTextOnly ) {
    var clipboardData = event.clipboardData;
    var doc = event.target.ownerDocument;
    var body = doc.body;
    var node = createElement( doc, 'div' );
    var html, text;

    node.appendChild( contents );

    html = node.innerHTML;
    if ( willCutCopy ) {
        html = willCutCopy( html );
    }

    if ( toPlainText ) {
        text = toPlainText( html );
    } else {
        // Firefox will add an extra new line for BRs at the end of block when
        // calculating innerText, even though they don't actually affect
        // display, so we need to remove them first.
        cleanupBRs( node, root, true );
        node.setAttribute( 'style',
            'position:fixed;overflow:hidden;bottom:100%;right:100%;' );
        body.appendChild( node );
        text = node.innerText || node.textContent;
        text = text.replace( / /g, ' ' ); // Replace nbsp with regular space
        node.remove();
    }
    // Firefox (and others?) returns unix line endings (\n) even on Windows.
    // If on Windows, normalise to \r\n, since Notepad and some other crappy
    // apps do not understand just \n.
    if ( isWin ) {
        text = text.replace( /\r?\n/g, '\r\n' );
    }

    if ( !plainTextOnly && text !== html ) {
        clipboardData.setData( 'text/html', html );
    }
    clipboardData.setData( 'text/plain', text );
    event.preventDefault();
};

var onCut = function ( event ) {
    var range = this.getSelection();
    var root = this._root;
    var self = this;
    var startBlock, endBlock, copyRoot, contents, parent, newContents;

    // Nothing to do
    if ( range.collapsed ) {
        event.preventDefault();
        return;
    }

    // Save undo checkpoint
    this.saveUndoState( range );

    // Edge only seems to support setting plain text as of 2016-03-11.
    if ( !isEdge && event.clipboardData ) {
        // Clipboard content should include all parents within block, or all
        // parents up to root if selection across blocks
        startBlock = getStartBlockOfRange( range, root );
        endBlock = getEndBlockOfRange( range, root );
        copyRoot = ( ( startBlock === endBlock ) && startBlock ) || root;
        // Extract the contents
        contents = deleteContentsOfRange( range, root );
        // Add any other parents not in extracted content, up to copy root
        parent = range.commonAncestorContainer;
        if ( parent.nodeType === TEXT_NODE ) {
            parent = parent.parentNode;
        }
        while ( parent && parent !== copyRoot ) {
            newContents = parent.cloneNode( false );
            newContents.appendChild( contents );
            contents = newContents;
            parent = parent.parentNode;
        }
        // Set clipboard data
        setClipboardData(
            event, contents, root, this._config.willCutCopy, null, false );
    } else {
        setTimeout( function () {
            try {
                // If all content removed, ensure div at start of root.
                self._ensureBottomLine();
            } catch ( error ) {
                self.didError( error );
            }
        }, 0 );
    }

    this.setSelection( range );
};

var _onCopy = function ( event, range, root, willCutCopy, toPlainText, plainTextOnly ) {
    var startBlock, endBlock, copyRoot, contents, parent, newContents;
    // Edge only seems to support setting plain text as of 2016-03-11.
    if ( !isEdge && event.clipboardData ) {
        // Clipboard content should include all parents within block, or all
        // parents up to root if selection across blocks
        startBlock = getStartBlockOfRange( range, root );
        endBlock = getEndBlockOfRange( range, root );
        copyRoot = ( ( startBlock === endBlock ) && startBlock ) || root;
        // Clone range to mutate, then move up as high as possible without
        // passing the copy root node.
        range = range.cloneRange();
        moveRangeBoundariesDownTree( range );
        moveRangeBoundariesUpTree( range, copyRoot, copyRoot, root );
        // Extract the contents
        contents = range.cloneContents();
        // Add any other parents not in extracted content, up to copy root
        parent = range.commonAncestorContainer;
        if ( parent.nodeType === TEXT_NODE ) {
            parent = parent.parentNode;
        }
        while ( parent && parent !== copyRoot ) {
            newContents = parent.cloneNode( false );
            newContents.appendChild( contents );
            contents = newContents;
            parent = parent.parentNode;
        }
        // Set clipboard data
        setClipboardData( event, contents, root, willCutCopy, toPlainText, plainTextOnly );
    }
};

var onCopy = function ( event ) {
    _onCopy(
        event,
        this.getSelection(),
        this._root,
        this._config.willCutCopy,
        null,
        false
    );
};

// Need to monitor for shift key like this, as event.shiftKey is not available
// in paste event.
function monitorShiftKey ( event ) {
    this.isShiftDown = event.shiftKey;
}

var onPaste = function ( event ) {
    var clipboardData = event.clipboardData;
    var items = clipboardData && clipboardData.items;
    var choosePlain = this.isShiftDown;
    var fireDrop = false;
    var hasRTF = false;
    var hasImage = false;
    var plainItem = null;
    var htmlItem = null;
    var self = this;
    var l, item, type, types, data;

    // Current HTML5 Clipboard interface
    // ---------------------------------
    // https://html.spec.whatwg.org/multipage/interaction.html
    if ( items ) {
        l = items.length;
        while ( l-- ) {
            item = items[l];
            type = item.type;
            if ( type === 'text/html' ) {
                htmlItem = item;
            // iOS copy URL gives you type text/uri-list which is just a list
            // of 1 or more URLs separated by new lines. Can just treat as
            // plain text.
            } else if ( type === 'text/plain' || type === 'text/uri-list' ) {
                plainItem = item;
            } else if ( type === 'text/rtf' ) {
                hasRTF = true;
            } else if ( /^image\/.*/.test( type ) ) {
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
        if ( hasImage && !( hasRTF && htmlItem ) ) {
            event.preventDefault();
            this.fireEvent( 'dragover', {
                dataTransfer: clipboardData,
                /*jshint loopfunc: true */
                preventDefault: function () {
                    fireDrop = true;
                }
                /*jshint loopfunc: false */
            });
            if ( fireDrop ) {
                this.fireEvent( 'drop', {
                    dataTransfer: clipboardData
                });
            }
            return;
        }

        // Edge only provides access to plain text as of 2016-03-11 and gives no
        // indication there should be an HTML part. However, it does support
        // access to image data, so we check for that first. Otherwise though,
        // fall through to fallback clipboard handling methods
        if ( !isEdge ) {
            event.preventDefault();
            if ( htmlItem && ( !choosePlain || !plainItem ) ) {
                htmlItem.getAsString( function ( html ) {
                    self.insertHTML( html, true );
                });
            } else if ( plainItem ) {
                plainItem.getAsString( function ( text ) {
                    self.insertPlainText( text, true );
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
    types = clipboardData && clipboardData.types;
    if ( !isEdge && types && (
            indexOf.call( types, 'text/html' ) > -1 || (
                !isGecko &&
                indexOf.call( types, 'text/plain' ) > -1 &&
                indexOf.call( types, 'text/rtf' ) < 0 )
            )) {
        event.preventDefault();
        // Abiword on Linux copies a plain text and html version, but the HTML
        // version is the empty string! So always try to get HTML, but if none,
        // insert plain text instead. On iOS, Facebook (and possibly other
        // apps?) copy links as type text/uri-list, but also insert a **blank**
        // text/plain item onto the clipboard. Why? Who knows.
        if ( !choosePlain && ( data = clipboardData.getData( 'text/html' ) ) ) {
            this.insertHTML( data, true );
        } else if (
                ( data = clipboardData.getData( 'text/plain' ) ) ||
                ( data = clipboardData.getData( 'text/uri-list' ) ) ) {
            this.insertPlainText( data, true );
        }
        return;
    }

    // No interface. Includes all versions of IE :(
    // --------------------------------------------

    this._awaitingPaste = true;

    var body = this._doc.body,
        range = this.getSelection(),
        startContainer = range.startContainer,
        startOffset = range.startOffset,
        endContainer = range.endContainer,
        endOffset = range.endOffset;

    // We need to position the pasteArea in the visible portion of the screen
    // to stop the browser auto-scrolling.
    var pasteArea = this.createElement( 'DIV', {
        contenteditable: 'true',
        style: 'position:fixed; overflow:hidden; top:0; right:100%; width:1px; height:1px;'
    });
    body.appendChild( pasteArea );
    range.selectNodeContents( pasteArea );
    this.setSelection( range );

    // A setTimeout of 0 means this is added to the back of the
    // single javascript thread, so it will be executed after the
    // paste event.
    setTimeout( function () {
        try {
            // IE sometimes fires the beforepaste event twice; make sure it is
            // not run again before our after paste function is called.
            self._awaitingPaste = false;

            // Get the pasted content and clean
            var html = '',
                next = pasteArea,
                first, range;

            // #88: Chrome can apparently split the paste area if certain
            // content is inserted; gather them all up.
            while ( pasteArea = next ) {
                next = pasteArea.nextSibling;
                detach( pasteArea );
                // Safari and IE like putting extra divs around things.
                first = pasteArea.firstChild;
                if ( first && first === pasteArea.lastChild &&
                        first.nodeName === 'DIV' ) {
                    pasteArea = first;
                }
                html += pasteArea.innerHTML;
            }

            range = self.createRange(
                startContainer, startOffset, endContainer, endOffset );
            self.setSelection( range );

            if ( html ) {
                self.insertHTML( html, true );
            }
        } catch ( error ) {
            self.didError( error );
        }
    }, 0 );
};

// On Windows you can drag an drop text. We can't handle this ourselves, because
// as far as I can see, there's no way to get the drop insertion point. So just
// save an undo state and hope for the best.
var onDrop = function ( event ) {
    var types = event.dataTransfer.types;
    var l = types.length;
    var hasPlain = false;
    var hasHTML = false;
    while ( l-- ) {
        switch ( types[l] ) {
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
    if ( hasHTML || hasPlain ) {
        this.saveUndoState();
    }
};
