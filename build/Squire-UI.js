$(document).ready(function() {
  Squire.prototype.testPresenceinSelection = function(name, action, format,
    validation) {
    var path = this.getPath(),
      test = (validation.test(path) | this.hasFormat(format));
    if (name == action && test) {
      return true;
    } else {
      return false;
    }
  };
  SquireUI = function(options) {
    if (typeof options.buildPath == "undefined") {
      options.buildPath = 'build/';
    }
    // Create instance of iFrame
    var container, editor;
    if (options.replace) {
      container = $(options.replace).parent();
      $(options.replace).remove();
    } else if (options.div) {
      container = $(options.div);
    } else {
      throw new Error(
        "No element was defined for the editor to inject to.");
    }
    var iframe = document.createElement('iframe');
    var div = document.createElement('div');
    div.className = 'Squire-UI';
    iframe.height = options.height;

    $(div).load(options.buildPath + 'Squire-UI.html', function() {
      this.linkDrop = new Drop({
        target: $('#makeLink').first()[0],
        content: $('#drop-link').html(),
        position: 'bottom center',
        openOn: 'click'
      });

      this.linkDrop.on('open', function () {
        $('.quit').click(function () {
          $(this).parent().parent().removeClass('drop-open');
        });

        $('.submitLink').click(function () {
          var editor = iframe.contentWindow.editor;
          editor.makeLink($(this).parent().children('#url').first().val());
          $(this).parent().parent().removeClass('drop-open');
          $(this).parent().children('#url').attr('value', '');
        });
      });

      this.imageDrop = new Drop({
        target: $('#insertImage').first()[0],
        content: $('#drop-image').html(),
        position: 'bottom center',
        openOn: 'click'
      });

      this.imageDrop.on('open', function () {
        $('.quit').unbind().click(function () {
          $(this).parent().parent().removeClass('drop-open');
        });

        $('.sumbitImageURL').unbind().click(function () {
          console.log("Passed through .sumbitImageURL");
          var editor = iframe.contentWindow.editor;
          url = $(this).parent().children('#imageUrl').first()[0];
          editor.insertImage(url.value);
          $(this).parent().parent().removeClass('drop-open');
          $(this).parent().children('#imageUrl').attr('value', '');
        });

      });

      this.fontDrop = new Drop({
        target: $('#selectFont').first()[0],
        content: $('#drop-font').html(),
        position: 'bottom center',
        openOn: 'click'
      });

      this.fontDrop.on('open', function () {
        $('.quit').click(function () {
          $(this).parent().parent().removeClass('drop-open');
        });

        $('.submitFont').unbind().click(function () {
          var editor = iframe.contentWindow.editor;
          var selectedFonts = $('select#fontSelect option:selected').last().data('fonts');
          var fontSize =  $('select#textSelector option:selected').last().data('size') + 'px';
          editor.setFontSize(fontSize);

          try {
            editor.setFontFace(selectedFonts);
          } catch (e) {
            alert('Please make a selection of text.');
          } finally {
            $(this).parent().parent().removeClass('drop-open');
          }

        });


      });

      $('.item').click(function() {
        var iframe = $(this).parents('.Squire-UI').next('iframe').first()[0];
        var editor = iframe.contentWindow.editor;
        var action = $(this).data('action');

        test = {
          value: $(this).data('action'),
          testBold: editor.testPresenceinSelection('bold',
            action, 'B', (/>B\b/)),
          testItalic: editor.testPresenceinSelection('italic',
            action, 'I', (/>I\b/)),
          testUnderline: editor.testPresenceinSelection(
            'underline', action, 'U', (/>U\b/)),
          testOrderedList: editor.testPresenceinSelection(
            'makeOrderedList', action, 'OL', (/>OL\b/)),
          testLink: editor.testPresenceinSelection('makeLink',
            action, 'A', (/>A\b/)),
          testQuote: editor.testPresenceinSelection(
            'increaseQuoteLevel', action, 'blockquote', (
              />blockquote\b/)),
          isNotValue: function (a) {return (a == action && this.value !== ''); }
        };

        editor.alignRight = function () { editor.setTextAlignment('right'); };
        editor.alignCenter = function () { editor.setTextAlignment('center'); };
        editor.alignLeft = function () { editor.setTextAlignment('left'); };
        editor.alignJustify = function () { editor.setTextAlignment('justify'); };
        editor.makeHeading = function () { editor.setFontSize('2em'); editor.bold(); };

        if (test.testBold | test.testItalic | test.testUnderline | test.testOrderedList | test.testLink | test.testQuote) {
          if (test.testBold) editor.removeBold();
          if (test.testItalic) editor.removeItalic();
          if (test.testUnderline) editor.removeUnderline();
          if (test.testLink) editor.removeLink();
          if (test.testOrderedList) editor.removeList();
          if (test.testQuote) editor.decreaseQuoteLevel();
        } else if (test.isNotValue('makeLink') | test.isNotValue('insertImage') | test.isNotValue('selectFont')) {
          // do nothing these are dropdowns.
        } else {
            editor[action]();
            editor.focus();
        }
      });
    });

    iframe.addEventListener('load', function() {
      // Make sure we're in standards mode.
      var doc = iframe.contentDocument;
      if ( doc.compatMode !== 'CSS1Compat' ) {
          doc.open();
          doc.write( '<!DOCTYPE html><title></title>' );
          doc.close();
      }
      // doc.close() can cause a re-entrant load event in some browsers,
      // such as IE9.
      if ( iframe.contentWindow.editor ) {
          return;
      }
      iframe.contentWindow.editor = new Squire(iframe.contentWindow.document);
      iframe.contentWindow.editor.addStyles(
          'html {' +
          '  height: 100%;' +
          '}' +
          'body {' +
          '  -moz-box-sizing: border-box;' +
          '  -webkit-box-sizing: border-box;' +
          '  box-sizing: border-box;' +
          '  height: 100%;' +
          '  padding: 1em;' +
          '  background: transparent;' +
          '  color: #2b2b2b;' +
          '  font: 13px/1.35 Helvetica, arial, sans-serif;' +
          '  cursor: text;' +
          '}' +
          'a {' +
          '  text-decoration: underline;' +
          '}' +
          'h1 {' +
          '  font-size: 138.5%;' +
          '}' +
          'h2 {' +
          '  font-size: 123.1%;' +
          '}' +
          'h3 {' +
          '  font-size: 108%;' +
          '}' +
          'h1,h2,h3,p {' +
          '  margin: 1em 0;' +
          '}' +
          'h4,h5,h6 {' +
          '  margin: 0;' +
          '}' +
          'ul, ol {' +
          '  margin: 0 1em;' +
          '  padding: 0 1em;' +
          '}' +
          'blockquote {' +
          '  border-left: 2px solid blue;' +
          '  margin: 0;' +
          '  padding: 0 10px;' +
          '}'
      );
    });

    $(container).append(div);
    $(container).append(iframe);

    return iframe.contentWindow.editor;
  };
});
/*! drop 0.5.4 */
!function(t,e){"function"==typeof define&&define.amd?define(e):"object"==typeof exports?module.exports=e(require,exports,module):t.Tether=e()}(this,function(){return function(){var t,e,o,i,n,s,r,l,h,a,p,f,u,d,c,g,m,b={}.hasOwnProperty,v=[].indexOf||function(t){for(var e=0,o=this.length;o>e;e++)if(e in this&&this[e]===t)return e;return-1},y=[].slice;null==this.Tether&&(this.Tether={modules:[]}),p=function(t){var e,o,i,n,s;if(o=getComputedStyle(t).position,"fixed"===o)return t;for(i=void 0,e=t;e=e.parentNode;){try{n=getComputedStyle(e)}catch(r){}if(null==n)return e;if(/(auto|scroll)/.test(n.overflow+n["overflow-y"]+n["overflow-x"])&&("absolute"!==o||"relative"===(s=n.position)||"absolute"===s||"fixed"===s))return e}return document.body},c=function(){var t;return t=0,function(){return t++}}(),m={},h=function(t){var e,i,s,r,l;if(s=t._tetherZeroElement,null==s&&(s=t.createElement("div"),s.setAttribute("data-tether-id",c()),n(s.style,{top:0,left:0,position:"absolute"}),t.body.appendChild(s),t._tetherZeroElement=s),e=s.getAttribute("data-tether-id"),null==m[e]){m[e]={},l=s.getBoundingClientRect();for(i in l)r=l[i],m[e][i]=r;o(function(){return m[e]=void 0})}return m[e]},u=null,r=function(t){var e,o,i,n,s,r,l;t===document?(o=document,t=document.documentElement):o=t.ownerDocument,i=o.documentElement,e={},l=t.getBoundingClientRect();for(n in l)r=l[n],e[n]=r;return s=h(o),e.top-=s.top,e.left-=s.left,null==e.width&&(e.width=document.body.scrollWidth-e.left-e.right),null==e.height&&(e.height=document.body.scrollHeight-e.top-e.bottom),e.top=e.top-i.clientTop,e.left=e.left-i.clientLeft,e.right=o.body.clientWidth-e.width-e.left,e.bottom=o.body.clientHeight-e.height-e.top,e},l=function(t){return t.offsetParent||document.documentElement},a=function(){var t,e,o,i,s;return t=document.createElement("div"),t.style.width="100%",t.style.height="200px",e=document.createElement("div"),n(e.style,{position:"absolute",top:0,left:0,pointerEvents:"none",visibility:"hidden",width:"200px",height:"150px",overflow:"hidden"}),e.appendChild(t),document.body.appendChild(e),i=t.offsetWidth,e.style.overflow="scroll",s=t.offsetWidth,i===s&&(s=e.clientWidth),document.body.removeChild(e),o=i-s,{width:o,height:o}},n=function(t){var e,o,i,n,s,r,l;for(null==t&&(t={}),e=[],Array.prototype.push.apply(e,arguments),l=e.slice(1),s=0,r=l.length;r>s;s++)if(i=l[s])for(o in i)b.call(i,o)&&(n=i[o],t[o]=n);return t},d=function(t,e){var o,i,n,s,r;if(null!=t.classList){for(s=e.split(" "),r=[],i=0,n=s.length;n>i;i++)o=s[i],o.trim()&&r.push(t.classList.remove(o));return r}return t.className=t.className.replace(new RegExp("(^| )"+e.split(" ").join("|")+"( |$)","gi")," ")},e=function(t,e){var o,i,n,s,r;if(null!=t.classList){for(s=e.split(" "),r=[],i=0,n=s.length;n>i;i++)o=s[i],o.trim()&&r.push(t.classList.add(o));return r}return d(t,e),t.className+=" "+e},f=function(t,e){return null!=t.classList?t.classList.contains(e):new RegExp("(^| )"+e+"( |$)","gi").test(t.className)},g=function(t,o,i){var n,s,r,l,h,a;for(s=0,l=i.length;l>s;s++)n=i[s],v.call(o,n)<0&&f(t,n)&&d(t,n);for(a=[],r=0,h=o.length;h>r;r++)n=o[r],a.push(f(t,n)?void 0:e(t,n));return a},i=[],o=function(t){return i.push(t)},s=function(){var t,e;for(e=[];t=i.pop();)e.push(t());return e},t=function(){function t(){}return t.prototype.on=function(t,e,o,i){var n;return null==i&&(i=!1),null==this.bindings&&(this.bindings={}),null==(n=this.bindings)[t]&&(n[t]=[]),this.bindings[t].push({handler:e,ctx:o,once:i})},t.prototype.once=function(t,e,o){return this.on(t,e,o,!0)},t.prototype.off=function(t,e){var o,i,n;if(null!=(null!=(i=this.bindings)?i[t]:void 0)){if(null==e)return delete this.bindings[t];for(o=0,n=[];o<this.bindings[t].length;)n.push(this.bindings[t][o].handler===e?this.bindings[t].splice(o,1):o++);return n}},t.prototype.trigger=function(){var t,e,o,i,n,s,r,l,h;if(o=arguments[0],t=2<=arguments.length?y.call(arguments,1):[],null!=(r=this.bindings)?r[o]:void 0){for(n=0,h=[];n<this.bindings[o].length;)l=this.bindings[o][n],i=l.handler,e=l.ctx,s=l.once,i.apply(null!=e?e:this,t),h.push(s?this.bindings[o].splice(n,1):n++);return h}},t}(),this.Tether.Utils={getScrollParent:p,getBounds:r,getOffsetParent:l,extend:n,addClass:e,removeClass:d,hasClass:f,updateClasses:g,defer:o,flush:s,uniqueId:c,Evented:t,getScrollBarSize:a}}.call(this),function(){var t,e,o,i,n,s,r,l,h,a,p,f,u,d,c,g,m,b,v,y,w,C,O,x,T,E,P,_,W,S=[].slice,A=function(t,e){return function(){return t.apply(e,arguments)}};if(null==this.Tether)throw new Error("You must include the utils.js file before tether.js");i=this.Tether,W=i.Utils,g=W.getScrollParent,m=W.getSize,d=W.getOuterSize,f=W.getBounds,u=W.getOffsetParent,a=W.extend,n=W.addClass,O=W.removeClass,E=W.updateClasses,h=W.defer,p=W.flush,c=W.getScrollBarSize,P=function(t,e,o){return null==o&&(o=1),t+o>=e&&e>=t-o},T=function(){var t,e,o,i,n;for(t=document.createElement("div"),n=["transform","webkitTransform","OTransform","MozTransform","msTransform"],o=0,i=n.length;i>o;o++)if(e=n[o],void 0!==t.style[e])return e}(),x=[],C=function(){var t,e,o;for(e=0,o=x.length;o>e;e++)t=x[e],t.position(!1);return p()},b=function(){var t;return null!=(t="undefined"!=typeof performance&&null!==performance&&"function"==typeof performance.now?performance.now():void 0)?t:+new Date},function(){var t,e,o,i,n,s,r,l,h;for(e=null,o=null,i=null,n=function(){if(null!=o&&o>16)return o=Math.min(o-16,250),void(i=setTimeout(n,250));if(!(null!=e&&b()-e<10))return null!=i&&(clearTimeout(i),i=null),e=b(),C(),o=b()-e},l=["resize","scroll","touchmove"],h=[],s=0,r=l.length;r>s;s++)t=l[s],h.push(window.addEventListener(t,n));return h}(),t={center:"center",left:"right",right:"left"},e={middle:"middle",top:"bottom",bottom:"top"},o={top:0,left:0,middle:"50%",center:"50%",bottom:"100%",right:"100%"},l=function(o,i){var n,s;return n=o.left,s=o.top,"auto"===n&&(n=t[i.left]),"auto"===s&&(s=e[i.top]),{left:n,top:s}},r=function(t){var e,i;return{left:null!=(e=o[t.left])?e:t.left,top:null!=(i=o[t.top])?i:t.top}},s=function(){var t,e,o,i,n,s,r;for(e=1<=arguments.length?S.call(arguments,0):[],o={top:0,left:0},n=0,s=e.length;s>n;n++)r=e[n],i=r.top,t=r.left,"string"==typeof i&&(i=parseFloat(i,10)),"string"==typeof t&&(t=parseFloat(t,10)),o.top+=i,o.left+=t;return o},v=function(t,e){return"string"==typeof t.left&&-1!==t.left.indexOf("%")&&(t.left=parseFloat(t.left,10)/100*e.width),"string"==typeof t.top&&-1!==t.top.indexOf("%")&&(t.top=parseFloat(t.top,10)/100*e.height),t},y=w=function(t){var e,o,i;return i=t.split(" "),o=i[0],e=i[1],{top:o,left:e}},_=function(){function t(t){this.position=A(this.position,this);var e,o,n,s,r;for(x.push(this),this.history=[],this.setOptions(t,!1),s=i.modules,o=0,n=s.length;n>o;o++)e=s[o],null!=(r=e.initialize)&&r.call(this);this.position()}return t.modules=[],t.prototype.getClass=function(t){var e,o;return(null!=(e=this.options.classes)?e[t]:void 0)?this.options.classes[t]:(null!=(o=this.options.classes)?o[t]:void 0)!==!1?this.options.classPrefix?""+this.options.classPrefix+"-"+t:t:""},t.prototype.setOptions=function(t,e){var o,i,s,r,l,h;for(this.options=t,null==e&&(e=!0),o={offset:"0 0",targetOffset:"0 0",targetAttachment:"auto auto",classPrefix:"tether"},this.options=a(o,this.options),l=this.options,this.element=l.element,this.target=l.target,this.targetModifier=l.targetModifier,"viewport"===this.target?(this.target=document.body,this.targetModifier="visible"):"scroll-handle"===this.target&&(this.target=document.body,this.targetModifier="scroll-handle"),h=["element","target"],s=0,r=h.length;r>s;s++){if(i=h[s],null==this[i])throw new Error("Tether Error: Both element and target must be defined");null!=this[i].jquery?this[i]=this[i][0]:"string"==typeof this[i]&&(this[i]=document.querySelector(this[i]))}if(n(this.element,this.getClass("element")),n(this.target,this.getClass("target")),!this.options.attachment)throw new Error("Tether Error: You must provide an attachment");return this.targetAttachment=y(this.options.targetAttachment),this.attachment=y(this.options.attachment),this.offset=w(this.options.offset),this.targetOffset=w(this.options.targetOffset),null!=this.scrollParent&&this.disable(),this.scrollParent="scroll-handle"===this.targetModifier?this.target:g(this.target),this.options.enabled!==!1?this.enable(e):void 0},t.prototype.getTargetBounds=function(){var t,e,o,i,n,s,r,l,h;if(null==this.targetModifier)return f(this.target);switch(this.targetModifier){case"visible":return this.target===document.body?{top:pageYOffset,left:pageXOffset,height:innerHeight,width:innerWidth}:(t=f(this.target),n={height:t.height,width:t.width,top:t.top,left:t.left},n.height=Math.min(n.height,t.height-(pageYOffset-t.top)),n.height=Math.min(n.height,t.height-(t.top+t.height-(pageYOffset+innerHeight))),n.height=Math.min(innerHeight,n.height),n.height-=2,n.width=Math.min(n.width,t.width-(pageXOffset-t.left)),n.width=Math.min(n.width,t.width-(t.left+t.width-(pageXOffset+innerWidth))),n.width=Math.min(innerWidth,n.width),n.width-=2,n.top<pageYOffset&&(n.top=pageYOffset),n.left<pageXOffset&&(n.left=pageXOffset),n);case"scroll-handle":return h=this.target,h===document.body?(h=document.documentElement,t={left:pageXOffset,top:pageYOffset,height:innerHeight,width:innerWidth}):t=f(h),l=getComputedStyle(h),o=h.scrollWidth>h.clientWidth||"scroll"===[l.overflow,l.overflowX]||this.target!==document.body,s=0,o&&(s=15),i=t.height-parseFloat(l.borderTopWidth)-parseFloat(l.borderBottomWidth)-s,n={width:15,height:.975*i*(i/h.scrollHeight),left:t.left+t.width-parseFloat(l.borderLeftWidth)-15},e=0,408>i&&this.target===document.body&&(e=-11e-5*Math.pow(i,2)-.00727*i+22.58),this.target!==document.body&&(n.height=Math.max(n.height,24)),r=this.target.scrollTop/(h.scrollHeight-i),n.top=r*(i-n.height-e)+t.top+parseFloat(l.borderTopWidth),this.target===document.body&&(n.height=Math.max(n.height,24)),n}},t.prototype.clearCache=function(){return this._cache={}},t.prototype.cache=function(t,e){return null==this._cache&&(this._cache={}),null==this._cache[t]&&(this._cache[t]=e.call(this)),this._cache[t]},t.prototype.enable=function(t){return null==t&&(t=!0),n(this.target,this.getClass("enabled")),n(this.element,this.getClass("enabled")),this.enabled=!0,this.scrollParent!==document&&this.scrollParent.addEventListener("scroll",this.position),t?this.position():void 0},t.prototype.disable=function(){return O(this.target,this.getClass("enabled")),O(this.element,this.getClass("enabled")),this.enabled=!1,null!=this.scrollParent?this.scrollParent.removeEventListener("scroll",this.position):void 0},t.prototype.destroy=function(){var t,e,o,i,n;for(this.disable(),n=[],t=o=0,i=x.length;i>o;t=++o){if(e=x[t],e===this){x.splice(t,1);break}n.push(void 0)}return n},t.prototype.updateAttachClasses=function(t,e){var o,i,n,s,r,l,a,p,f,u=this;for(null==t&&(t=this.attachment),null==e&&(e=this.targetAttachment),s=["left","top","bottom","right","middle","center"],(null!=(f=this._addAttachClasses)?f.length:void 0)&&this._addAttachClasses.splice(0,this._addAttachClasses.length),o=null!=this._addAttachClasses?this._addAttachClasses:this._addAttachClasses=[],t.top&&o.push(""+this.getClass("element-attached")+"-"+t.top),t.left&&o.push(""+this.getClass("element-attached")+"-"+t.left),e.top&&o.push(""+this.getClass("target-attached")+"-"+e.top),e.left&&o.push(""+this.getClass("target-attached")+"-"+e.left),i=[],r=0,a=s.length;a>r;r++)n=s[r],i.push(""+this.getClass("element-attached")+"-"+n);for(l=0,p=s.length;p>l;l++)n=s[l],i.push(""+this.getClass("target-attached")+"-"+n);return h(function(){return null!=u._addAttachClasses?(E(u.element,u._addAttachClasses,i),E(u.target,u._addAttachClasses,i),u._addAttachClasses=void 0):void 0})},t.prototype.position=function(t){var e,o,n,h,a,d,g,m,b,y,w,C,O,x,T,E,P,_,W,S,A,M,B,L,z,F,H,Y,N,X,j,k,D,U,R,q=this;if(null==t&&(t=!0),this.enabled){for(this.clearCache(),S=l(this.targetAttachment,this.attachment),this.updateAttachClasses(this.attachment,S),e=this.cache("element-bounds",function(){return f(q.element)}),z=e.width,n=e.height,0===z&&0===n&&null!=this.lastSize?(X=this.lastSize,z=X.width,n=X.height):this.lastSize={width:z,height:n},B=M=this.cache("target-bounds",function(){return q.getTargetBounds()}),b=v(r(this.attachment),{width:z,height:n}),A=v(r(S),B),a=v(this.offset,{width:z,height:n}),d=v(this.targetOffset,B),b=s(b,a),A=s(A,d),h=M.left+A.left-b.left,L=M.top+A.top-b.top,j=i.modules,F=0,Y=j.length;Y>F;F++)if(g=j[F],T=g.position.call(this,{left:h,top:L,targetAttachment:S,targetPos:M,attachment:this.attachment,elementPos:e,offset:b,targetOffset:A,manualOffset:a,manualTargetOffset:d,scrollbarSize:_}),null!=T&&"object"==typeof T){if(T===!1)return!1;L=T.top,h=T.left}if(m={page:{top:L,left:h},viewport:{top:L-pageYOffset,bottom:pageYOffset-L-n+innerHeight,left:h-pageXOffset,right:pageXOffset-h-z+innerWidth}},document.body.scrollWidth>window.innerWidth&&(_=this.cache("scrollbar-size",c),m.viewport.bottom-=_.height),document.body.scrollHeight>window.innerHeight&&(_=this.cache("scrollbar-size",c),m.viewport.right-=_.width),(""!==(k=document.body.style.position)&&"static"!==k||""!==(D=document.body.parentElement.style.position)&&"static"!==D)&&(m.page.bottom=document.body.scrollHeight-L-n,m.page.right=document.body.scrollWidth-h-z),(null!=(U=this.options.optimizations)?U.moveElement:void 0)!==!1&&null==this.targetModifier){for(w=this.cache("target-offsetparent",function(){return u(q.target)}),x=this.cache("target-offsetparent-bounds",function(){return f(w)}),O=getComputedStyle(w),o=getComputedStyle(this.element),C=x,y={},R=["Top","Left","Bottom","Right"],H=0,N=R.length;N>H;H++)W=R[H],y[W.toLowerCase()]=parseFloat(O["border"+W+"Width"]);x.right=document.body.scrollWidth-x.left-C.width+y.right,x.bottom=document.body.scrollHeight-x.top-C.height+y.bottom,m.page.top>=x.top+y.top&&m.page.bottom>=x.bottom&&m.page.left>=x.left+y.left&&m.page.right>=x.right&&(P=w.scrollTop,E=w.scrollLeft,m.offset={top:m.page.top-x.top+P-y.top,left:m.page.left-x.left+E-y.left})}return this.move(m),this.history.unshift(m),this.history.length>3&&this.history.pop(),t&&p(),!0}},t.prototype.move=function(t){var e,o,i,n,s,r,l,p,f,d,c,g,m,b,v,y,w,C=this;if(null!=this.element.parentNode){p={};for(d in t){p[d]={};for(n in t[d]){for(i=!1,y=this.history,b=0,v=y.length;v>b;b++)if(l=y[b],!P(null!=(w=l[d])?w[n]:void 0,t[d][n])){i=!0;break}i||(p[d][n]=!0)}}e={top:"",left:"",right:"",bottom:""},f=function(t,o){var i,n,s;return(null!=(s=C.options.optimizations)?s.gpu:void 0)===!1?(t.top?e.top=""+o.top+"px":e.bottom=""+o.bottom+"px",t.left?e.left=""+o.left+"px":e.right=""+o.right+"px"):(t.top?(e.top=0,n=o.top):(e.bottom=0,n=-o.bottom),t.left?(e.left=0,i=o.left):(e.right=0,i=-o.right),e[T]="translateX("+Math.round(i)+"px) translateY("+Math.round(n)+"px)","msTransform"!==T?e[T]+=" translateZ(0)":void 0)},s=!1,(p.page.top||p.page.bottom)&&(p.page.left||p.page.right)?(e.position="absolute",f(p.page,t.page)):(p.viewport.top||p.viewport.bottom)&&(p.viewport.left||p.viewport.right)?(e.position="fixed",f(p.viewport,t.viewport)):null!=p.offset&&p.offset.top&&p.offset.left?(e.position="absolute",r=this.cache("target-offsetparent",function(){return u(C.target)}),u(this.element)!==r&&h(function(){return C.element.parentNode.removeChild(C.element),r.appendChild(C.element)}),f(p.offset,t.offset),s=!0):(e.position="absolute",f({top:!0,left:!0},t.page)),s||"BODY"===this.element.parentNode.tagName||(this.element.parentNode.removeChild(this.element),document.body.appendChild(this.element)),m={},g=!1;for(n in e)c=e[n],o=this.element.style[n],""===o||""===c||"top"!==n&&"left"!==n&&"bottom"!==n&&"right"!==n||(o=parseFloat(o),c=parseFloat(c)),o!==c&&(g=!0,m[n]=e[n]);return g?h(function(){return a(C.element.style,m)}):void 0}},t}(),i.position=C,this.Tether=a(_,i)}.call(this),function(){var t,e,o,i,n,s,r,l,h,a,p=[].indexOf||function(t){for(var e=0,o=this.length;o>e;e++)if(e in this&&this[e]===t)return e;return-1};a=this.Tether.Utils,r=a.getOuterSize,s=a.getBounds,l=a.getSize,i=a.extend,h=a.updateClasses,o=a.defer,e={left:"right",right:"left",top:"bottom",bottom:"top",middle:"middle"},t=["left","top","right","bottom"],n=function(e,o){var i,n,r,l,h,a,p;if("scrollParent"===o?o=e.scrollParent:"window"===o&&(o=[pageXOffset,pageYOffset,innerWidth+pageXOffset,innerHeight+pageYOffset]),o===document&&(o=o.documentElement),null!=o.nodeType)for(n=l=s(o),h=getComputedStyle(o),o=[n.left,n.top,l.width+n.left,l.height+n.top],i=a=0,p=t.length;p>a;i=++a)r=t[i],r=r[0].toUpperCase()+r.substr(1),"Top"===r||"Left"===r?o[i]+=parseFloat(h["border"+r+"Width"]):o[i]-=parseFloat(h["border"+r+"Width"]);return o},this.Tether.modules.push({position:function(e){var r,l,a,f,u,d,c,g,m,b,v,y,w,C,O,x,T,E,P,_,W,S,A,M,B,L,z,F,H,Y,N,X,j,k,D,U,R,q,Z,$,I,G,J,K,Q,V,te,ee=this;if(L=e.top,v=e.left,W=e.targetAttachment,!this.options.constraints)return!0;for(E=function(e){var o,i,n,s;for(ee.removeClass(e),s=[],i=0,n=t.length;n>i;i++)o=t[i],s.push(ee.removeClass(""+e+"-"+o));return s},$=this.cache("element-bounds",function(){return s(ee.element)}),b=$.height,z=$.width,0===z&&0===b&&null!=this.lastSize&&(I=this.lastSize,z=I.width,b=I.height),A=this.cache("target-bounds",function(){return ee.getTargetBounds()}),S=A.height,M=A.width,_={},m={},l=[this.getClass("pinned"),this.getClass("out-of-bounds")],G=this.options.constraints,F=0,X=G.length;X>F;F++)g=G[F],g.outOfBoundsClass&&l.push(g.outOfBoundsClass),g.pinnedClass&&l.push(g.pinnedClass);for(H=0,j=l.length;j>H;H++)for(c=l[H],J=["left","top","right","bottom"],Y=0,k=J.length;k>Y;Y++)P=J[Y],l.push(""+c+"-"+P);for(r=[],_=i({},W),m=i({},this.attachment),K=this.options.constraints,N=0,D=K.length;D>N;N++){if(g=K[N],B=g.to,a=g.attachment,O=g.pin,null==a&&(a=""),p.call(a," ")>=0?(Q=a.split(" "),d=Q[0],u=Q[1]):u=d=a,f=n(this,B),("target"===d||"both"===d)&&(L<f[1]&&"top"===_.top&&(L+=S,_.top="bottom"),L+b>f[3]&&"bottom"===_.top&&(L-=S,_.top="top")),"together"===d&&(L<f[1]&&"top"===_.top&&("bottom"===m.top?(L+=S,_.top="bottom",L+=b,m.top="top"):"top"===m.top&&(L+=S,_.top="bottom",L-=b,m.top="bottom")),L+b>f[3]&&"bottom"===_.top&&("top"===m.top?(L-=S,_.top="top",L-=b,m.top="bottom"):"bottom"===m.top&&(L-=S,_.top="top",L+=b,m.top="top")),"middle"===_.top&&(L+b>f[3]&&"top"===m.top?(L-=b,m.top="bottom"):L<f[1]&&"bottom"===m.top&&(L+=b,m.top="top"))),("target"===u||"both"===u)&&(v<f[0]&&"left"===_.left&&(v+=M,_.left="right"),v+z>f[2]&&"right"===_.left&&(v-=M,_.left="left")),"together"===u&&(v<f[0]&&"left"===_.left?"right"===m.left?(v+=M,_.left="right",v+=z,m.left="left"):"left"===m.left&&(v+=M,_.left="right",v-=z,m.left="right"):v+z>f[2]&&"right"===_.left?"left"===m.left?(v-=M,_.left="left",v-=z,m.left="right"):"right"===m.left&&(v-=M,_.left="left",v+=z,m.left="left"):"center"===_.left&&(v+z>f[2]&&"left"===m.left?(v-=z,m.left="right"):v<f[0]&&"right"===m.left&&(v+=z,m.left="left"))),("element"===d||"both"===d)&&(L<f[1]&&"bottom"===m.top&&(L+=b,m.top="top"),L+b>f[3]&&"top"===m.top&&(L-=b,m.top="bottom")),("element"===u||"both"===u)&&(v<f[0]&&"right"===m.left&&(v+=z,m.left="left"),v+z>f[2]&&"left"===m.left&&(v-=z,m.left="right")),"string"==typeof O?O=function(){var t,e,o,i;for(o=O.split(","),i=[],e=0,t=o.length;t>e;e++)C=o[e],i.push(C.trim());return i}():O===!0&&(O=["top","left","right","bottom"]),O||(O=[]),x=[],y=[],L<f[1]&&(p.call(O,"top")>=0?(L=f[1],x.push("top")):y.push("top")),L+b>f[3]&&(p.call(O,"bottom")>=0?(L=f[3]-b,x.push("bottom")):y.push("bottom")),v<f[0]&&(p.call(O,"left")>=0?(v=f[0],x.push("left")):y.push("left")),v+z>f[2]&&(p.call(O,"right")>=0?(v=f[2]-z,x.push("right")):y.push("right")),x.length)for(T=null!=(V=this.options.pinnedClass)?V:this.getClass("pinned"),r.push(T),q=0,U=x.length;U>q;q++)P=x[q],r.push(""+T+"-"+P);if(y.length)for(w=null!=(te=this.options.outOfBoundsClass)?te:this.getClass("out-of-bounds"),r.push(w),Z=0,R=y.length;R>Z;Z++)P=y[Z],r.push(""+w+"-"+P);(p.call(x,"left")>=0||p.call(x,"right")>=0)&&(m.left=_.left=!1),(p.call(x,"top")>=0||p.call(x,"bottom")>=0)&&(m.top=_.top=!1),(_.top!==W.top||_.left!==W.left||m.top!==this.attachment.top||m.left!==this.attachment.left)&&this.updateAttachClasses(m,_)}return o(function(){return h(ee.target,r,l),h(ee.element,r,l)}),{top:L,left:v}}})}.call(this),function(){var t,e,o,i;i=this.Tether.Utils,e=i.getBounds,o=i.updateClasses,t=i.defer,this.Tether.modules.push({position:function(i){var n,s,r,l,h,a,p,f,u,d,c,g,m,b,v,y,w,C,O,x,T,E,P,_,W,S=this;if(c=i.top,a=i.left,T=this.cache("element-bounds",function(){return e(S.element)}),h=T.height,g=T.width,d=this.getTargetBounds(),l=c+h,p=a+g,n=[],c<=d.bottom&&l>=d.top)for(E=["left","right"],m=0,w=E.length;w>m;m++)f=E[m],((P=d[f])===a||P===p)&&n.push(f);if(a<=d.right&&p>=d.left)for(_=["top","bottom"],b=0,C=_.length;C>b;b++)f=_[b],((W=d[f])===c||W===l)&&n.push(f);for(r=[],s=[],u=["left","top","right","bottom"],r.push(this.getClass("abutted")),v=0,O=u.length;O>v;v++)f=u[v],r.push(""+this.getClass("abutted")+"-"+f);for(n.length&&s.push(this.getClass("abutted")),y=0,x=n.length;x>y;y++)f=n[y],s.push(""+this.getClass("abutted")+"-"+f);return t(function(){return o(S.target,s,r),o(S.element,s,r)}),!0}})}.call(this),function(){this.Tether.modules.push({position:function(t){var e,o,i,n,s,r,l;return r=t.top,e=t.left,this.options.shift?(o=function(t){return"function"==typeof t?t.call(this,{top:r,left:e}):t},i=o(this.options.shift),"string"==typeof i?(i=i.split(" "),i[1]||(i[1]=i[0]),s=i[0],n=i[1],s=parseFloat(s,10),n=parseFloat(n,10)):(l=[i.top,i.left],s=l[0],n=l[1]),r+=s,e+=n,{top:r,left:e}):void 0}})}.call(this),this.Tether}),function(){var t,e,o,i,n,s,r,l,h,a,p,f,u,d,c,g,m,b,v={}.hasOwnProperty,y=function(t,e){function o(){this.constructor=t}for(var i in e)v.call(e,i)&&(t[i]=e[i]);return o.prototype=e.prototype,t.prototype=new o,t.__super__=e.prototype,t},w=[].indexOf||function(t){for(var e=0,o=this.length;o>e;e++)if(e in this&&this[e]===t)return e;return-1};b=Tether.Utils,l=b.extend,o=b.addClass,p=b.removeClass,h=b.hasClass,t=b.Evented,c="ontouchstart"in document.documentElement,n=["click"],c&&n.push("touchstart"),m={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"otransitionend",transition:"transitionend"},g="";for(a in m)r=m[a],d=document.createElement("p"),void 0!==d.style[a]&&(g=r);u=function(t){var e,o,i,n;return i=t.split(" "),e=i[0],o=i[1],("left"===e||"right"===e)&&(n=[o,e],e=n[0],o=n[1]),[e,o].join(" ")},e={left:"right",right:"left",top:"bottom",bottom:"top",middle:"middle",center:"center"},i={},f=function(t,e){var o,i;for(i=[];-1!==(o=t.indexOf(e));)i.push(t.splice(o,1));return i},s=function(r){var a,d,c,m;return null==r&&(r={}),c=function(){return function(t,e,o){o.prototype=t.prototype;var i=new o,n=t.apply(i,e);return Object(n)===n?n:i}(a,arguments,function(){})},l(c,{createContext:s,drops:[],defaults:{}}),d={classPrefix:"drop",defaults:{position:"bottom left",openOn:"click",constrainToScrollParent:!0,constrainToWindow:!0,classes:"",remove:!1,tetherOptions:{}}},l(c,d,r),l(c.defaults,d.defaults,r.defaults),null==i[m=c.classPrefix]&&(i[m]=[]),c.updateBodyClasses=function(){var t,e,n,s,r;for(t=!1,r=i[c.classPrefix],n=0,s=r.length;s>n;n++)if(e=r[n],e.isOpened()){t=!0;break}return t?o(document.body,""+c.classPrefix+"-open"):p(document.body,""+c.classPrefix+"-open")},a=function(t){function s(t){if(this.options=t,this.options=l({},c.defaults,this.options),this.target=this.options.target,null==this.target)throw new Error("Drop Error: You must provide a target.");this.options.classes&&o(this.target,this.options.classes),c.drops.push(this),i[c.classPrefix].push(this),this._boundEvents=[],this.setupElements(),this.setupEvents(),this.setupTether()}return y(s,t),s.prototype._on=function(t,e,o){return this._boundEvents.push({element:t,event:e,handler:o}),t.addEventListener(e,o)},s.prototype.setupElements=function(){return this.drop=document.createElement("div"),o(this.drop,c.classPrefix),this.options.classes&&o(this.drop,this.options.classes),this.content=document.createElement("div"),o(this.content,""+c.classPrefix+"-content"),"object"==typeof this.options.content?this.content.appendChild(this.options.content):this.content.innerHTML=this.options.content,this.drop.appendChild(this.content)},s.prototype.setupTether=function(){var t,o;return o=this.options.position.split(" "),o[0]=e[o[0]],o=o.join(" "),t=[],t.push(this.options.constrainToScrollParent?{to:"scrollParent",pin:"top, bottom",attachment:"together none"}:{to:"scrollParent"}),t.push(this.options.constrainToWindow!==!1?{to:"window",attachment:"together"}:{to:"window"}),r={element:this.drop,target:this.target,attachment:u(o),targetAttachment:u(this.options.position),classPrefix:c.classPrefix,offset:"0 0",targetOffset:"0 0",enabled:!1,constraints:t},this.options.tetherOptions!==!1?this.tether=new Tether(l({},r,this.options.tetherOptions)):void 0},s.prototype.setupEvents=function(){var t,e,o,i,s,r,l,h,a,p,f=this;if(this.options.openOn){if("always"===this.options.openOn)return void setTimeout(this.open.bind(this));if(o=this.options.openOn.split(" "),w.call(o,"click")>=0)for(s=function(t){return f.toggle(),t.preventDefault()},e=function(t){return!f.isOpened()||t.target===f.drop||f.drop.contains(t.target)||t.target===f.target||f.target.contains(t.target)?void 0:f.close()},a=0,p=n.length;p>a;a++)t=n[a],this._on(this.target,t,s),this._on(document,t,e);return w.call(o,"hover")>=0?(i=!1,h=function(){return i=!0,f.open()},l=null,r=function(){return i=!1,null!=l&&clearTimeout(l),l=setTimeout(function(){return i||f.close(),l=null},50)},this._on(this.target,"mouseover",h),this._on(this.drop,"mouseover",h),this._on(this.target,"mouseout",r),this._on(this.drop,"mouseout",r)):void 0}},s.prototype.isOpened=function(){return h(this.drop,""+c.classPrefix+"-open")},s.prototype.toggle=function(){return this.isOpened()?this.close():this.open()},s.prototype.open=function(){var t,e,i=this;if(!this.isOpened())return this.drop.parentNode||document.body.appendChild(this.drop),null!=(t=this.tether)&&t.enable(),o(this.drop,""+c.classPrefix+"-open"),o(this.drop,""+c.classPrefix+"-open-transitionend"),setTimeout(function(){return o(i.drop,""+c.classPrefix+"-after-open")}),null!=(e=this.tether)&&e.position(),this.trigger("open"),c.updateBodyClasses()},s.prototype.close=function(){var t,e,o=this;if(this.isOpened())return p(this.drop,""+c.classPrefix+"-open"),p(this.drop,""+c.classPrefix+"-after-open"),this.drop.addEventListener(g,t=function(){return h(o.drop,""+c.classPrefix+"-open")||p(o.drop,""+c.classPrefix+"-open-transitionend"),o.drop.removeEventListener(g,t)}),this.trigger("close"),null!=(e=this.tether)&&e.disable(),c.updateBodyClasses(),this.options.remove?this.remove():void 0},s.prototype.remove=function(){var t;return this.close(),null!=(t=this.drop.parentNode)?t.removeChild(this.drop):void 0},s.prototype.position=function(){var t;return this.isOpened()&&null!=(t=this.tether)?t.position():void 0},s.prototype.destroy=function(){var t,e,o,n,s,r,l,h;for(this.remove(),null!=(r=this.tether)&&r.destroy(),l=this._boundEvents,n=0,s=l.length;s>n;n++)h=l[n],t=h.element,e=h.event,o=h.handler,t.removeEventListener(e,o);return this._boundEvents=[],this.tether=null,this.drop=null,this.content=null,this.target=null,f(i[c.classPrefix],this),f(c.drops,this)},s}(t),c},window.Drop=s(),document.addEventListener("DOMContentLoaded",function(){return Drop.updateBodyClasses()})}.call(this);
