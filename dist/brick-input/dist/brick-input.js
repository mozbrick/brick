/* globals Platform */

(function() {

  var currentScript = document._currentScript || document.currentScript;

  function shimShadowStyles(styles, tag) {
    if (!Platform.ShadowCSS) {
      return;
    }
    for (var i = 0; i < styles.length; i++) {
      var style = styles[i];
      var cssText = Platform.ShadowCSS.shimStyle(style, tag);
      Platform.ShadowCSS.addCssToDocument(cssText);
      style.remove();
    }
  }

  function copyAttributes(src, dest, exceptions) {
    var attrs = src.attributes;
    for (var i = 0; i < attrs.length; i++) {
      var attr = src.attributes[i];
      if (exceptions.indexOf(attr.name) === -1) {
        dest.setAttribute(attr.name, attr.value);
      }
    }
  }

  function addListener(arr, el, event, handler, capture) {
    el.addEventListener(event, handler, capture);
    arr.push([el, event, handler, capture]);
  }
  function removeListener(el, event, handler, capture) {
    el.removeEventListener(event, handler, capture);
  }


  var BrickInputElementPrototype = Object.create(HTMLElement.prototype);

  BrickInputElementPrototype.createdCallback = function () {

  };

  BrickInputElementPrototype.attachedCallback = function () {
    var brickInput = this;
    brickInput.listeners = [];

    // import template
    var importDoc = currentScript.ownerDocument;
    var templateContent = importDoc.querySelector('template').content;

    // fix styling for polyfill
    shimShadowStyles(templateContent.querySelectorAll('style'), 'brick-input');

    // create shadowRoot and append template
    var shadowRoot = brickInput.createShadowRoot();
    shadowRoot.appendChild(templateContent.cloneNode(true));

    // get the input
    if (brickInput.hasAttribute('multiline')) {
      brickInput.input = document.createElement('textarea');
    } else {
      brickInput.input = document.createElement('input');
    }
    copyAttributes(brickInput,brickInput.input,['label', 'multiline']);
    brickInput.appendChild(brickInput.input);
    var inputChangeListener = function () {
      if(!brickInput.input.checkValidity()) {
        brickInput.setAttribute('invalid', '');
      } else {
        brickInput.removeAttribute('invalid');
      }
    };
    addListener(brickInput.listeners, brickInput, 'change', inputChangeListener);

    // setup label
    var placeholderText = brickInput.getAttribute('placeholder');
    var labelText = brickInput.getAttribute('label');
    if (labelText) {
      var label = shadowRoot.querySelector('.label');
      label.appendChild(document.createTextNode(labelText));
    }
    var ariaLabel = labelText || placeholderText;
    if (ariaLabel) {
      brickInput.input.setAttribute('aria-label', labelText);
    }

    // setup error message
    var errorText = brickInput.getAttribute('error');
    if (errorText) {
      var error = shadowRoot.querySelector('.error');
      error.appendChild(document.createTextNode(errorText));
    }

    // setup clear button and listen to it
    var clearButton = shadowRoot.querySelector('.clear');
    brickInput.clearing = false;
    clearButton.addEventListener('click', function () {
      brickInput.input.value = '';
      brickInput.input.focus();
    });
    var clearMouseDownListener = function () {
      brickInput.clearing = true;
    };
    addListener(brickInput.listeners, clearButton, 'mousedown', clearMouseDownListener);
    var clearMouseUpListener = function () {
      brickInput.clearing = false;
    };
    addListener(brickInput.listeners, clearButton, 'mouseup', clearMouseUpListener);

    // listen to focus and blur
    var focusListener = function () {
      brickInput.setAttribute('focus', '');
    };
    addListener(brickInput.listeners, brickInput.input, 'focus', focusListener);
    var blurListener =function () {
      if (!brickInput.clearing) {
        brickInput.removeAttribute('focus');
      }
    };
    addListener(brickInput.listeners, brickInput.input, 'blur', blurListener);
  };

  BrickInputElementPrototype.detachedCallback = function () {
    // clean up listeners
    while(this.listeners.length) {
      removeListener.apply(this, this.listeners.shift());
    }
  };

  BrickInputElementPrototype.attributeChangedCallback = function (attr, oldVal, newVal) {
    if (attr in attrs) {
      attrs[attr].call(this, oldVal, newVal);
    }
  };

  // Attribute handlers

  var attrs = {

  };

  // Property handlers
  Object.defineProperties(BrickInputElementPrototype, {

  });

  // Register the element

  window.BrickInputElement = document.registerElement('brick-input', {
    prototype: BrickInputElementPrototype
  });

})();
