!function(e,t){"use strict";function n(e,t,n){this.root=this.currentNode=e,this.nodeType=t,this.filter=n}function o(e,t){for(var n=e.length;n--;)if(!t(e[n]))return!1;return!0}function r(e,t,n){if(e.nodeName!==t)return!1;for(var o in n)if(e.getAttribute(o)!==n[o])return!1;return!0}function i(e,t){return e.nodeType===t.nodeType&&e.nodeName===t.nodeName&&e.className===t.className&&(!e.style&&!t.style||e.style.cssText===t.style.cssText)}function a(e){return e.nodeType===L&&!!ne[e.nodeName]}function s(e){return te.test(e.nodeName)}function d(e){return e.nodeType===L&&!s(e)&&o(e.childNodes,s)}function l(e){return e.nodeType===L&&!s(e)&&!d(e)}function c(e){var t=e.ownerDocument,o=new n(t.body,R,d,!1);return o.currentNode=e,o}function f(e){return c(e).previousNode()}function h(e){return c(e).nextNode()}function u(e,t,n){do if(r(e,t,n))return e;while(e=e.parentNode);return null}function p(e){var t,n,o,r,i,a=e.parentNode;return a&&e.nodeType===L?(t=p(a),t+=(t?">":"")+e.nodeName,(n=e.id)&&(t+="#"+n),(o=e.className.trim())&&(r=o.split(/\s\s*/),r.sort(),t+=".",t+=r.join(".")),(i=e.dir)&&(t+="[dir="+i+"]")):t=a?p(a):"",t}function g(e){var t=e.nodeType;return t===L?e.childNodes.length:e.length||0}function m(e){var t=e.parentNode;return t&&t.removeChild(e),e}function v(e,t){var n=e.parentNode;n&&n.replaceChild(t,e)}function N(e){for(var t=e.ownerDocument.createDocumentFragment(),n=e.childNodes,o=n?n.length:0;o--;)t.appendChild(e.firstChild);return t}function C(e,n,o,r){var i,a,s,d,l=e.createElement(n);if(o instanceof Array&&(r=o,o=null),o)for(i in o)a=o[i],a!==t&&l.setAttribute(i,o[i]);if(r)for(s=0,d=r.length;d>s;s+=1)l.appendChild(r[s]);return l}function _(e){var t,n,o=e.ownerDocument,r=e;if("BODY"===e.nodeName&&((n=e.firstChild)&&"BR"!==n.nodeName||(t=k(o).createDefaultBlock(),n?e.replaceChild(t,n):e.appendChild(t),e=t,t=null)),s(e)){for(n=e.firstChild;$&&n&&n.nodeType===x&&!n.data;)e.removeChild(n),n=e.firstChild;n||($?(t=o.createTextNode(F),k(o)._didAddZWS()):t=o.createTextNode(""))}else if(G){for(;e.nodeType!==x&&!a(e);){if(n=e.firstChild,!n){t=o.createTextNode("");break}e=n}e.nodeType===x?/^ +$/.test(e.data)&&(e.data=""):a(e)&&e.parentNode.insertBefore(o.createTextNode(""),e)}else if(!e.querySelector("BR"))for(t=C(o,"BR");(n=e.lastElementChild)&&!s(n);)e=n;return t&&e.appendChild(t),r}function S(e){var t,n,o,r,i=e.childNodes,a=e.ownerDocument,d=null,c=k(a)._config;for(t=0,n=i.length;n>t;t+=1)o=i[t],r="BR"===o.nodeName,!r&&s(o)?(d||(d=C(a,c.blockTag,c.blockAttributes)),d.appendChild(o),t-=1,n-=1):(r||d)&&(d||(d=C(a,c.blockTag,c.blockAttributes)),_(d),r?e.replaceChild(d,o):(e.insertBefore(d,o),t+=1,n+=1),d=null),l(o)&&S(o);return d&&e.appendChild(_(d)),e}function y(e,t,n){var o,r,i,a=e.nodeType;if(a===x&&e!==n)return y(e.parentNode,e.splitText(t),n);if(a===L){if("number"==typeof t&&(t=t<e.childNodes.length?e.childNodes[t]:null),e===n)return t;for(o=e.parentNode,r=e.cloneNode(!1);t;)i=t.nextSibling,r.appendChild(t),t=i;return"OL"===e.nodeName&&u(e,"BLOCKQUOTE")&&(r.start=(+e.start||1)+e.childNodes.length-1),_(e),_(r),(i=e.nextSibling)?o.insertBefore(r,i):o.appendChild(r),y(o,r,n)}return t}function T(e,t){if(e.nodeType===L)for(var n,o,r,a=e.childNodes,d=a.length,l=[];d--;)if(n=a[d],o=d&&a[d-1],d&&s(n)&&i(n,o)&&!ne[n.nodeName])t.startContainer===n&&(t.startContainer=o,t.startOffset+=g(o)),t.endContainer===n&&(t.endContainer=o,t.endOffset+=g(o)),t.startContainer===e&&(t.startOffset>d?t.startOffset-=1:t.startOffset===d&&(t.startContainer=o,t.startOffset=g(o))),t.endContainer===e&&(t.endOffset>d?t.endOffset-=1:t.endOffset===d&&(t.endContainer=o,t.endOffset=g(o))),m(n),n.nodeType===x?o.appendData(n.data):l.push(N(n));else if(n.nodeType===L){for(r=l.length;r--;)n.appendChild(l.pop());T(n,t)}}function b(e,t,n){for(var o,r,i,a=t;1===a.parentNode.childNodes.length;)a=a.parentNode;m(a),r=e.childNodes.length,o=e.lastChild,o&&"BR"===o.nodeName&&(e.removeChild(o),r-=1),i={startContainer:e,startOffset:r,endContainer:e,endOffset:r},e.appendChild(N(t)),T(e,i),n.setStart(i.startContainer,i.startOffset),n.collapse(!0),q&&(o=e.lastChild)&&"BR"===o.nodeName&&e.removeChild(o)}function E(e){var t,n,o=e.previousSibling,r=e.firstChild,a=e.ownerDocument,s="LI"===e.nodeName;if(!s||r&&/^[OU]L$/.test(r.nodeName))if(o&&i(o,e)){if(!l(o)){if(!s)return;n=C(a,"DIV"),n.appendChild(N(o)),o.appendChild(n)}m(e),t=!l(e),o.appendChild(N(e)),t&&S(o),r&&E(r)}else s&&(o=C(a,"DIV"),e.insertBefore(o,r),_(o))}function k(e){for(var t,n=ye.length;n--;)if(t=ye[n],t._doc===e)return t;return null}function B(e,t){var n,o;e||(e={});for(n in t)o=t[n],e[n]=o&&o.constructor===Object?B(e[n],o):o;return e}function O(e,t){var n,o=e.defaultView,r=e.body;this._win=o,this._doc=e,this._body=r,this._events={},this._sel=o.getSelection(),this._lastSelection=null,j&&this.addEventListener("beforedeactivate",this.getSelection),this._hasZWS=!1,this._lastAnchorNode=null,this._lastFocusNode=null,this._path="",this.addEventListener("keyup",this._updatePathOnEvent),this.addEventListener("mouseup",this._updatePathOnEvent),o.addEventListener("focus",this,!1),o.addEventListener("blur",this,!1),this._undoIndex=-1,this._undoStack=[],this._undoStackLength=0,this._isInUndoState=!1,this._ignoreChange=!1,Y?(n=new MutationObserver(this._docWasChanged.bind(this)),n.observe(r,{childList:!0,attributes:!0,characterData:!0,subtree:!0}),this._mutation=n):this.addEventListener("keyup",this._keyUpDetectChange),this._awaitingPaste=!1,this.addEventListener(Z?"beforecut":"cut",this._onCut),this.addEventListener(Z?"beforepaste":"paste",this._onPaste),this.addEventListener(q?"keypress":"keydown",this._onKey),this._keyHandlers=Object.create(Se),this.setConfig(t),Z&&(o.Text.prototype.splitText=function(e){var t=this.ownerDocument.createTextNode(this.data.slice(e)),n=this.nextSibling,o=this.parentNode,r=this.length-e;return n?o.insertBefore(t,n):o.appendChild(t),r&&this.deleteData(e,r),t}),r.setAttribute("contenteditable","true");try{e.execCommand("enableObjectResizing",!1,"false"),e.execCommand("enableInlineTableEditing",!1,"false")}catch(i){}ye.push(this),this.setHTML("")}var A=2,L=1,x=3,R=1,D=4,U=0,I=1,P=2,w=3,F="​",H=e.defaultView,M=navigator.userAgent,W=/iP(?:ad|hone|od)/.test(M),K=/Mac OS X/.test(M),z=/Gecko\//.test(M),Z=/Trident\/[456]\./.test(M),q=!!H.opera,V=/WebKit\//.test(M),Q=K?"meta-":"ctrl-",G=Z||q,$=Z||V,j=Z,Y="undefined"!=typeof MutationObserver,X=/[^ \t\r\n]/,J=Array.prototype.indexOf;Object.create||(Object.create=function(e){var t=function(){};return t.prototype=e,new t});var ee={1:1,2:2,3:4,8:128,9:256,11:1024};n.prototype.nextNode=function(){for(var e,t=this.currentNode,n=this.root,o=this.nodeType,r=this.filter;;){for(e=t.firstChild;!e&&t&&t!==n;)e=t.nextSibling,e||(t=t.parentNode);if(!e)return null;if(ee[e.nodeType]&o&&r(e))return this.currentNode=e,e;t=e}},n.prototype.previousNode=function(){for(var e,t=this.currentNode,n=this.root,o=this.nodeType,r=this.filter;;){if(t===n)return null;if(e=t.previousSibling)for(;t=e.lastChild;)e=t;else e=t.parentNode;if(!e)return null;if(ee[e.nodeType]&o&&r(e))return this.currentNode=e,e;t=e}};var te=/^(?:#text|A(?:BBR|CRONYM)?|B(?:R|D[IO])?|C(?:ITE|ODE)|D(?:ATA|FN|EL)|EM|FONT|HR|I(?:NPUT|MG|NS)?|KBD|Q|R(?:P|T|UBY)|S(?:U[BP]|PAN|TR(?:IKE|ONG)|MALL|AMP)?|U|VAR|WBR)$/,ne={BR:1,IMG:1,INPUT:1},oe=function(e,t){for(var n=e.childNodes;t&&e.nodeType===L;)e=n[t-1],n=e.childNodes,t=n.length;return e},re=function(e,t){if(e.nodeType===L){var n=e.childNodes;if(t<n.length)e=n[t];else{for(;e&&!e.nextSibling;)e=e.parentNode;e&&(e=e.nextSibling)}}return e},ie=function(e,t){var n,o,r,i,a=e.startContainer,s=e.startOffset,d=e.endContainer,l=e.endOffset;a.nodeType===x?(n=a.parentNode,o=n.childNodes,s===a.length?(s=J.call(o,a)+1,e.collapsed&&(d=n,l=s)):(s&&(i=a.splitText(s),d===a?(l-=s,d=i):d===n&&(l+=1),a=i),s=J.call(o,a)),a=n):o=a.childNodes,r=o.length,s===r?a.appendChild(t):a.insertBefore(t,o[s]),a===d&&(l+=o.length-r),e.setStart(a,s),e.setEnd(d,l)},ae=function(e,t){var n=e.startContainer,o=e.startOffset,r=e.endContainer,i=e.endOffset;t||(t=e.commonAncestorContainer),t.nodeType===x&&(t=t.parentNode);for(var a,s,d,l=y(r,i,t),c=y(n,o,t),f=t.ownerDocument.createDocumentFragment();c!==l;)a=c.nextSibling,f.appendChild(c),c=a;return n=t,o=l?J.call(t.childNodes,l):t.childNodes.length,d=t.childNodes[o],s=d&&d.previousSibling,s&&s.nodeType===x&&d.nodeType===x&&(n=s,o=s.length,s.appendData(d.data),m(d)),e.setStart(n,o),e.collapse(!0),_(t),f},se=function(e){fe(e),ae(e),ce(e);var t=he(e),n=ue(e);t&&n&&t!==n&&b(t,n,e),t&&_(t);var o=e.endContainer.ownerDocument.body,r=o.firstChild;r&&"BR"!==r.nodeName||(_(o),e.selectNodeContents(o.firstChild))},de=function(e,t){for(var n=!0,o=t.childNodes,r=o.length;r--;)if(!s(o[r])){n=!1;break}if(e.collapsed||se(e),ce(e),n)ie(e,t),e.collapse(!1);else{for(var i,a,d=e.startContainer,l=y(d,e.startOffset,u(d.parentNode,"BLOCKQUOTE")||d.ownerDocument.body),c=l.previousSibling,f=c,p=f.childNodes.length,m=l,v=0,N=l.parentNode;(i=f.lastChild)&&i.nodeType===L&&"BR"!==i.nodeName;)f=i,p=f.childNodes.length;for(;(i=m.firstChild)&&i.nodeType===L&&"BR"!==i.nodeName;)m=i;for(;(i=t.firstChild)&&s(i);)f.appendChild(i);for(;(i=t.lastChild)&&s(i);)m.insertBefore(i,m.firstChild),v+=1;for(a=t;a=h(a);)_(a);N.insertBefore(t,l),a=l.previousSibling,l.textContent?E(l):N.removeChild(l),l.parentNode||(m=a,v=g(m)),c.textContent?E(c):(f=c.nextSibling,p=0,N.removeChild(c)),e.setStart(f,p),e.setEnd(m,v),ce(e)}},le=function(e,t,n){var o=t.ownerDocument.createRange();if(o.selectNode(t),n){var r=e.compareBoundaryPoints(w,o)>-1,i=e.compareBoundaryPoints(I,o)<1;return!r&&!i}var a=e.compareBoundaryPoints(U,o)<1,s=e.compareBoundaryPoints(P,o)>-1;return a&&s},ce=function(e){for(var t,n=e.startContainer,o=e.startOffset,r=e.endContainer,i=e.endOffset;n.nodeType!==x&&(t=n.childNodes[o],t&&!a(t));)n=t,o=0;if(i)for(;r.nodeType!==x&&(t=r.childNodes[i-1],t&&!a(t));)r=t,i=g(r);else for(;r.nodeType!==x&&(t=r.firstChild,t&&!a(t));)r=t;e.collapsed?(e.setStart(r,i),e.setEnd(n,o)):(e.setStart(n,o),e.setEnd(r,i))},fe=function(e,t){var n,o=e.startContainer,r=e.startOffset,i=e.endContainer,a=e.endOffset;for(t||(t=e.commonAncestorContainer);o!==t&&!r;)n=o.parentNode,r=J.call(n.childNodes,o),o=n;for(;i!==t&&a===g(i);)n=i.parentNode,a=J.call(n.childNodes,i)+1,i=n;e.setStart(o,r),e.setEnd(i,a)},he=function(e){var t,n=e.startContainer;return s(n)?t=f(n):d(n)?t=n:(t=oe(n,e.startOffset),t=h(t)),t&&le(e,t,!0)?t:null},ue=function(e){var t,n,o=e.endContainer;if(s(o))t=f(o);else if(d(o))t=o;else{if(t=re(o,e.endOffset),!t)for(t=o.ownerDocument.body;n=t.lastChild;)t=n;t=f(t)}return t&&le(e,t,!0)?t:null},pe=new n(null,D|R,function(e){return e.nodeType===x?X.test(e.data):"IMG"===e.nodeName}),ge=function(e){var t=e.startContainer,n=e.startOffset;if(t.nodeType===x){if(n)return!1;pe.currentNode=t}else pe.currentNode=re(t,n);return pe.root=he(e),!pe.previousNode()},me=function(e){var t,n=e.endContainer,o=e.endOffset;if(n.nodeType===x){if(t=n.data.length,t&&t>o)return!1;pe.currentNode=n}else pe.currentNode=oe(n,o);return pe.root=ue(e),!pe.nextNode()},ve=function(e){var t,n=he(e),o=ue(e);n&&o&&(t=n.parentNode,e.setStart(t,J.call(t.childNodes,n)),t=o.parentNode,e.setEnd(t,J.call(t.childNodes,o)+1))},Ne=function(e){return function(t,n){n.preventDefault(),t[e]()}},Ce=function(e,t){return t=t||null,function(n,o){o.preventDefault();var r=n.getSelection();n.hasFormat(e,null,r)?n.changeFormat(null,{tag:e},r):n.changeFormat({tag:e},t,r)}},_e=function(e,t){try{t||(t=e.getSelection());var n,o=t.startContainer;for(o.nodeType===x&&(o=o.parentNode),n=o;s(n)&&(!n.textContent||n.textContent===F);)o=n,n=o.parentNode;o!==n&&(t.setStart(n,J.call(n.childNodes,o)),t.collapse(!0),n.removeChild(o),d(n)||(n=f(n)),_(n),ce(t)),e._ensureBottomLine(),e.setSelection(t),e._updatePath(t,!0)}catch(r){e.didError(r)}},Se={enter:function(e,t,n){var o,r,i;if(t.preventDefault(),e._recordUndoState(n),Me(n.startContainer),e._removeZWS(),e._getRangeAndRemoveBookmark(n),n.collapsed||se(n),o=he(n),!o||/^T[HD]$/.test(o.nodeName))return ie(n,e.createElement("BR")),n.collapse(!1),e.setSelection(n),void e._updatePath(n,!0);if((r=u(o,"LI"))&&(o=r),!o.textContent){if(u(o,"UL")||u(o,"OL"))return e.modifyBlocks(Fe,n);if(u(o,"BLOCKQUOTE"))return e.modifyBlocks(Re,n)}for(i=Ae(e,o,n.startContainer,n.startOffset),Ee(o),Ve(o),_(o);i.nodeType===L;){var a,s=i.firstChild;if("A"===i.nodeName&&(!i.textContent||i.textContent===F)){s=e._doc.createTextNode(""),v(i,s),i=s;break}for(;s&&s.nodeType===x&&!s.data&&(a=s.nextSibling,a&&"BR"!==a.nodeName);)m(s),s=a;if(!s||"BR"===s.nodeName||s.nodeType===x&&!q)break;i=s}n=e._createRange(i,0),e.setSelection(n),e._updatePath(n,!0),i.nodeType===x&&(i=i.parentNode);var d=e._doc,l=e._body;i.offsetTop+i.offsetHeight>(d.documentElement.scrollTop||l.scrollTop)+l.offsetHeight&&i.scrollIntoView(!1)},backspace:function(e,t,n){if(e._removeZWS(),e._recordUndoState(n),e._getRangeAndRemoveBookmark(n),n.collapsed)if(ge(n)){t.preventDefault();var o=he(n),r=o&&f(o);if(r){if(!r.isContentEditable)return void m(r);for(b(r,o,n),o=r.parentNode;o&&!o.nextSibling;)o=o.parentNode;o&&(o=o.nextSibling)&&E(o),e.setSelection(n)}else if(o){if(u(o,"UL")||u(o,"OL"))return e.modifyBlocks(Fe,n);if(u(o,"BLOCKQUOTE"))return e.modifyBlocks(xe,n);e.setSelection(n),e._updatePath(n,!0)}}else e.setSelection(n),setTimeout(function(){_e(e)},0);else t.preventDefault(),se(n),_e(e,n)},"delete":function(e,t,n){if(e._removeZWS(),e._recordUndoState(n),e._getRangeAndRemoveBookmark(n),n.collapsed)if(me(n)){t.preventDefault();var o=he(n),r=o&&h(o);if(r){if(!r.isContentEditable)return void m(r);for(b(o,r,n),r=o.parentNode;r&&!r.nextSibling;)r=r.parentNode;r&&(r=r.nextSibling)&&E(r),e.setSelection(n),e._updatePath(n,!0)}}else{var r,i=n.commonAncestorContainer,a=!1;if(s(i)){for(var l,c=i.nodeValue&&i.nodeValue.length||i.innerText.length;i.parentNode&&!i.nextSibling&&s(i.parentNode);)i=i.parentNode;r=i.nextSibling,l=window.getComputedStyle(r).display,s(i)&&n.endOffset===c&&"IMG"===r.nodeName&&!/^inline|inline-block$/.test(l)&&(a=!0)}else d(i)&&(r=i.childNodes[n.startOffset],i===n.endContainer&&i===n.startContainer&&"IMG"===r.nodeName&&(a=!0));a&&(t.preventDefault(),r.parentNode.removeChild(r)),e.setSelection(n),setTimeout(function(){_e(e)},0)}else t.preventDefault(),se(n),_e(e,n)},tab:function(e,t,n){var o,r;if(e._removeZWS(),n.collapsed&&ge(n)&&me(n)){for(o=he(n);r=o.parentNode;){if("UL"===r.nodeName||"OL"===r.nodeName){o.previousSibling&&(t.preventDefault(),e.modifyBlocks(we,n));break}o=r}t.preventDefault()}},space:function(e,t,n){var o,r;e._recordUndoState(n),Me(n.startContainer),e._getRangeAndRemoveBookmark(n),o=n.endContainer,r=o.parentNode,n.collapsed&&"A"===r.nodeName&&!o.nextSibling&&n.endOffset===g(o)&&n.setStartAfter(r),e.setSelection(n)},left:function(e){e._removeZWS()},right:function(e){e._removeZWS()}};K&&z&&H.getSelection().modify&&(Se["meta-left"]=function(e,t){t.preventDefault(),e._sel.modify("move","backward","lineboundary")},Se["meta-right"]=function(e,t){t.preventDefault(),e._sel.modify("move","forward","lineboundary")}),Se[Q+"b"]=Ce("B"),Se[Q+"i"]=Ce("I"),Se[Q+"u"]=Ce("U"),Se[Q+"shift-7"]=Ce("S"),Se[Q+"shift-5"]=Ce("SUB",{tag:"SUP"}),Se[Q+"shift-6"]=Ce("SUP",{tag:"SUB"}),Se[Q+"shift-8"]=Ne("makeUnorderedList"),Se[Q+"shift-9"]=Ne("makeOrderedList"),Se[Q+"["]=Ne("decreaseQuoteLevel"),Se[Q+"]"]=Ne("increaseQuoteLevel"),Se[Q+"y"]=Ne("redo"),Se[Q+"z"]=Ne("undo"),Se[Q+"shift-z"]=Ne("redo");var ye=[],Te=O.prototype;Te.setConfig=function(e){return e=B({blockTag:"DIV",blockAttributes:null,tagAttributes:{blockquote:null,ul:null,ol:null,li:null}},e),e.blockTag=e.blockTag.toUpperCase(),this._config=e,this},Te.createElement=function(e,t,n){return C(this._doc,e,t,n)},Te.createDefaultBlock=function(e){var t=this._config;return _(this.createElement(t.blockTag,t.blockAttributes,e))},Te.didError=function(e){console.log(e)},Te.getDocument=function(){return this._doc};var be={focus:1,blur:1,pathChange:1,select:1,input:1,undoStateChange:1};Te.fireEvent=function(e,t){var n,o,r,i=this._events[e];if(i)for(t||(t={}),t.type!==e&&(t.type=e),i=i.slice(),n=0,o=i.length;o>n;n+=1){r=i[n];try{r.handleEvent?r.handleEvent(t):r.call(this,t)}catch(a){a.details="Squire: fireEvent error. Event type: "+e,this.didError(a)}}return this},Te.destroy=function(){var e,t=this._win,n=this._doc,o=this._events;t.removeEventListener("focus",this,!1),t.removeEventListener("blur",this,!1);for(e in o)be[e]||n.removeEventListener(e,this,!0);this._mutation&&this._mutation.disconnect();for(var r=ye.length;r--;)ye[r]===this&&ye.splice(r,1)},Te.handleEvent=function(e){this.fireEvent(e.type,e)},Te.addEventListener=function(e,t){var n=this._events[e];return t?(n||(n=this._events[e]=[],be[e]||this._doc.addEventListener(e,this,!0)),n.push(t),this):(this.didError({name:"Squire: addEventListener with null or undefined fn",message:"Event type: "+e}),this)},Te.removeEventListener=function(e,t){var n,o=this._events[e];if(o){for(n=o.length;n--;)o[n]===t&&o.splice(n,1);o.length||(delete this._events[e],be[e]||this._doc.removeEventListener(e,this,!1))}return this},Te._createRange=function(e,t,n,o){if(e instanceof this._win.Range)return e.cloneRange();var r=this._doc.createRange();return r.setStart(e,t),n?r.setEnd(n,o):r.setEnd(e,t),r},Te.setSelection=function(e){if(e){W&&this._win.focus();var t=this._sel;t.removeAllRanges(),t.addRange(e)}return this},Te.getSelection=function(){var e,t,n,o=this._sel;return o.rangeCount?(e=o.getRangeAt(0).cloneRange(),t=e.startContainer,n=e.endContainer,t&&a(t)&&e.setStartBefore(t),n&&a(n)&&e.setEndBefore(n),this._lastSelection=e):e=this._lastSelection,e||(e=this._createRange(this._body.firstChild,0)),e},Te.getSelectedText=function(){var e,t=this.getSelection(),o=new n(t.commonAncestorContainer,D|R,function(e){return le(t,e,!0)}),r=t.startContainer,i=t.endContainer,a=o.currentNode=r,d="",l=!1;for(o.filter(a)||(a=o.nextNode());a;)a.nodeType===x?(e=a.data,e&&/\S/.test(e)&&(a===i&&(e=e.slice(0,t.endOffset)),a===r&&(e=e.slice(t.startOffset)),d+=e,l=!0)):("BR"===a.nodeName||l&&!s(a))&&(d+="\n",l=!1),a=o.nextNode();return d},Te.getPath=function(){return this._path};var Ee=function(e){for(var t,o,r,i=new n(e,D,function(){return!0},!1);o=i.nextNode();)for(;(r=o.data.indexOf(F))>-1;){if(1===o.length){do t=o.parentNode,t.removeChild(o),o=t;while(s(o)&&!g(o));break}o.deleteData(r,1)}};Te._didAddZWS=function(){this._hasZWS=!0},Te._removeZWS=function(){this._hasZWS&&(Ee(this._body),this._hasZWS=!1)},Te._updatePath=function(e,t){var n,o=e.startContainer,r=e.endContainer;(t||o!==this._lastAnchorNode||r!==this._lastFocusNode)&&(this._lastAnchorNode=o,this._lastFocusNode=r,n=o&&r?o===r?p(r):"(selection)":"",this._path!==n&&(this._path=n,this.fireEvent("pathChange",{path:n}))),e.collapsed||this.fireEvent("select")},Te._updatePathOnEvent=function(){this._updatePath(this.getSelection())},Te.focus=function(){return q||this._body.focus(),this._win.focus(),this},Te.blur=function(){return z&&this._body.blur(),top.focus(),this};var ke="squire-selection-start",Be="squire-selection-end";Te._saveRangeToBookmark=function(e){var t,n=this.createElement("INPUT",{id:ke,type:"hidden"}),o=this.createElement("INPUT",{id:Be,type:"hidden"});ie(e,n),e.collapse(!1),ie(e,o),n.compareDocumentPosition(o)&A&&(n.id=Be,o.id=ke,t=n,n=o,o=t),e.setStartAfter(n),e.setEndBefore(o)},Te._getRangeAndRemoveBookmark=function(e){var t=this._doc,n=t.getElementById(ke),o=t.getElementById(Be);if(n&&o){var r,i=n.parentNode,a=o.parentNode,s={startContainer:i,endContainer:a,startOffset:J.call(i.childNodes,n),endOffset:J.call(a.childNodes,o)};i===a&&(s.endOffset-=1),m(n),m(o),T(i,s),i!==a&&T(a,s),e||(e=t.createRange()),e.setStart(s.startContainer,s.startOffset),e.setEnd(s.endContainer,s.endOffset),r=e.collapsed,ce(e),r&&e.collapse(!0)}return e||null},Te._keyUpDetectChange=function(e){var t=e.keyCode;e.ctrlKey||e.metaKey||e.altKey||!(16>t||t>20)||!(33>t||t>45)||this._docWasChanged()},Te._docWasChanged=function(){return Y&&this._ignoreChange?void(this._ignoreChange=!1):(this._isInUndoState&&(this._isInUndoState=!1,this.fireEvent("undoStateChange",{canUndo:!0,canRedo:!1})),void this.fireEvent("input"))},Te._recordUndoState=function(e){if(!this._isInUndoState){var t=this._undoIndex+=1,n=this._undoStack;t<this._undoStackLength&&(n.length=this._undoStackLength=t),e&&this._saveRangeToBookmark(e),n[t]=this._getHTML(),this._undoStackLength+=1,this._isInUndoState=!0}},Te.undo=function(){if(0!==this._undoIndex||!this._isInUndoState){this._recordUndoState(this.getSelection()),this._undoIndex-=1,this._setHTML(this._undoStack[this._undoIndex]);var e=this._getRangeAndRemoveBookmark();e&&this.setSelection(e),this._isInUndoState=!0,this.fireEvent("undoStateChange",{canUndo:0!==this._undoIndex,canRedo:!0}),this.fireEvent("input")}return this},Te.redo=function(){var e=this._undoIndex,t=this._undoStackLength;if(t>e+1&&this._isInUndoState){this._undoIndex+=1,this._setHTML(this._undoStack[this._undoIndex]);var n=this._getRangeAndRemoveBookmark();n&&this.setSelection(n),this.fireEvent("undoStateChange",{canUndo:!0,canRedo:t>e+2}),this.fireEvent("input")}return this},Te.hasFormat=function(e,t,o){if(e=e.toUpperCase(),t||(t={}),!o&&!(o=this.getSelection()))return!1;var r,i,a=o.commonAncestorContainer;if(u(a,e,t))return!0;if(a.nodeType===x)return!1;r=new n(a,D,function(e){return le(o,e,!0)},!1);for(var s=!1;i=r.nextNode();){if(!u(i,e,t))return!1;s=!0}return s},Te._addFormat=function(e,t,o){var r,i,a,s,d,l,c,f;if(o.collapsed)r=_(this.createElement(e,t)),ie(o,r),o.setStart(r.firstChild,r.firstChild.length),o.collapse(!0);else{if(i=new n(o.commonAncestorContainer,D|R,function(e){return(e.nodeType===x||"BR"===e.nodeName)&&le(o,e,!0)},!1),a=o.startContainer,d=o.startOffset,s=o.endContainer,l=o.endOffset,i.currentNode=a,i.filter(a)||(a=i.nextNode(),d=0),!a)return o;do c=i.currentNode,f=!u(c,e,t),f&&(c===s&&c.length>l&&c.splitText(l),c===a&&d&&(c=c.splitText(d),s===a&&(s=c,l-=d),a=c,d=0),r=this.createElement(e,t),v(c,r),r.appendChild(c));while(i.nextNode());s.nodeType!==x&&(c.nodeType===x?(s=c,l=c.length):(s=c.parentNode,l=1)),o=this._createRange(a,d,s,l)}return o},Te._removeFormat=function(e,t,n,o){this._saveRangeToBookmark(n);var i,a=this._doc;n.collapsed&&($?(i=a.createTextNode(F),this._didAddZWS()):i=a.createTextNode(""),ie(n,i));for(var d=n.commonAncestorContainer;s(d);)d=d.parentNode;var l=n.startContainer,c=n.startOffset,f=n.endContainer,h=n.endOffset,u=[],p=function(e,t){if(!le(n,e,!1)){var o,r,i=e.nodeType===x;if(!le(n,e,!0))return void("INPUT"===e.nodeName||i&&!e.data||u.push([t,e]));if(i)e===f&&h!==e.length&&u.push([t,e.splitText(h)]),e===l&&c&&(e.splitText(c),u.push([t,e]));else for(o=e.firstChild;o;o=r)r=o.nextSibling,p(o,t)}},g=Array.prototype.filter.call(d.getElementsByTagName(e),function(o){return le(n,o,!0)&&r(o,e,t)});o||g.forEach(function(e){p(e,e)}),u.forEach(function(e){var t=e[0].cloneNode(!1),n=e[1];v(n,t),t.appendChild(n)}),g.forEach(function(e){v(e,N(e))}),this._getRangeAndRemoveBookmark(n),i&&n.collapse(!1);var m={startContainer:n.startContainer,startOffset:n.startOffset,endContainer:n.endContainer,endOffset:n.endOffset};return T(d,m),n.setStart(m.startContainer,m.startOffset),n.setEnd(m.endContainer,m.endOffset),n},Te.changeFormat=function(e,t,n,o){return n||(n=this.getSelection())?(this._recordUndoState(n),this._getRangeAndRemoveBookmark(n),t&&(n=this._removeFormat(t.tag.toUpperCase(),t.attributes||{},n,o)),e&&(n=this._addFormat(e.tag.toUpperCase(),e.attributes||{},n)),this.setSelection(n),this._updatePath(n,!0),Y||this._docWasChanged(),this):void 0};var Oe={DT:"DD",DD:"DT",LI:"LI"},Ae=function(e,t,n,o){var i=Oe[t.nodeName],a=null,s=y(n,o,t.parentNode),d=e._config;return i||(i=d.blockTag,a=d.blockAttributes),r(s,i,a)||(t=C(s.ownerDocument,i,a),s.dir&&(t.dir=s.dir),v(s,t),t.appendChild(N(s)),s=t),s};Te.forEachBlock=function(e,t,n,o){if(!o&&n&&n.collapse&&"function"==typeof n.collapse&&(o=n,n=null),!o&&!(o=this.getSelection()))return this;t&&(this._recordUndoState(o),this._getRangeAndRemoveBookmark(o));var r=he(o),i=ue(o);if(r&&i)do if(e(r,n)||r===i)break;while(r=h(r));return t&&(this.setSelection(o),this._updatePath(o,!0),Y||this._docWasChanged()),this},Te.modifyBlocks=function(e,t,n){if(!n&&t&&t.collapse&&"function"==typeof t.collapse&&(n=t,t=null),!n&&!(n=this.getSelection()))return this;this._isInUndoState?this._saveRangeToBookmark(n):this._recordUndoState(n),ve(n);var o,r=this._body;return fe(n,r),o=ae(n,r),ie(n,e.call(this,o,t)),n.endOffset<n.endContainer.childNodes.length&&E(n.endContainer.childNodes[n.endOffset]),E(n.startContainer.childNodes[n.startOffset]),this._getRangeAndRemoveBookmark(n),this.setSelection(n),this._updatePath(n,!0),Y||this._docWasChanged(),this};var Le=function(e){return this.createElement("BLOCKQUOTE",this._config.tagAttributes.blockquote,[e])},xe=function(e){var t=e.querySelectorAll("blockquote");return Array.prototype.filter.call(t,function(e){return!u(e.parentNode,"BLOCKQUOTE")}).forEach(function(e){v(e,N(e))}),e},Re=function(){return this.createDefaultBlock([this.createElement("INPUT",{id:ke,type:"hidden"}),this.createElement("INPUT",{id:Be,type:"hidden"})])},De=function(e,t,n){for(var o,r,i,a,s=c(t),d=e._config.tagAttributes,l=d[n.toLowerCase()],f=d.li;o=s.nextNode();)r=o.parentNode.nodeName,"LI"!==r?(a=e.createElement("LI",f),o.dir&&(a.dir=o.dir),(i=o.previousSibling)&&i.nodeName===n?i.appendChild(a):v(o,e.createElement(n,l,[a])),a.appendChild(o)):(o=o.parentNode.parentNode,r=o.nodeName,r!==n&&/^[OU]L$/.test(r)&&v(o,e.createElement(n,l,[N(o)])))},Ue=function(e){return De(this,e,"UL"),e},Ie=function(e){return De(this,e,"OL"),e},Pe=function(e){var t,n,o,r,i,a,s,d=e.querySelectorAll("UL, OL");for(t=0,n=d.length;n>t;t+=1){for(r=d[t],i=N(r),a=i.childNodes,o=a.length;o--;)s=a[o],v(s,N(s));S(i),v(r,i)}return e},we=function(e){var t,n,o,r,i,a,s=e.querySelectorAll("LI"),d=this._config.tagAttributes,c=d.li;for(t=0,n=s.length;n>t;t+=1)o=s[t],l(o.firstChild)||(r=o.parentNode.nodeName,i=o.previousSibling,i&&(i=i.lastChild)&&i.nodeName===r||(a=d[r.toLowerCase()],v(o,this.createElement("LI",c,[i=this.createElement(r,a)]))),i.appendChild(o));return e},Fe=function(e){var t=e.querySelectorAll("LI");return Array.prototype.filter.call(t,function(e){return!l(e.firstChild)}).forEach(function(t){var n,o=t.parentNode,r=o.parentNode,i=t.firstChild,a=i;for(t.previousSibling&&(o=y(o,t,r));a&&(n=a.nextSibling,!l(a));)r.insertBefore(a,o),a=n;for("LI"===r.nodeName&&i.previousSibling&&y(r,i,r.parentNode);t!==e&&!t.childNodes.length;)o=t.parentNode,o.removeChild(t),t=o},this),S(e),e},He=/\b((?:(?:ht|f)tps?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,}\/)(?:[^\s()<>]+|\([^\s()<>]+\))+(?:\((?:[^\s()<>]+|(?:\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))|([\w\-.%+]+@(?:[\w\-]+\.)+[A-Z]{2,}\b)/i,Me=function(e){for(var t,o,r,i,a,s,d,l=e.ownerDocument,c=new n(e,D,function(e){return!u(e,"A")},!1);t=c.nextNode();)for(o=t.data,r=t.parentNode;i=He.exec(o);)a=i.index,s=a+i[0].length,a&&(d=l.createTextNode(o.slice(0,a)),r.insertBefore(d,t)),d=l.createElement("A"),d.textContent=o.slice(a,s),d.href=i[1]?/^(?:ht|f)tps?:/.test(i[1])?i[1]:"http://"+i[1]:"mailto:"+i[2],r.insertBefore(d,t),t.data=o=o.slice(s)},We=/^(?:A(?:DDRESS|RTICLE|SIDE|UDIO)|BLOCKQUOTE|CAPTION|D(?:[DLT]|IV)|F(?:IGURE|OOTER)|H[1-6]|HEADER|L(?:ABEL|EGEND|I)|O(?:L|UTPUT)|P(?:RE)?|SECTION|T(?:ABLE|BODY|D|FOOT|H|HEAD|R)|UL)$/,Ke={1:10,2:13,3:16,4:18,5:24,6:32,7:48},ze={backgroundColor:{regexp:X,replace:function(e,t){return C(e,"SPAN",{"class":"highlight",style:"background-color: "+t})}},color:{regexp:X,replace:function(e,t){return C(e,"SPAN",{"class":"colour",style:"color:"+t})}},fontWeight:{regexp:/^bold/i,replace:function(e){return C(e,"B")}},fontStyle:{regexp:/^italic/i,replace:function(e){return C(e,"I")}},fontFamily:{regexp:X,replace:function(e,t){return C(e,"SPAN",{"class":"font",style:"font-family:"+t})}},fontSize:{regexp:X,replace:function(e,t){return C(e,"SPAN",{"class":"size",style:"font-size:"+t})}}},Ze=function(e){return function(t,n){var o=C(t.ownerDocument,e);return n.replaceChild(o,t),o.appendChild(N(t)),o}},qe={SPAN:function(e,t){var n,o,r,i,a,s,d=e.style,l=e.ownerDocument;for(n in ze)o=ze[n],r=d[n],r&&o.regexp.test(r)&&(s=o.replace(l,r),i&&i.appendChild(s),i=s,a||(a=s));return a&&(i.appendChild(N(e)),t.replaceChild(a,e)),i||e},STRONG:Ze("B"),EM:Ze("I"),STRIKE:Ze("S"),FONT:function(e,t){var n,o,r,i,a,s=e.face,d=e.size,l=e.color,c=e.ownerDocument;return s&&(n=C(c,"SPAN",{"class":"font",style:"font-family:"+s}),a=n,i=n),d&&(o=C(c,"SPAN",{"class":"size",style:"font-size:"+Ke[d]+"px"}),a||(a=o),i&&i.appendChild(o),i=o),l&&/^#?([\dA-F]{3}){1,2}$/i.test(l)&&("#"!==l.charAt(0)&&(l="#"+l),r=C(c,"SPAN",{"class":"colour",style:"color:"+l}),a||(a=r),i&&i.appendChild(r),i=r),a||(a=i=C(c,"SPAN")),t.replaceChild(a,e),i.appendChild(N(e)),i},TT:function(e,t){var n=C(e.ownerDocument,"SPAN",{"class":"font",style:'font-family:menlo,consolas,"courier new",monospace'});return t.replaceChild(n,e),n.appendChild(N(e)),n}},Ve=function(e){for(var t,n=e.childNodes,o=n.length;o--;)t=n[o],t.nodeType!==L||a(t)?t.nodeType!==x||t.data||e.removeChild(t):(Ve(t),s(t)&&!t.firstChild&&e.removeChild(t))},Qe=function(e,t){var n,o,r,i,a,d,l,c,f,h,u=e.childNodes;for(n=0,o=u.length;o>n;n+=1)if(r=u[n],i=r.nodeName,a=r.nodeType,d=qe[i],a===L){if(l=r.childNodes.length,d)r=d(r,e);else{if(!We.test(i)&&!s(r)){n-=1,o+=l-1,e.replaceChild(N(r),r);continue}!t&&r.style.cssText&&r.removeAttribute("style")}l&&Qe(r,t)}else{if(a===x){if(c=r.data,/\S/.test(c)){if(s(e))continue;if(f=0,h=c.length,!n||!s(u[n-1])){for(;h>f&&!X.test(c.charAt(f));)f+=1;f&&(r.data=c=c.slice(f),h-=f)}if(n+1===o||!s(u[n+1])){for(f=h;f>0&&!X.test(c.charAt(f-1));)f-=1;h>f&&(r.data=c.slice(0,f))}continue}if(n&&o>n+1&&s(u[n-1])&&s(u[n+1])){r.data=" ";continue}}e.removeChild(r),n-=1,o-=1}return e},Ge=function(e){return e.nodeType===L?"BR"===e.nodeName:X.test(e.data)},$e=function(e){for(var t,o=e.parentNode;s(o);)o=o.parentNode;return t=new n(o,R|D,Ge),t.currentNode=e,!!t.nextNode()},je=function(e){var t,n,o,r=e.querySelectorAll("BR"),i=[],a=r.length;for(t=0;a>t;t+=1)i[t]=$e(r[t]);for(;a--;)if(n=r[a],o=n.parentNode){for(;s(o);)o=o.parentNode;if(d(o)){if(i[a]){if("DIV"!==o.nodeName)continue;y(n.parentNode,n,o.parentNode)}m(n)}else S(o)}};Te._ensureBottomLine=function(){var e=this._body,t=e.lastElementChild;t&&t.nodeName===this._config.blockTag&&d(t)||e.appendChild(this.createDefaultBlock())},Te._onCut=function(){var e=this.getSelection(),t=this;this._recordUndoState(e),this._getRangeAndRemoveBookmark(e),this.setSelection(e),setTimeout(function(){try{t._ensureBottomLine()}catch(e){t.didError(e)}},0)},Te._onPaste=function(e){if(!this._awaitingPaste){var t,n,o=e.clipboardData,r=o&&o.items,i=!1,a=!1;if(r){for(t=r.length;t--;){if(n=r[t].type,"text/html"===n){a=!1;break}/^image\/.*/.test(n)&&(a=!0)}if(a)return e.preventDefault(),this.fireEvent("dragover",{dataTransfer:o,preventDefault:function(){i=!0}}),void(i&&this.fireEvent("drop",{dataTransfer:o}))}this._awaitingPaste=!0;var s,d,l,c,f,u=this,p=this._body,g=this.getSelection();u._recordUndoState(g),u._getRangeAndRemoveBookmark(g),s=g.startContainer,d=g.startOffset,l=g.endContainer,c=g.endOffset,f=he(g);var v=this.createElement("DIV",{style:"position: absolute; overflow: hidden; top:"+(p.scrollTop+(f?f.getBoundingClientRect().top:0))+"px; left: 0; width: 1px; height: 1px;"});p.appendChild(v),g.selectNodeContents(v),this.setSelection(g),setTimeout(function(){try{var e=N(m(v)),t=e.firstChild,n=u._createRange(s,d,l,c);if(t){t===e.lastChild&&"DIV"===t.nodeName&&e.replaceChild(N(t),t),e.normalize(),Me(e),Qe(e,!1),je(e),Ve(e);for(var o=e,r=!0,i={fragment:e,preventDefault:function(){r=!1},isDefaultPrevented:function(){return!r}};o=h(o);)_(o);u.fireEvent("willPaste",i),r&&(de(n,i.fragment),Y||u._docWasChanged(),n.collapse(!1),u._ensureBottomLine())}u.setSelection(n),u._updatePath(n,!0),u._awaitingPaste=!1}catch(a){u.didError(a)}},0)}};var Ye={8:"backspace",9:"tab",13:"enter",32:"space",37:"left",39:"right",46:"delete",219:"[",221:"]"};Te._onKey=function(e){
var t=e.keyCode,n=Ye[t],o="",r=this.getSelection();n||(n=String.fromCharCode(t).toLowerCase(),/^[A-Za-z0-9]$/.test(n)||(n="")),q&&46===e.which&&(n="."),t>111&&124>t&&(n="f"+(t-111)),"backspace"!==n&&"delete"!==n&&(e.altKey&&(o+="alt-"),e.ctrlKey&&(o+="ctrl-"),e.metaKey&&(o+="meta-")),e.shiftKey&&(o+="shift-"),n=o+n,this._keyHandlers[n]?this._keyHandlers[n](this,e,r):1!==n.length||r.collapsed||(this._recordUndoState(r),this._getRangeAndRemoveBookmark(r),se(r),this._ensureBottomLine(),this.setSelection(r),this._updatePath(r,!0))},Te.setKeyHandler=function(e,t){return this._keyHandlers[e]=t,this},Te._getHTML=function(){return this._body.innerHTML},Te._setHTML=function(e){var t=this._body;t.innerHTML=e;do _(t);while(t=h(t));this._ignoreChange=!0},Te.getHTML=function(e){var t,n,o,r,i,a=[];if(e&&(i=this.getSelection())&&this._saveRangeToBookmark(i),G)for(t=this._body;t=h(t);)t.textContent||t.querySelector("BR")||(n=this.createElement("BR"),t.appendChild(n),a.push(n));if(o=this._getHTML().replace(/\u200B/g,""),G)for(r=a.length;r--;)m(a[r]);return i&&this._getRangeAndRemoveBookmark(i),o},Te.setHTML=function(e){var t,n=this._doc.createDocumentFragment(),o=this.createElement("DIV");o.innerHTML=e,n.appendChild(N(o)),Qe(n,!0),je(n),S(n);for(var r=n;r=h(r);)_(r);this._ignoreChange=!0;for(var i=this._body;t=i.lastChild;)i.removeChild(t);i.appendChild(n),_(i),this._undoIndex=-1,this._undoStack.length=0,this._undoStackLength=0,this._isInUndoState=!1;var a=this._getRangeAndRemoveBookmark()||this._createRange(i.firstChild,0);return this._recordUndoState(a),this._getRangeAndRemoveBookmark(a),j?this._lastSelection=a:this.setSelection(a),this._updatePath(a,!0),this},Te.insertElement=function(e,t){if(t||(t=this.getSelection()),t.collapse(!0),s(e))ie(t,e),t.setStartAfter(e);else{for(var n,o,r=this._body,i=he(t)||r;i!==r&&!i.nextSibling;)i=i.parentNode;i!==r&&(n=i.parentNode,o=y(n,i.nextSibling,r)),o?(r.insertBefore(e,o),t.setStart(o,0),t.setStart(o,0),ce(t)):(r.appendChild(e),r.appendChild(this.createDefaultBlock()),t.setStart(e,0),t.setEnd(e,0)),this.focus(),this.setSelection(t),this._updatePath(t)}return this},Te.insertImage=function(e,t){var n=this.createElement("IMG",B({src:e},t));return this.insertElement(n),n},Te.insertHTML=function(e){var t=this.getSelection(),n=this._doc.createDocumentFragment(),o=this.createElement("DIV");o.innerHTML=e,n.appendChild(N(o)),this._recordUndoState(t),this._getRangeAndRemoveBookmark(t);try{n.normalize(),Me(n),Qe(n,!0),je(n),Ve(n),S(n);for(var r=n;r=h(r);)_(r);de(t,n),Y||this._docWasChanged(),t.collapse(!1),this._ensureBottomLine(),this.setSelection(t),this._updatePath(t,!0)}catch(i){this.didError(i)}return this};var Xe=function(e,t,n){return function(){return this[e](t,n),this.focus()}};Te.addStyles=function(e){if(e){var t=this._doc.documentElement.firstChild,n=this.createElement("STYLE",{type:"text/css"});n.styleSheet?(t.appendChild(n),n.styleSheet.cssText=e):(n.appendChild(this._doc.createTextNode(e)),t.appendChild(n))}return this},Te.bold=Xe("changeFormat",{tag:"B"}),Te.italic=Xe("changeFormat",{tag:"I"}),Te.underline=Xe("changeFormat",{tag:"U"}),Te.strikethrough=Xe("changeFormat",{tag:"S"}),Te.subscript=Xe("changeFormat",{tag:"SUB"},{tag:"SUP"}),Te.superscript=Xe("changeFormat",{tag:"SUP"},{tag:"SUB"}),Te.removeBold=Xe("changeFormat",null,{tag:"B"}),Te.removeItalic=Xe("changeFormat",null,{tag:"I"}),Te.removeUnderline=Xe("changeFormat",null,{tag:"U"}),Te.removeStrikethrough=Xe("changeFormat",null,{tag:"S"}),Te.removeSubscript=Xe("changeFormat",null,{tag:"SUB"}),Te.removeSuperscript=Xe("changeFormat",null,{tag:"SUP"}),Te.makeLink=function(e,t){var n=this.getSelection();if(n.collapsed){var o=e.indexOf(":")+1;if(o)for(;"/"===e[o];)o+=1;ie(n,this._doc.createTextNode(e.slice(o)))}return t||(t={}),t.href=e,this.changeFormat({tag:"A",attributes:t},{tag:"A"},n),this.focus()},Te.removeLink=function(){return this.changeFormat(null,{tag:"A"},this.getSelection(),!0),this.focus()},Te.setFontFace=function(e){return this.changeFormat({tag:"SPAN",attributes:{"class":"font",style:"font-family: "+e+", sans-serif;"}},{tag:"SPAN",attributes:{"class":"font"}}),this.focus()},Te.setFontSize=function(e){return this.changeFormat({tag:"SPAN",attributes:{"class":"size",style:"font-size: "+("number"==typeof e?e+"px":e)}},{tag:"SPAN",attributes:{"class":"size"}}),this.focus()},Te.setTextColour=function(e){return this.changeFormat({tag:"SPAN",attributes:{"class":"colour",style:"color: "+e}},{tag:"SPAN",attributes:{"class":"colour"}}),this.focus()},Te.setHighlightColour=function(e){return this.changeFormat({tag:"SPAN",attributes:{"class":"highlight",style:"background-color: "+e}},{tag:"SPAN",attributes:{"class":"highlight"}}),this.focus()},Te.setTextAlignment=function(e){return this.forEachBlock(function(t){t.className=(t.className.split(/\s+/).filter(function(e){return!/align/.test(e)}).join(" ")+" align-"+e).trim(),t.style.textAlign=e},!0),this.focus()},Te.setTextDirection=function(e){return this.forEachBlock(function(t){t.dir=e},!0),this.focus()},Te.increaseQuoteLevel=Xe("modifyBlocks",Le),Te.decreaseQuoteLevel=Xe("modifyBlocks",xe),Te.makeUnorderedList=Xe("modifyBlocks",Ue),Te.makeOrderedList=Xe("modifyBlocks",Ie),Te.removeList=Xe("modifyBlocks",Pe),Te.increaseListLevel=Xe("modifyBlocks",we),Te.decreaseListLevel=Xe("modifyBlocks",Fe),top!==H?(H.editor=new O(e),H.onEditorLoad&&(H.onEditorLoad(H.editor),H.onEditorLoad=null)):"object"==typeof exports?module.exports=O:H.Squire=O}(document);