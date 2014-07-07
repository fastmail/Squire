
LazyLoad = (function (doc) {
  var env,

  head,
  pending = {},
  pollCount = 0,
  queue = {css: [], js: []},
  styleSheets = doc.styleSheets;
  function createNode(name, attrs) {
    var node = doc.createElement(name), attr;

    for (attr in attrs) {
      if (attrs.hasOwnProperty(attr)) {
        node.setAttribute(attr, attrs[attr]);
      }
    }

    return node;
  }

  function finish(type) {
    var p = pending[type],
        callback,
        urls;

    if (p) {
      callback = p.callback;
      urls     = p.urls;

      urls.shift();
      pollCount = 0;

      // If this is the last of the pending URLs, execute the callback and
      // start the next request in the queue (if any).
      if (!urls.length) {
        callback && callback.call(p.context, p.obj);
        pending[type] = null;
        queue[type].length && load(type);
      }
    }
  }

  function getEnv() {
    var ua = navigator.userAgent;

    env = {
        async: doc.createElement('script').async === true
    };

    (env.webkit = /AppleWebKit\//.test(ua))
      || (env.ie = /MSIE|Trident/.test(ua))
      || (env.opera = /Opera/.test(ua))
      || (env.gecko = /Gecko\//.test(ua))
      || (env.unknown = true);
  }

  function load(type, urls, callback, obj, context) {
    var _finish = function () { finish(type); },
        isCSS   = type === 'css',
        nodes   = [],
        i, len, node, p, pendingUrls, url;

    env || getEnv();

    if (urls) {
      urls = typeof urls === 'string' ? [urls] : urls.concat();

      if (isCSS || env.async || env.gecko || env.opera) {
        // Load in parallel.
        queue[type].push({
          urls    : urls,
          callback: callback,
          obj     : obj,
          context : context
        });
      } else {
        // Load sequentially.
        for (i = 0, len = urls.length; i < len; ++i) {
          queue[type].push({
            urls    : [urls[i]],
            callback: i === len - 1 ? callback : null, // callback is only added to the last URL
            obj     : obj,
            context : context
          });
        }
      }
    }

    // If a previous load request of this type is currently in progress, we'll
    // wait our turn. Otherwise, grab the next item in the queue.
    if (pending[type] || !(p = pending[type] = queue[type].shift())) {
      return;
    }

    head || (head = doc.head || doc.getElementsByTagName('head')[0]);
    pendingUrls = p.urls.concat();

    for (i = 0, len = pendingUrls.length; i < len; ++i) {
      url = pendingUrls[i];

      if (isCSS) {
          node = env.gecko ? createNode('style') : createNode('link', {
            href: url,
            rel : 'stylesheet'
          });
      } else {
        node = createNode('script', {src: url});
        node.async = false;
      }

      node.className = 'lazyload';
      node.setAttribute('charset', 'utf-8');

      if (env.ie && !isCSS && 'onreadystatechange' in node && !('draggable' in node)) {
        node.onreadystatechange = function () {
          if (/loaded|complete/.test(node.readyState)) {
            node.onreadystatechange = null;
            _finish();
          }
        };
      } else if (isCSS && (env.gecko || env.webkit)) {
        if (env.webkit) {
          p.urls[i] = node.href; // resolve relative URLs (or polling won't work)
          pollWebKit();
        } else {
         node.innerHTML = '@import "' + url + '";';
          pollGecko(node);
        }
      } else {
        node.onload = node.onerror = _finish;
      }

      nodes.push(node);
    }

    for (i = 0, len = nodes.length; i < len; ++i) {
      head.appendChild(nodes[i]);
    }
  }

  function pollGecko(node) {
    var hasRules;

    try {
      // We don't really need to store this value or ever refer to it again, but
      // if we don't store it, Closure Compiler assumes the code is useless and
      // removes it.
      hasRules = !!node.sheet.cssRules;
    } catch (ex) {
      // An exception means the stylesheet is still loading.
      pollCount += 1;

      if (pollCount < 200) {
        setTimeout(function () { pollGecko(node); }, 50);
      } else {
        // We've been polling for 10 seconds and nothing's happened. Stop
        // polling and finish the pending requests to avoid blocking further
        // requests.
        hasRules && finish('css');
      }

      return;
    }

    // If we get here, the stylesheet has loaded.
    finish('css');
  }

  function pollWebKit() {
    var css = pending.css, i;

    if (css) {
      i = styleSheets.length;

      // Look for a stylesheet matching the pending URL.
      while (--i >= 0) {
        if (styleSheets[i].href === css.urls[0]) {
          finish('css');
          break;
        }
      }

      pollCount += 1;

      if (css) {
        if (pollCount < 200) {
          setTimeout(pollWebKit, 50);
        } else {
          // We've been polling for 10 seconds and nothing's happened, which may
          // indicate that the stylesheet has been removed from the document
          // before it had a chance to load. Stop polling and finish the pending
          // request to prevent blocking further requests.
          finish('css');
        }
      }
    }
  }

  return {
	css: function (urls, callback, obj, context) {
      load('css', urls, callback, obj, context);
    },
    js: function (urls, callback, obj, context) {
      load('js', urls, callback, obj, context);
    }

  };
})(this.document);


(function() {
  console.log(typeof buildPath);
  if (typeof buildPath == "undefined") { buildPath = 'build/'; }

	LazyLoad.js(['squire.js','assets/jQuery/jQuery.js','assets/drop/drop.min.js'].map(function (value) {
     return buildPath + value;
  }));

	LazyLoad.css(['Squire-UI.css','assets/font-awesome/font-awesome.min.css', 'assets/drop/drop-theme-hubspot-popovers.css'].map(function (value) {
     return buildPath + value;
  }));
	
SquireUI = function(options) {
      // Create instance of iFrame
      var container;
      if (options.replace) {
          container = $(options.replace).parent();
          $(options.replace).remove();
      } else if (options.div) {
          container = $(options.div);
      } else {
          throw new Error(
              "No element was defined for the editor to inject to.");
      }

      $('<div />').load(buildPath + 'Squire-UI.html').appendTo(container);


      var editorContainer = $('<iframe />').appendTo(container);
      var editorDocument = editorContainer[0].contentWindow.document;
      var editor = new Squire(editorDocument);

      return editor;
  };

})();

