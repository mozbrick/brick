/* global Platform */

(function () {

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

  var BrickButtonElementPrototype = Object.create(window.BrickActionElement.prototype);

  // Lifecycle methods

  BrickButtonElementPrototype.createdCallback = function () {

    window.BrickActionElement.prototype.createdCallback.call(this);

    // import template
    var importDoc = currentScript.ownerDocument;
    var templateContent = importDoc.querySelector('#brick-button-template').content;

    // fix styling for polyfill
    shimShadowStyles(templateContent.querySelectorAll('style'),'brick-button');

    // create shadowRoot and append template
    var shadowRoot = this.createShadowRoot();
    shadowRoot.appendChild(templateContent.cloneNode(true));

    this.setAttribute('role', 'button');

  };

  // Register the element

  window.BrickButtonElement = document.registerElement('brick-button', {
    prototype: BrickButtonElementPrototype
  });

})();
