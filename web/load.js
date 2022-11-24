// https://www.npmjs.com/package/fg-loadcss
export const loadCSS = function (href, before, media, attributes) {
  // Arguments explained:
  // `href` [REQUIRED] is the URL for your CSS file.
  // `before` [OPTIONAL] is the element the script should use as a reference for injecting our stylesheet <link> before
  // By default, loadCSS attempts to inject the link after the last stylesheet or script in the DOM. However, you might desire a more specific location in your document.
  // `media` [OPTIONAL] is the media type or query of the stylesheet. By default it will be 'all'
  // `attributes` [OPTIONAL] is the Object of attribute name/attribute value pairs to set on the stylesheet's DOM Element.
  var doc = window.document;
  var ss = doc.createElement('link');
  var ref;
  if (before) {
    ref = before;
  } else {
    var refs = (doc.body || doc.getElementsByTagName('head')[0]).childNodes;
    ref = refs[refs.length - 1];
  }

  var sheets = doc.styleSheets;
  // Set any of the provided attributes to the stylesheet DOM Element.
  if (attributes) {
    for (var attributeName in attributes) {
      if (attributes.hasOwnProperty(attributeName)) {
        ss.setAttribute(attributeName, attributes[attributeName]);
      }
    }
  }
  ss.rel = 'stylesheet';
  ss.href = href;
  // temporarily set media to something inapplicable to ensure it'll fetch without blocking render
  ss.media = 'only x';

  // wait until body is defined before injecting link. This ensures a non-blocking load in IE11.
  function ready(cb) {
    if (doc.body) {
      return cb();
    }
    setTimeout(function () {
      ready(cb);
    });
  }
  // Inject link
  // Note: the ternary preserves the existing behavior of "before" argument, but we could choose to change the argument to "after" in a later release and standardize on ref.nextSibling for all refs
  // Note: `insertBefore` is used instead of `appendChild`, for safety re: http://www.paulirish.com/2011/surefire-dom-element-insertion/
  ready(function () {
    ref.parentNode.insertBefore(ss, before ? ref : ref.nextSibling);
  });
  // A method (exposed on return object for external use) that mimics onload by polling document.styleSheets until it includes the new sheet.
  var onloadcssdefined = function (cb) {
    var resolvedHref = ss.href;
    var i = sheets.length;
    while (i--) {
      if (sheets[i].href === resolvedHref) {
        return cb();
      }
    }
    setTimeout(function () {
      onloadcssdefined(cb);
    });
  };

  function loadCB() {
    if (ss.addEventListener) {
      ss.removeEventListener('load', loadCB);
    }
    ss.media = media || 'all';
  }

  // once loaded, set link's media back to `all` so that the stylesheet applies once it loads
  if (ss.addEventListener) {
    ss.addEventListener('load', loadCB);
  }
  ss.onloadcssdefined = onloadcssdefined;
  onloadcssdefined(loadCB);
  return ss;
};

// https://www.npmjs.com/package/load-script
export const loadScript = function loadScript(src, opts, cb) {
  var head = document.head || document.getElementsByTagName('head')[0];
  var script = document.createElement('script');

  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  opts = opts || {};
  cb = cb || function () {};

  script.type = opts.type || 'text/javascript';
  script.charset = opts.charset || 'utf8';
  script.async = 'async' in opts ? !!opts.async : true;
  script.src = src;

  console.log('script.async', script.async);
  if (opts.attrs) {
    setAttributes(script, opts.attrs);
  }

  if (opts.text) {
    script.text = '' + opts.text;
  }

  var onend = 'onload' in script ? stdOnEnd : ieOnEnd;
  onend(script, cb);

  // some good legacy browsers (firefox) fail the 'in' detection above
  // so as a fallback we always set onload
  // old IE will ignore this and new IE will set onload
  if (!script.onload) {
    stdOnEnd(script, cb);
  }

  head.appendChild(script);
};

function setAttributes(script, attrs) {
  for (var attr in attrs) {
    script.setAttribute(attr, attrs[attr]);
  }
}

function stdOnEnd(script, cb) {
  script.onload = function () {
    this.onerror = this.onload = null;
    cb(null, script);
  };
  script.onerror = function () {
    // this.onload = null here is necessary
    // because even IE9 works not like others
    this.onerror = this.onload = null;
    cb(new Error('Failed to load ' + this.src), script);
  };
}

function ieOnEnd(script, cb) {
  script.onreadystatechange = function () {
    if (this.readyState != 'complete' && this.readyState != 'loaded') return;
    this.onreadystatechange = null;
    cb(null, script); // there is no way to catch loading errors in IE8
  };
}
