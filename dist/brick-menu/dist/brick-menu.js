/* globals Platform */

(function () {

  var currentScript = document._currentScript || document.currentScript;

  var BrickMenuElementPrototype = Object.create(HTMLElement.prototype);

  BrickMenuElementPrototype.attachedCallback = function() {

    var importDoc = currentScript.ownerDocument;
    var template = importDoc.querySelector('template');

    // fix styling for polyfill
    if (Platform.ShadowCSS) {
      var styles = template.content.querySelectorAll('style');
      for (var i = 0; i < styles.length; i++) {
        var style = styles[i];
        var cssText = Platform.ShadowCSS.shimStyle(style, 'brick-menu');
        Platform.ShadowCSS.addCssToDocument(cssText);
        style.remove();
      }
    }

    // create shadowRoot and append template to it.
    var shadowRoot = this.createShadowRoot();
    shadowRoot.appendChild(template.content.cloneNode(true));

  };

  // Register the element
  window.BrickMenuElement = document.registerElement('brick-menu', {
    prototype: BrickMenuElementPrototype
  });

})();
