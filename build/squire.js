!function(e,t){"use strict";function n(e,t,n){this.root=this.currentNode=e,this.nodeType=t,this.filter=n}function o(e,t){for(var n=e.length;n--;)if(!t(e[n]))return!1;return!0}function r(e,t,n){if(e.nodeName!==t)return!1;for(var o in n)if(e.getAttribute(o)!==n[o])return!1;return!0}function i(e,t){return e.nodeType===t.nodeType&&e.nodeName===t.nodeName&&e.className===t.className&&(!e.style&&!t.style||e.style.cssText===t.style.cssText)}function a(e){return e.nodeType===x&&!!ne[e.nodeName]}function s(e){return te.test(e.nodeName)}function d(e){return e.nodeType===x&&!s(e)&&o(e.childNodes,s)}function l(e){return e.nodeType===x&&!s(e)&&!d(e)}function c(e){var t=e.ownerDocument,o=new n(t.body,A,d,!1);return o.currentNode=e,o}function h(e){return c(e).previousNode()}function f(e){return c(e).nextNode()}function u(e,t,n){do if(r(e,t,n))return e;while(e=e.parentNode);return null}function p(e){var t,n,o,r,i=e.parentNode;return i&&e.nodeType===x?(t=p(i),t+=(t?">":"")+e.nodeName,(n=e.id)&&(t+="#"+n),(o=e.className.trim())&&(r=o.split(/\s\s*/),r.sort(),t+=".",t+=r.join("."))):t=i?p(i):"",t}function g(e){var t=e.nodeType;return t===x?e.childNodes.length:e.length||0}function m(e){var t=e.parentNode;return t&&t.removeChild(e),e}function v(e,t){var n=e.parentNode;n&&n.replaceChild(t,e)}function N(e){for(var t=e.ownerDocument.createDocumentFragment(),n=e.childNodes,o=n?n.length:0;o--;)t.appendChild(e.firstChild);return t}function C(e,n,o,r){var i,a,s,d,l=e.createElement(n);if(o instanceof Array&&(r=o,o=null),o)for(i in o)a=o[i],a!==t&&l.setAttribute(i,o[i]);if(r)for(s=0,d=r.length;d>s;s+=1)l.appendChild(r[s]);return l}function S(e){var t,n,o,r=e.ownerDocument,i=e;if("BODY"===e.nodeName&&((n=e.firstChild)&&"BR"!==n.nodeName||(o=k(r),t=o?o.createDefaultBlock():C(r,"DIV"),n?e.replaceChild(t,n):e.appendChild(t),e=t,t=null)),s(e)){for(n=e.firstChild;$&&n&&n.nodeType===R&&!n.data;)e.removeChild(n),n=e.firstChild;n||($?(t=r.createTextNode(F),k(r)._didAddZWS()):t=r.createTextNode(""))}else if(G){for(;e.nodeType!==R&&!a(e);){if(n=e.firstChild,!n){t=r.createTextNode("");break}e=n}e.nodeType===R?/^ +$/.test(e.data)&&(e.data=""):a(e)&&e.parentNode.insertBefore(r.createTextNode(""),e)}else if(!e.querySelector("BR"))for(t=C(r,"BR");(n=e.lastElementChild)&&!s(n);)e=n;return t&&e.appendChild(t),i}function _(e){var t,n,o,r,i=e.childNodes,a=e.ownerDocument,d=null,c=k(a);for(t=0,n=i.length;n>t;t+=1)o=i[t],r="BR"===o.nodeName,!r&&s(o)?(d||(d=c?c.createDefaultBlock():C(a,"DIV")),d.appendChild(o),t-=1,n-=1):(r||d)&&(d||(d=c?c.createDefaultBlock():C(a,"DIV")),S(d),r?e.replaceChild(d,o):(e.insertBefore(d,o),t+=1,n+=1),d=null),l(o)&&_(o);return d&&e.appendChild(S(d)),e}function y(e,t,n){var o,r,i,a=e.nodeType;if(a===R&&e!==n)return y(e.parentNode,e.splitText(t),n);if(a===x){if("number"==typeof t&&(t=t<e.childNodes.length?e.childNodes[t]:null),e===n)return t;for(o=e.parentNode,r=e.cloneNode(!1);t;)i=t.nextSibling,r.appendChild(t),t=i;return"OL"===e.nodeName&&u(e,"BLOCKQUOTE")&&(r.start=(+e.start||1)+e.childNodes.length-1),S(e),S(r),(i=e.nextSibling)?o.insertBefore(r,i):o.appendChild(r),y(o,r,n)}return t}function T(e,t){if(e.nodeType===x)for(var n,o,r,a=e.childNodes,d=a.length,l=[];d--;)if(n=a[d],o=d&&a[d-1],d&&s(n)&&i(n,o)&&!ne[n.nodeName])t.startContainer===n&&(t.startContainer=o,t.startOffset+=g(o)),t.endContainer===n&&(t.endContainer=o,t.endOffset+=g(o)),t.startContainer===e&&(t.startOffset>d?t.startOffset-=1:t.startOffset===d&&(t.startContainer=o,t.startOffset=g(o))),t.endContainer===e&&(t.endOffset>d?t.endOffset-=1:t.endOffset===d&&(t.endContainer=o,t.endOffset=g(o))),m(n),n.nodeType===R?o.appendData(n.data):l.push(N(n));else if(n.nodeType===x){for(r=l.length;r--;)n.appendChild(l.pop());T(n,t)}}function E(e,t,n){for(var o,r,i,a=t;1===a.parentNode.childNodes.length;)a=a.parentNode;m(a),r=e.childNodes.length,o=e.lastChild,o&&"BR"===o.nodeName&&(e.removeChild(o),r-=1),i={startContainer:e,startOffset:r,endContainer:e,endOffset:r},e.appendChild(N(t)),T(e,i),n.setStart(i.startContainer,i.startOffset),n.collapse(!0),V&&(o=e.lastChild)&&"BR"===o.nodeName&&e.removeChild(o)}function b(e){var t,n,o=e.previousSibling,r=e.firstChild,a=e.ownerDocument,s="LI"===e.nodeName,d=k(a);if(!s||r&&/^[OU]L$/.test(r.nodeName))if(o&&i(o,e)){if(!l(o)){if(!s)return;n=d?d.createDefaultBlock():C(a,"DIV"),n.appendChild(N(o)),o.appendChild(n)}m(e),t=!l(e),o.appendChild(N(e)),t&&_(o),r&&b(r)}else s&&(o=d?d.createDefaultBlock():C(a,"DIV"),e.insertBefore(o,r),S(o))}function k(e){for(var t,n=Ne.length;n--;)if(t=Ne[n],t._doc===e)return t;return null}function B(e,t){for(var n in t)try{t[n].constructor==Object?e[n]=B(e[n],t[n]):e[n]=t[n]}catch(o){e[n]=t[n]}return e}function L(e,t){Ne.push(this);var n,o=e.defaultView,r=e.body;this._win=o,this._doc=e,this._body=r;var i={blockTag:"DIV",blockProperties:null};this.options=B(i,t),this.options.blockTag=this.options.blockTag.toUpperCase(),this._events={},this._sel=o.getSelection(),this._lastSelection=null,j&&this.addEventListener("beforedeactivate",this.getSelection),this._hasZWS=!1,this._lastAnchorNode=null,this._lastFocusNode=null,this._path="",this.addEventListener("keyup",this._updatePathOnEvent),this.addEventListener("mouseup",this._updatePathOnEvent),o.addEventListener("focus",this,!1),o.addEventListener("blur",this,!1),this._undoIndex=-1,this._undoStack=[],this._undoStackLength=0,this._isInUndoState=!1,this._ignoreChange=!1,Y?(n=new MutationObserver(this._docWasChanged.bind(this)),n.observe(r,{childList:!0,attributes:!0,characterData:!0,subtree:!0}),this._mutation=n):this.addEventListener("keyup",this._keyUpDetectChange),this._awaitingPaste=!1,this.addEventListener(Z?"beforecut":"cut",this._onCut),this.addEventListener(Z?"beforepaste":"paste",this._onPaste),this.addEventListener(V?"keypress":"keydown",this._onKey),Z&&(o.Text.prototype.splitText=function(e){var t=this.ownerDocument.createTextNode(this.data.slice(e)),n=this.nextSibling,o=this.parentNode,r=this.length-e;return n?o.insertBefore(t,n):o.appendChild(t),r&&this.deleteData(e,r),t}),r.setAttribute("contenteditable","true"),this.setHTML("");try{e.execCommand("enableObjectResizing",!1,"false"),e.execCommand("enableInlineTableEditing",!1,"false")}catch(a){}}var O=2,x=1,R=3,A=1,D=4,U=0,P=1,I=2,w=3,F="​",M=e.defaultView,W=navigator.userAgent,H=/iP(?:ad|hone|od)/.test(W),K=/Mac OS X/.test(W),z=/Gecko\//.test(W),Z=/Trident\/[456]\./.test(W),V=!!M.opera,q=/WebKit\//.test(W),Q=K?"meta-":"ctrl-",G=Z||V,$=Z||q,j=Z,Y="undefined"!=typeof MutationObserver,X=/[^ \t\r\n]/,J=Array.prototype.indexOf,ee={1:1,2:2,3:4,8:128,9:256,11:1024};n.prototype.nextNode=function(){for(var e,t=this.currentNode,n=this.root,o=this.nodeType,r=this.filter;;){for(e=t.firstChild;!e&&t&&t!==n;)e=t.nextSibling,e||(t=t.parentNode);if(!e)return null;if(ee[e.nodeType]&o&&r(e))return this.currentNode=e,e;t=e}},n.prototype.previousNode=function(){for(var e,t=this.currentNode,n=this.root,o=this.nodeType,r=this.filter;;){if(t===n)return null;if(e=t.previousSibling)for(;t=e.lastChild;)e=t;else e=t.parentNode;if(!e)return null;if(ee[e.nodeType]&o&&r(e))return this.currentNode=e,e;t=e}};var te=/^(?:#text|A(?:BBR|CRONYM)?|B(?:R|D[IO])?|C(?:ITE|ODE)|D(?:ATA|FN|EL)|EM|FONT|HR|I(?:NPUT|MG|NS)?|KBD|Q|R(?:P|T|UBY)|S(?:U[BP]|PAN|TR(?:IKE|ONG)|MALL|AMP)?|U|VAR|WBR)$/,ne={BR:1,IMG:1,INPUT:1},oe=function(e,t){for(var n=e.childNodes;t&&e.nodeType===x;)e=n[t-1],n=e.childNodes,t=n.length;return e},re=function(e,t){if(e.nodeType===x){var n=e.childNodes;if(t<n.length)e=n[t];else{for(;e&&!e.nextSibling;)e=e.parentNode;e&&(e=e.nextSibling)}}return e},ie=function(e,t){var n,o,r,i,a=e.startContainer,s=e.startOffset,d=e.endContainer,l=e.endOffset;a.nodeType===R?(n=a.parentNode,o=n.childNodes,s===a.length?(s=J.call(o,a)+1,e.collapsed&&(d=n,l=s)):(s&&(i=a.splitText(s),d===a?(l-=s,d=i):d===n&&(l+=1),a=i),s=J.call(o,a)),a=n):o=a.childNodes,r=o.length,s===r?a.appendChild(t):a.insertBefore(t,o[s]),a===d&&(l+=o.length-r),e.setStart(a,s),e.setEnd(d,l)},ae=function(e,t){var n=e.startContainer,o=e.startOffset,r=e.endContainer,i=e.endOffset;t||(t=e.commonAncestorContainer),t.nodeType===R&&(t=t.parentNode);for(var a,s,d,l=y(r,i,t),c=y(n,o,t),h=t.ownerDocument.createDocumentFragment();c!==l;)a=c.nextSibling,h.appendChild(c),c=a;return n=t,o=l?J.call(t.childNodes,l):t.childNodes.length,d=t.childNodes[o],s=d&&d.previousSibling,s&&s.nodeType===R&&d.nodeType===R&&(n=s,o=s.length,s.appendData(d.data),m(d)),e.setStart(n,o),e.collapse(!0),S(t),h},se=function(e){he(e),ae(e),ce(e);var t=fe(e),n=ue(e);t&&n&&t!==n&&E(t,n,e),t&&S(t);var o=e.endContainer.ownerDocument.body,r=o.firstChild;r&&"BR"!==r.nodeName||(S(o),e.selectNodeContents(o.firstChild))},de=function(e,t){for(var n=!0,o=t.childNodes,r=o.length;r--;)if(!s(o[r])){n=!1;break}if(e.collapsed||se(e),ce(e),n)ie(e,t),e.collapse(!1);else{for(var i,a,d=e.startContainer,l=y(d,e.startOffset,u(d.parentNode,"BLOCKQUOTE")||d.ownerDocument.body),c=l.previousSibling,h=c,p=h.childNodes.length,m=l,v=0,N=l.parentNode;(i=h.lastChild)&&i.nodeType===x&&"BR"!==i.nodeName;)h=i,p=h.childNodes.length;for(;(i=m.firstChild)&&i.nodeType===x&&"BR"!==i.nodeName;)m=i;for(;(i=t.firstChild)&&s(i);)h.appendChild(i);for(;(i=t.lastChild)&&s(i);)m.insertBefore(i,m.firstChild),v+=1;for(a=t;a=f(a);)S(a);N.insertBefore(t,l),a=l.previousSibling,l.textContent?b(l):N.removeChild(l),l.parentNode||(m=a,v=g(m)),c.textContent?b(c):(h=c.nextSibling,p=0,N.removeChild(c)),e.setStart(h,p),e.setEnd(m,v),ce(e)}},le=function(e,t,n){var o=t.ownerDocument.createRange();if(o.selectNode(t),n){var r=e.compareBoundaryPoints(w,o)>-1,i=e.compareBoundaryPoints(P,o)<1;return!r&&!i}var a=e.compareBoundaryPoints(U,o)<1,s=e.compareBoundaryPoints(I,o)>-1;return a&&s},ce=function(e){for(var t,n=e.startContainer,o=e.startOffset,r=e.endContainer,i=e.endOffset;n.nodeType!==R&&(t=n.childNodes[o],t&&!a(t));)n=t,o=0;if(i)for(;r.nodeType!==R&&(t=r.childNodes[i-1],t&&!a(t));)r=t,i=g(r);else for(;r.nodeType!==R&&(t=r.firstChild,t&&!a(t));)r=t;e.collapsed?(e.setStart(r,i),e.setEnd(n,o)):(e.setStart(n,o),e.setEnd(r,i))},he=function(e,t){var n,o=e.startContainer,r=e.startOffset,i=e.endContainer,a=e.endOffset;for(t||(t=e.commonAncestorContainer);o!==t&&!r;)n=o.parentNode,r=J.call(n.childNodes,o),o=n;for(;i!==t&&a===g(i);)n=i.parentNode,a=J.call(n.childNodes,i)+1,i=n;e.setStart(o,r),e.setEnd(i,a)},fe=function(e){var t,n=e.startContainer;return s(n)?t=h(n):d(n)?t=n:(t=oe(n,e.startOffset),t=f(t)),t&&le(e,t,!0)?t:null},ue=function(e){var t,n,o=e.endContainer;if(s(o))t=h(o);else if(d(o))t=o;else{if(t=re(o,e.endOffset),!t)for(t=o.ownerDocument.body;n=t.lastChild;)t=n;t=h(t)}return t&&le(e,t,!0)?t:null},pe=new n(null,D|A,function(e){return e.nodeType===R?X.test(e.data):"IMG"===e.nodeName}),ge=function(e){var t=e.startContainer,n=e.startOffset;if(t.nodeType===R){if(n)return!1;pe.currentNode=t}else pe.currentNode=re(t,n);return pe.root=fe(e),!pe.previousNode()},me=function(e){var t,n=e.endContainer,o=e.endOffset;if(n.nodeType===R){if(t=n.data.length,t&&t>o)return!1;pe.currentNode=n}else pe.currentNode=oe(n,o);return pe.root=ue(e),!pe.nextNode()},ve=function(e){var t,n=fe(e),o=ue(e);n&&o&&(t=n.parentNode,e.setStart(t,J.call(t.childNodes,n)),t=o.parentNode,e.setEnd(t,J.call(t.childNodes,o)+1))},Ne=[],Ce=L.prototype;Ce.createElement=function(e,t,n){return C(this._doc,e,t,n)},Ce.createDefaultBlock=function(e){return S(this.createElement(this.options.blockTag,this.options.blockProperties,e))},Ce.didError=function(e){console.log(e)},Ce.getDocument=function(){return this._doc};var Se={focus:1,blur:1,pathChange:1,select:1,input:1,undoStateChange:1};Ce.fireEvent=function(e,t){var n,o,r,i=this._events[e];if(i)for(t||(t={}),t.type!==e&&(t.type=e),i=i.slice(),n=0,o=i.length;o>n;n+=1){r=i[n];try{r.handleEvent?r.handleEvent(t):r.call(this,t)}catch(a){a.details="Squire: fireEvent error. Event type: "+e,this.didError(a)}}return this},Ce.destroy=function(){var e,t=this._win,n=this._doc,o=this._events;t.removeEventListener("focus",this,!1),t.removeEventListener("blur",this,!1);for(e in o)Se[e]||n.removeEventListener(e,this,!0);this._mutation&&this._mutation.disconnect();for(var r=Ne.length;r--;)Ne[r]===this&&Ne.splice(r,1)},Ce.handleEvent=function(e){this.fireEvent(e.type,e)},Ce.addEventListener=function(e,t){var n=this._events[e];return t?(n||(n=this._events[e]=[],Se[e]||this._doc.addEventListener(e,this,!0)),n.push(t),this):(this.didError({name:"Squire: addEventListener with null or undefined fn",message:"Event type: "+e}),this)},Ce.removeEventListener=function(e,t){var n,o=this._events[e];if(o){for(n=o.length;n--;)o[n]===t&&o.splice(n,1);o.length||(delete this._events[e],Se[e]||this._doc.removeEventListener(e,this,!1))}return this},Ce._createRange=function(e,t,n,o){if(e instanceof this._win.Range)return e.cloneRange();var r=this._doc.createRange();return r.setStart(e,t),n?r.setEnd(n,o):r.setEnd(e,t),r},Ce.setSelection=function(e){if(e){H&&this._win.focus();var t=this._sel;t.removeAllRanges(),t.addRange(e)}return this},Ce.getSelection=function(){var e,t,n,o=this._sel;return o.rangeCount?(e=o.getRangeAt(0).cloneRange(),t=e.startContainer,n=e.endContainer,t&&a(t)&&e.setStartBefore(t),n&&a(n)&&e.setEndBefore(n),this._lastSelection=e):e=this._lastSelection,e||(e=this._createRange(this._body.firstChild,0)),e},Ce.getSelectedText=function(){var e,t=this.getSelection(),o=new n(t.commonAncestorContainer,D|A,function(e){return le(t,e,!0)}),r=t.startContainer,i=t.endContainer,a=o.currentNode=r,d="",l=!1;for(o.filter(a)||(a=o.nextNode());a;)a.nodeType===R?(e=a.data,e&&/\S/.test(e)&&(a===i&&(e=e.slice(0,t.endOffset)),a===r&&(e=e.slice(t.startOffset)),d+=e,l=!0)):("BR"===a.nodeName||l&&!s(a))&&(d+="\n",l=!1),a=o.nextNode();return d},Ce.getPath=function(){return this._path};var _e=function(e){for(var t,o,r,i=new n(e,D,function(){return!0},!1);o=i.nextNode();)for(;(r=o.data.indexOf(F))>-1;){if(1===o.length){do t=o.parentNode,t.removeChild(o),o=t;while(s(o)&&!g(o));break}o.deleteData(r,1)}};Ce._didAddZWS=function(){this._hasZWS=!0},Ce._removeZWS=function(){this._hasZWS&&(_e(this._body),this._hasZWS=!1)},Ce._updatePath=function(e,t){var n,o=e.startContainer,r=e.endContainer;(t||o!==this._lastAnchorNode||r!==this._lastFocusNode)&&(this._lastAnchorNode=o,this._lastFocusNode=r,n=o&&r?o===r?p(r):"(selection)":"",this._path!==n&&(this._path=n,this.fireEvent("pathChange",{path:n}))),e.collapsed||this.fireEvent("select")},Ce._updatePathOnEvent=function(){this._updatePath(this.getSelection())},Ce.focus=function(){return V||this._body.focus(),this._win.focus(),this},Ce.blur=function(){return z&&this._body.blur(),top.focus(),this};var ye="squire-selection-start",Te="squire-selection-end";Ce._saveRangeToBookmark=function(e){var t,n=this.createElement("INPUT",{id:ye,type:"hidden"}),o=this.createElement("INPUT",{id:Te,type:"hidden"});ie(e,n),e.collapse(!1),ie(e,o),n.compareDocumentPosition(o)&O&&(n.id=Te,o.id=ye,t=n,n=o,o=t),e.setStartAfter(n),e.setEndBefore(o)},Ce._getRangeAndRemoveBookmark=function(e){var t=this._doc,n=t.getElementById(ye),o=t.getElementById(Te);if(n&&o){var r,i=n.parentNode,a=o.parentNode,s={startContainer:i,endContainer:a,startOffset:J.call(i.childNodes,n),endOffset:J.call(a.childNodes,o)};i===a&&(s.endOffset-=1),m(n),m(o),T(i,s),i!==a&&T(a,s),e||(e=t.createRange()),e.setStart(s.startContainer,s.startOffset),e.setEnd(s.endContainer,s.endOffset),r=e.collapsed,ce(e),r&&e.collapse(!0)}return e||null},Ce._keyUpDetectChange=function(e){var t=e.keyCode;e.ctrlKey||e.metaKey||e.altKey||!(16>t||t>20)||!(33>t||t>45)||this._docWasChanged()},Ce._docWasChanged=function(){return Y&&this._ignoreChange?void(this._ignoreChange=!1):(this._isInUndoState&&(this._isInUndoState=!1,this.fireEvent("undoStateChange",{canUndo:!0,canRedo:!1})),void this.fireEvent("input"))},Ce._recordUndoState=function(e){if(!this._isInUndoState){var t=this._undoIndex+=1,n=this._undoStack;t<this._undoStackLength&&(n.length=this._undoStackLength=t),e&&this._saveRangeToBookmark(e),n[t]=this._getHTML(),this._undoStackLength+=1,this._isInUndoState=!0}},Ce.undo=function(){if(0!==this._undoIndex||!this._isInUndoState){this._recordUndoState(this.getSelection()),this._undoIndex-=1,this._setHTML(this._undoStack[this._undoIndex]);var e=this._getRangeAndRemoveBookmark();e&&this.setSelection(e),this._isInUndoState=!0,this.fireEvent("undoStateChange",{canUndo:0!==this._undoIndex,canRedo:!0}),this.fireEvent("input")}return this},Ce.redo=function(){var e=this._undoIndex,t=this._undoStackLength;if(t>e+1&&this._isInUndoState){this._undoIndex+=1,this._setHTML(this._undoStack[this._undoIndex]);var n=this._getRangeAndRemoveBookmark();n&&this.setSelection(n),this.fireEvent("undoStateChange",{canUndo:!0,canRedo:t>e+2}),this.fireEvent("input")}return this},Ce.hasFormat=function(e,t,o){if(e=e.toUpperCase(),t||(t={}),!o&&!(o=this.getSelection()))return!1;var r,i,a=o.commonAncestorContainer;if(u(a,e,t))return!0;if(a.nodeType===R)return!1;r=new n(a,D,function(e){return le(o,e,!0)},!1);for(var s=!1;i=r.nextNode();){if(!u(i,e,t))return!1;s=!0}return s},Ce._addFormat=function(e,t,o){var r,i,a,s,d,l,c,h;if(o.collapsed)r=S(this.createElement(e,t)),ie(o,r),o.setStart(r.firstChild,r.firstChild.length),o.collapse(!0);else{if(i=new n(o.commonAncestorContainer,D|A,function(e){return(e.nodeType===R||"BR"===e.nodeName)&&le(o,e,!0)},!1),a=o.startContainer,d=o.startOffset,s=o.endContainer,l=o.endOffset,i.currentNode=a,i.filter(a)||(a=i.nextNode(),d=0),!a)return o;do c=i.currentNode,h=!u(c,e,t),h&&(c===s&&c.length>l&&c.splitText(l),c===a&&d&&(c=c.splitText(d),s===a&&(s=c,l-=d),a=c,d=0),r=this.createElement(e,t),v(c,r),r.appendChild(c));while(i.nextNode());s.nodeType!==R&&(c.nodeType===R?(s=c,l=c.length):(s=c.parentNode,l=1)),o=this._createRange(a,d,s,l)}return o},Ce._removeFormat=function(e,t,n,o){this._saveRangeToBookmark(n);var i,a=this._doc;n.collapsed&&($?(i=a.createTextNode(F),this._didAddZWS()):i=a.createTextNode(""),ie(n,i));for(var d=n.commonAncestorContainer;s(d);)d=d.parentNode;var l=n.startContainer,c=n.startOffset,h=n.endContainer,f=n.endOffset,u=[],p=function(e,t){if(!le(n,e,!1)){var o,r,i=e.nodeType===R;if(!le(n,e,!0))return void("INPUT"===e.nodeName||i&&!e.data||u.push([t,e]));if(i)e===h&&f!==e.length&&u.push([t,e.splitText(f)]),e===l&&c&&(e.splitText(c),u.push([t,e]));else for(o=e.firstChild;o;o=r)r=o.nextSibling,p(o,t)}},g=Array.prototype.filter.call(d.getElementsByTagName(e),function(o){return le(n,o,!0)&&r(o,e,t)});o||g.forEach(function(e){p(e,e)}),u.forEach(function(e){var t=e[0].cloneNode(!1),n=e[1];v(n,t),t.appendChild(n)}),g.forEach(function(e){v(e,N(e))}),this._getRangeAndRemoveBookmark(n),i&&n.collapse(!1);var m={startContainer:n.startContainer,startOffset:n.startOffset,endContainer:n.endContainer,endOffset:n.endOffset};return T(d,m),n.setStart(m.startContainer,m.startOffset),n.setEnd(m.endContainer,m.endOffset),n},Ce.changeFormat=function(e,t,n,o){return n||(n=this.getSelection())?(this._recordUndoState(n),this._getRangeAndRemoveBookmark(n),t&&(n=this._removeFormat(t.tag.toUpperCase(),t.attributes||{},n,o)),e&&(n=this._addFormat(e.tag.toUpperCase(),e.attributes||{},n)),this.setSelection(n),this._updatePath(n,!0),Y||this._docWasChanged(),this):void 0};var Ee={DT:"DD",DD:"DT",LI:"LI"},be=function(e,t,n,o){var i=Ee[t.nodeName],a=null,s=y(n,o,t.parentNode);return i||(i=e.options.blockTag,a=e.options.blockProperties),r(s,i,a)||(t=C(s.ownerDocument,i,a),s.dir&&(t.className="rtl"===s.dir?"dir-rtl":"",t.dir=s.dir),v(s,t),t.appendChild(N(s)),s=t),s};Ce.forEachBlock=function(e,t,n){if(!n&&!(n=this.getSelection()))return this;t&&(this._recordUndoState(n),this._getRangeAndRemoveBookmark(n));var o=fe(n),r=ue(n);if(o&&r)do if(e(o)||o===r)break;while(o=f(o));return t&&(this.setSelection(n),this._updatePath(n,!0),Y||this._docWasChanged()),this},Ce.modifyBlocks=function(e,t){if(!t&&!(t=this.getSelection()))return this;this._isInUndoState?this._saveRangeToBookmark(t):this._recordUndoState(t),ve(t);var n,o=this._body;return he(t,o),n=ae(t,o),ie(t,e.call(this,n)),t.endOffset<t.endContainer.childNodes.length&&b(t.endContainer.childNodes[t.endOffset]),b(t.startContainer.childNodes[t.startOffset]),this._getRangeAndRemoveBookmark(t),this.setSelection(t),this._updatePath(t,!0),Y||this._docWasChanged(),this};var ke=function(e){return this.createElement("BLOCKQUOTE",[e])},Be=function(e){var t=e.querySelectorAll("blockquote");return Array.prototype.filter.call(t,function(e){return!u(e.parentNode,"BLOCKQUOTE")}).forEach(function(e){v(e,N(e))}),e},Le=function(){return this.createDefaultBlock([this.createElement("INPUT",{id:ye,type:"hidden"}),this.createElement("INPUT",{id:Te,type:"hidden"})])},Oe=function(e,n,o){for(var r,i,a,s,d=c(n);r=d.nextNode();)i=r.parentNode.nodeName,"LI"!==i?(s=e.createElement("LI",{"class":"rtl"===r.dir?"dir-rtl":t,dir:r.dir||t}),(a=r.previousSibling)&&a.nodeName===o?a.appendChild(s):v(r,e.createElement(o,[s])),s.appendChild(r)):(r=r.parentNode.parentNode,i=r.nodeName,i!==o&&/^[OU]L$/.test(i)&&v(r,e.createElement(o,[N(r)])))},xe=function(e){return Oe(this,e,"UL"),e},Re=function(e){return Oe(this,e,"OL"),e},Ae=function(e){var t,n,o,r,i,a,s,d=e.querySelectorAll("UL, OL");for(t=0,n=d.length;n>t;t+=1){for(r=d[t],i=N(r),a=i.childNodes,o=a.length;o--;)s=a[o],v(s,N(s));_(i),v(r,i)}return e},De=function(e){var t,n,o,r,i,a=e.querySelectorAll("LI");for(t=0,n=a.length;n>t;t+=1)o=a[t],l(o.firstChild)||(r=o.parentNode.nodeName,i=o.previousSibling,i&&(i=i.lastChild)&&i.nodeName===r||v(o,this.createElement("LI",[i=this.createElement(r)])),i.appendChild(o));return e},Ue=function(e){var t=e.querySelectorAll("LI");return Array.prototype.filter.call(t,function(e){return!l(e.firstChild)}).forEach(function(t){var n,o=t.parentNode,r=o.parentNode,i=t.firstChild,a=i;for(t.previousSibling&&(o=y(o,t,r));a&&(n=a.nextSibling,!l(a));)r.insertBefore(a,o),a=n;for("LI"===r.nodeName&&i.previousSibling&&y(r,i,r.parentNode);t!==e&&!t.childNodes.length;)o=t.parentNode,o.removeChild(t),t=o},this),_(e),e},Pe=/\b((?:(?:ht|f)tps?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,}\/)(?:[^\s()<>]+|\([^\s()<>]+\))+(?:\((?:[^\s()<>]+|(?:\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))|([\w\-.%+]+@(?:[\w\-]+\.)+[A-Z]{2,}\b)/i,Ie=function(e){for(var t,o,r,i,a,s,d,l=e.ownerDocument,c=new n(e,D,function(e){return!u(e,"A")},!1);t=c.nextNode();)for(o=t.data,r=t.parentNode;i=Pe.exec(o);)a=i.index,s=a+i[0].length,a&&(d=l.createTextNode(o.slice(0,a)),r.insertBefore(d,t)),d=l.createElement("A"),d.textContent=o.slice(a,s),d.href=i[1]?/^(?:ht|f)tps?:/.test(i[1])?i[1]:"http://"+i[1]:"mailto:"+i[2],r.insertBefore(d,t),t.data=o=o.slice(s)},we=/^(?:A(?:DDRESS|RTICLE|SIDE|UDIO)|BLOCKQUOTE|CAPTION|D(?:[DLT]|IV)|F(?:IGURE|OOTER)|H[1-6]|HEADER|L(?:ABEL|EGEND|I)|O(?:L|UTPUT)|P(?:RE)?|SECTION|T(?:ABLE|BODY|D|FOOT|H|HEAD|R)|UL)$/,Fe={1:10,2:13,3:16,4:18,5:24,6:32,7:48},Me={backgroundColor:{regexp:X,replace:function(e,t){return C(e,"SPAN",{"class":"highlight",style:"background-color: "+t})}},color:{regexp:X,replace:function(e,t){return C(e,"SPAN",{"class":"colour",style:"color:"+t})}},fontWeight:{regexp:/^bold/i,replace:function(e){return C(e,"B")}},fontStyle:{regexp:/^italic/i,replace:function(e){return C(e,"I")}},fontFamily:{regexp:X,replace:function(e,t){return C(e,"SPAN",{"class":"font",style:"font-family:"+t})}},fontSize:{regexp:X,replace:function(e,t){return C(e,"SPAN",{"class":"size",style:"font-size:"+t})}}},We=function(e){return function(t,n){var o=C(t.ownerDocument,e);return n.replaceChild(o,t),o.appendChild(N(t)),o}},He={SPAN:function(e,t){var n,o,r,i,a,s,d=e.style,l=e.ownerDocument;for(n in Me)o=Me[n],r=d[n],r&&o.regexp.test(r)&&(s=o.replace(l,r),i&&i.appendChild(s),i=s,a||(a=s));return a&&(i.appendChild(N(e)),t.replaceChild(a,e)),i||e},STRONG:We("B"),EM:We("I"),STRIKE:We("S"),FONT:function(e,t){var n,o,r,i,a,s=e.face,d=e.size,l=e.color,c=e.ownerDocument;return s&&(n=C(c,"SPAN",{"class":"font",style:"font-family:"+s}),a=n,i=n),d&&(o=C(c,"SPAN",{"class":"size",style:"font-size:"+Fe[d]+"px"}),a||(a=o),i&&i.appendChild(o),i=o),l&&/^#?([\dA-F]{3}){1,2}$/i.test(l)&&("#"!==l.charAt(0)&&(l="#"+l),r=C(c,"SPAN",{"class":"colour",style:"color:"+l}),a||(a=r),i&&i.appendChild(r),i=r),a||(a=i=C(c,"SPAN")),t.replaceChild(a,e),i.appendChild(N(e)),i},TT:function(e,t){var n=C(e.ownerDocument,"SPAN",{"class":"font",style:'font-family:menlo,consolas,"courier new",monospace'});return t.replaceChild(n,e),n.appendChild(N(e)),n}},Ke=function(e){for(var t,n=e.childNodes,o=n.length;o--;)t=n[o],t.nodeType!==x||a(t)?t.nodeType!==R||t.data||e.removeChild(t):(Ke(t),s(t)&&!t.firstChild&&e.removeChild(t))},ze=function(e,t){var n,o,r,i,a,d,l,c,h,f,u=e.childNodes;for(n=0,o=u.length;o>n;n+=1)if(r=u[n],i=r.nodeName,a=r.nodeType,d=He[i],a===x){if(l=r.childNodes.length,d)r=d(r,e);else{if(!we.test(i)&&!s(r)){n-=1,o+=l-1,e.replaceChild(N(r),r);continue}!t&&r.style.cssText&&r.removeAttribute("style")}l&&ze(r,t)}else{if(a===R){if(c=r.data,/\S/.test(c)){if(s(e))continue;if(h=0,f=c.length,!n||!s(u[n-1])){for(;f>h&&!X.test(c.charAt(h));)h+=1;h&&(r.data=c=c.slice(h),f-=h)}if(n+1===o||!s(u[n+1])){for(h=f;h>0&&!X.test(c.charAt(h-1));)h-=1;f>h&&(r.data=c.slice(0,h))}continue}if(n&&o>n+1&&s(u[n-1])&&s(u[n+1])){r.data=" ";continue}}e.removeChild(r),n-=1,o-=1}return e},Ze=function(e){return e.nodeType===x?"BR"===e.nodeName:X.test(e.data)},Ve=function(e){for(var t,o=e.parentNode;s(o);)o=o.parentNode;return t=new n(o,A|D,Ze),t.currentNode=e,!!t.nextNode()},qe=function(e){var t,n,o,r=e.querySelectorAll("BR"),i=[],a=r.length;for(t=0;a>t;t+=1)i[t]=Ve(r[t]);for(;a--;)if(n=r[a],o=n.parentNode){for(;s(o);)o=o.parentNode;if(d(o)){if(i[a]){if(o.nodeName!==this.options.blockTag)continue;y(n.parentNode,n,o.parentNode)}m(n)}else _(o)}};Ce._ensureBottomLine=function(){var e=this._body,t=e.lastElementChild;t&&t.nodeName===this.options.blockTag&&d(t)||e.appendChild(this.createDefaultBlock())},Ce._onCut=function(){var e=this.getSelection(),t=this;this._recordUndoState(e),this._getRangeAndRemoveBookmark(e),this.setSelection(e),setTimeout(function(){try{t._ensureBottomLine()}catch(e){t.didError(e)}},0)},Ce._onPaste=function(e){if(!this._awaitingPaste){var t,n,o=e.clipboardData,r=o&&o.items,i=!1,a=!1;if(r){for(t=r.length;t--;){if(n=r[t].type,"text/html"===n){a=!1;break}/^image\/.*/.test(n)&&(a=!0)}if(a)return e.preventDefault(),this.fireEvent("dragover",{dataTransfer:o,preventDefault:function(){i=!0}}),void(i&&this.fireEvent("drop",{dataTransfer:o}))}this._awaitingPaste=!0;var s,d,l,c,h,u=this,p=this._body,g=this.getSelection();u._recordUndoState(g),u._getRangeAndRemoveBookmark(g),s=g.startContainer,d=g.startOffset,l=g.endContainer,c=g.endOffset,h=fe(g);var v=this.createElement("DIV",{style:"position: absolute; overflow: hidden; top:"+(p.scrollTop+(h?h.getBoundingClientRect().top:0))+"px; left: 0; width: 1px; height: 1px;"});p.appendChild(v),g.selectNodeContents(v),this.setSelection(g),setTimeout(function(){try{var e=N(m(v)),t=e.firstChild,n=u._createRange(s,d,l,c);if(t){t===e.lastChild&&"DIV"===t.nodeName&&e.replaceChild(N(t),t),e.normalize(),Ie(e),ze(e,!1),qe(e),Ke(e);for(var o=e,r=!0;o=f(o);)S(o);u.fireEvent("willPaste",{fragment:e,preventDefault:function(){r=!1}}),r&&(de(n,e),Y||u._docWasChanged(),n.collapse(!1),u._ensureBottomLine())}u.setSelection(n),u._updatePath(n,!0),u._awaitingPaste=!1}catch(i){u.didError(i)}},0)}};var Qe={8:"backspace",9:"tab",13:"enter",32:"space",37:"left",39:"right",46:"delete",219:"[",221:"]"},Ge=function(e){return function(t,n){n.preventDefault(),t[e]()}},$e=function(e,t){return t=t||null,function(n,o){o.preventDefault();var r=n.getSelection();n.hasFormat(e,null,r)?n.changeFormat(null,{tag:e},r):n.changeFormat({tag:e},t,r)}},je=function(e,t){try{t||(t=e.getSelection());var n,o=t.startContainer;for(o.nodeType===R&&(o=o.parentNode),n=o;s(n)&&(!n.textContent||n.textContent===F);)o=n,n=o.parentNode;o!==n&&(t.setStart(n,J.call(n.childNodes,o)),t.collapse(!0),n.removeChild(o),d(n)||(n=h(n)),S(n),ce(t)),e._ensureBottomLine(),e.setSelection(t),e._updatePath(t,!0)}catch(r){e.didError(r)}},Ye={enter:function(e,t,n){var o,r,i;if(t.preventDefault(),e._recordUndoState(n),Ie(n.startContainer),e._removeZWS(),e._getRangeAndRemoveBookmark(n),n.collapsed||se(n),o=fe(n),!o||/^T[HD]$/.test(o.nodeName))return ie(n,e.createElement("BR")),n.collapse(!1),e.setSelection(n),void e._updatePath(n,!0);if((r=u(o,"LI"))&&(o=r),!o.textContent){if(u(o,"UL")||u(o,"OL"))return e.modifyBlocks(Ue,n);if(u(o,"BLOCKQUOTE"))return e.modifyBlocks(Le,n)}for(i=be(e,o,n.startContainer,n.startOffset),_e(o),Ke(o),S(o);i.nodeType===x;){var a,s=i.firstChild;if("A"===i.nodeName&&(!i.textContent||i.textContent===F)){s=e._doc.createTextNode(""),v(i,s),i=s;break}for(;s&&s.nodeType===R&&!s.data&&(a=s.nextSibling,a&&"BR"!==a.nodeName);)m(s),s=a;if(!s||"BR"===s.nodeName||s.nodeType===R&&!V)break;i=s}n=e._createRange(i,0),e.setSelection(n),e._updatePath(n,!0),i.nodeType===R&&(i=i.parentNode);var d=e._doc,l=e._body;i.offsetTop+i.offsetHeight>(d.documentElement.scrollTop||l.scrollTop)+l.offsetHeight&&i.scrollIntoView(!1)},backspace:function(e,t,n){if(e._removeZWS(),e._recordUndoState(n),e._getRangeAndRemoveBookmark(n),n.collapsed)if(ge(n)){t.preventDefault();var o=fe(n),r=o&&h(o);if(r){if(!r.isContentEditable)return void m(r);for(E(r,o,n),o=r.parentNode;o&&!o.nextSibling;)o=o.parentNode;o&&(o=o.nextSibling)&&b(o),e.setSelection(n)}else if(o){if(u(o,"UL")||u(o,"OL"))return e.modifyBlocks(Ue,n);if(u(o,"BLOCKQUOTE"))return e.modifyBlocks(Be,n);e.setSelection(n),e._updatePath(n,!0)}}else e.setSelection(n),setTimeout(function(){je(e)},0);else t.preventDefault(),se(n),je(e,n)},"delete":function(e,t,n){if(e._removeZWS(),e._recordUndoState(n),e._getRangeAndRemoveBookmark(n),n.collapsed)if(me(n)){t.preventDefault();var o=fe(n),r=o&&f(o);if(r){if(!r.isContentEditable)return void m(r);for(E(o,r,n),r=o.parentNode;r&&!r.nextSibling;)r=r.parentNode;r&&(r=r.nextSibling)&&b(r),e.setSelection(n),e._updatePath(n,!0)}}else e.setSelection(n),setTimeout(function(){je(e)},0);else t.preventDefault(),se(n),je(e,n)},tab:function(e,t,n){var o,r;if(e._removeZWS(),n.collapsed&&ge(n)&&me(n)){for(o=fe(n);r=o.parentNode;){if("UL"===r.nodeName||"OL"===r.nodeName){o.previousSibling&&(t.preventDefault(),e.modifyBlocks(De,n));break}o=r}t.preventDefault()}},space:function(e,t,n){var o,r;e._recordUndoState(n),Ie(n.startContainer),e._getRangeAndRemoveBookmark(n),o=n.endContainer,r=o.parentNode,n.collapsed&&"A"===r.nodeName&&!o.nextSibling&&n.endOffset===g(o)&&n.setStartAfter(r),e.setSelection(n)},left:function(e){e._removeZWS()},right:function(e){e._removeZWS()}};K&&z&&M.getSelection().modify&&(Ye["meta-left"]=function(e,t){t.preventDefault(),e._sel.modify("move","backward","lineboundary")},Ye["meta-right"]=function(e,t){t.preventDefault(),e._sel.modify("move","forward","lineboundary")}),Ye[Q+"b"]=$e("B"),Ye[Q+"i"]=$e("I"),Ye[Q+"u"]=$e("U"),Ye[Q+"shift-7"]=$e("S"),Ye[Q+"shift-5"]=$e("SUB",{tag:"SUP"}),Ye[Q+"shift-6"]=$e("SUP",{tag:"SUB"}),Ye[Q+"shift-8"]=Ge("makeUnorderedList"),Ye[Q+"shift-9"]=Ge("makeOrderedList"),Ye[Q+"["]=Ge("decreaseQuoteLevel"),Ye[Q+"]"]=Ge("increaseQuoteLevel"),Ye[Q+"y"]=Ge("redo"),Ye[Q+"z"]=Ge("undo"),Ye[Q+"shift-z"]=Ge("redo"),Ce._onKey=function(e){var t=e.keyCode,n=Qe[t],o="",r=this.getSelection();n||(n=String.fromCharCode(t).toLowerCase(),/^[A-Za-z0-9]$/.test(n)||(n="")),V&&46===e.which&&(n="."),t>111&&124>t&&(n="f"+(t-111)),"backspace"!==n&&"delete"!==n&&(e.altKey&&(o+="alt-"),e.ctrlKey&&(o+="ctrl-"),e.metaKey&&(o+="meta-")),e.shiftKey&&(o+="shift-"),n=o+n,Ye[n]?Ye[n](this,e,r):1!==n.length||r.collapsed||(this._recordUndoState(r),this._getRangeAndRemoveBookmark(r),se(r),this._ensureBottomLine(),this.setSelection(r),this._updatePath(r,!0))},Ce._getHTML=function(){return this._body.innerHTML},Ce._setHTML=function(e){var t=this._body;t.innerHTML=e;do S(t);while(t=f(t));this._ignoreChange=!0},Ce.getHTML=function(e){var t,n,o,r,i,a=[];if(e&&(i=this.getSelection())&&this._saveRangeToBookmark(i),G)for(t=this._body;t=f(t);)t.textContent||t.querySelector("BR")||(n=this.createElement("BR"),t.appendChild(n),a.push(n));if(o=this._getHTML().replace(/\u200B/g,""),
G)for(r=a.length;r--;)m(a[r]);return i&&this._getRangeAndRemoveBookmark(i),o},Ce.setHTML=function(e){var t,n=this._doc.createDocumentFragment(),o=this.createElement(this.options.blockTag,this.options.blockProperties);o.innerHTML=e,n.appendChild(N(o)),ze(n,!0),qe(n),_(n);for(var r=n;r=f(r);)S(r);this._ignoreChange=!0;for(var i=this._body;t=i.lastChild;)i.removeChild(t);i.appendChild(n),S(i),this._undoIndex=-1,this._undoStack.length=0,this._undoStackLength=0,this._isInUndoState=!1;var a=this._getRangeAndRemoveBookmark()||this._createRange(i.firstChild,0);return this._recordUndoState(a),this._getRangeAndRemoveBookmark(a),j?this._lastSelection=a:this.setSelection(a),this._updatePath(a,!0),this},Ce.insertElement=function(e,t){if(t||(t=this.getSelection()),t.collapse(!0),s(e))ie(t,e),t.setStartAfter(e);else{for(var n,o,r=this._body,i=fe(t)||r;i!==r&&!i.nextSibling;)i=i.parentNode;i!==r&&(n=i.parentNode,o=y(n,i.nextSibling,r)),o?(r.insertBefore(e,o),t.setStart(o,0),t.setStart(o,0),ce(t)):(r.appendChild(e),r.appendChild(this.createDefaultBlock()),t.setStart(e,0),t.setEnd(e,0)),this.focus(),this.setSelection(t),this._updatePath(t)}return this},Ce.insertImage=function(e){var t=this.createElement("IMG",{src:e});return this.insertElement(t),t},Ce.insertHTML=function(e){var t=this.getSelection(),n=this._doc.createDocumentFragment(),o=this.createElement("DIV");o.innerHTML=e,n.appendChild(N(o)),this._recordUndoState(t),this._getRangeAndRemoveBookmark(t);try{n.normalize(),Ie(n),ze(n,!0),qe(n),Ke(n),_(n);for(var r=n;r=f(r);)S(r);de(t,n),Y||this._docWasChanged(),t.collapse(!1),this._ensureBottomLine(),this.setSelection(t),this._updatePath(t,!0)}catch(i){this.didError(i)}return this};var Xe=function(e,t,n){return function(){return this[e](t,n),this.focus()}};Ce.addStyles=function(e){if(e){var t=this._doc.documentElement.firstChild,n=this.createElement("STYLE",{type:"text/css"});n.styleSheet?(t.appendChild(n),n.styleSheet.cssText=e):(n.appendChild(this._doc.createTextNode(e)),t.appendChild(n))}return this},Ce.bold=Xe("changeFormat",{tag:"B"}),Ce.italic=Xe("changeFormat",{tag:"I"}),Ce.underline=Xe("changeFormat",{tag:"U"}),Ce.strikethrough=Xe("changeFormat",{tag:"S"}),Ce.subscript=Xe("changeFormat",{tag:"SUB"},{tag:"SUP"}),Ce.superscript=Xe("changeFormat",{tag:"SUP"},{tag:"SUB"}),Ce.removeBold=Xe("changeFormat",null,{tag:"B"}),Ce.removeItalic=Xe("changeFormat",null,{tag:"I"}),Ce.removeUnderline=Xe("changeFormat",null,{tag:"U"}),Ce.removeStrikethrough=Xe("changeFormat",null,{tag:"S"}),Ce.removeSubscript=Xe("changeFormat",null,{tag:"SUB"}),Ce.removeSuperscript=Xe("changeFormat",null,{tag:"SUP"}),Ce.makeLink=function(e,t){var n=this.getSelection();if(n.collapsed){var o=e.indexOf(":")+1;if(o)for(;"/"===e[o];)o+=1;ie(n,this._doc.createTextNode(e.slice(o)))}return t||(t={}),t.href=e,this.changeFormat({tag:"A",attributes:t},{tag:"A"},n),this.focus()},Ce.removeLink=function(){return this.changeFormat(null,{tag:"A"},this.getSelection(),!0),this.focus()},Ce.setFontFace=function(e){return this.changeFormat({tag:"SPAN",attributes:{"class":"font",style:"font-family: "+e+", sans-serif;"}},{tag:"SPAN",attributes:{"class":"font"}}),this.focus()},Ce.setFontSize=function(e){return this.changeFormat({tag:"SPAN",attributes:{"class":"size",style:"font-size: "+("number"==typeof e?e+"px":e)}},{tag:"SPAN",attributes:{"class":"size"}}),this.focus()},Ce.setTextColour=function(e){return this.changeFormat({tag:"SPAN",attributes:{"class":"colour",style:"color: "+e}},{tag:"SPAN",attributes:{"class":"colour"}}),this.focus()},Ce.setHighlightColour=function(e){return this.changeFormat({tag:"SPAN",attributes:{"class":"highlight",style:"background-color: "+e}},{tag:"SPAN",attributes:{"class":"highlight"}}),this.focus()},Ce.setTextAlignment=function(e){return this.forEachBlock(function(t){t.className=(t.className.split(/\s+/).filter(function(e){return!/align/.test(e)}).join(" ")+" align-"+e).trim(),t.style.textAlign=e},!0),this.focus()},Ce.setTextDirection=function(e){return this.forEachBlock(function(t){t.className=(t.className.split(/\s+/).filter(function(e){return!/dir/.test(e)}).join(" ")+" dir-"+e).trim(),t.dir=e},!0),this.focus()},Ce.increaseQuoteLevel=Xe("modifyBlocks",ke),Ce.decreaseQuoteLevel=Xe("modifyBlocks",Be),Ce.makeUnorderedList=Xe("modifyBlocks",xe),Ce.makeOrderedList=Xe("modifyBlocks",Re),Ce.removeList=Xe("modifyBlocks",Ae),Ce.increaseListLevel=Xe("modifyBlocks",De),Ce.decreaseListLevel=Xe("modifyBlocks",Ue),top!==M?(M.editor=new L(e),M.onEditorLoad&&(M.onEditorLoad(M.editor),M.onEditorLoad=null)):(M.Squire=L,M.instances=Ne)}(document);