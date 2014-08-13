/* global Platform */

(function () {

  var currentScript = document._currentScript || document.currentScript;

  var BrickAppbarElementPrototype = Object.create(HTMLElement.prototype);

  // Lifecycle methods
  BrickAppbarElementPrototype.attachedCallback = function () {

    var importDoc = currentScript.ownerDocument;
    var template = importDoc.querySelector('#brick-appbar-template');

    // fix styling for polyfill
    if (Platform.ShadowCSS) {
      var styles = template.content.querySelectorAll('style');
      for (var i = 0; i < styles.length; i++) {
        var style = styles[i];
        var cssText = Platform.ShadowCSS.shimStyle(style, 'brick-appbar');
        Platform.ShadowCSS.addCssToDocument(cssText);
        style.remove();
      }
    }

    // create shadowRoot and append template to it.
    var shadowRoot = this.createShadowRoot();
    shadowRoot.appendChild(template.content.cloneNode(true));
  };

  if (!window.BrickAppbarElement) {
    window.BrickAppbarElement = document.registerElement('brick-appbar', {
      prototype: BrickAppbarElementPrototype
    });
  }

})();
