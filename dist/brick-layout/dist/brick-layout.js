/* global Platform */

(function () {

  var currentScript = document._currentScript || document.currentScript;

  var BrickLayoutElementPrototype = Object.create(HTMLElement.prototype);

  BrickLayoutElementPrototype.openDrawer = function() {
    this.setAttribute("open","");
  };
  BrickLayoutElementPrototype.closeDrawer = function() {
    this.removeAttribute("open");
  };
  BrickLayoutElementPrototype.toggleDrawer = function() {
    if (this.hasAttribute("open")) {
      this.removeAttribute("open");
    } else {
      this.setAttribute("open","");
    }
  };

  BrickLayoutElementPrototype.attachedCallback = function() {
    var importDoc = currentScript.ownerDocument;
    var template = importDoc.querySelector('template');

    // fix styling for polyfill
    if (Platform.ShadowCSS) {
      var styles = template.content.querySelectorAll('style');
      for (var i = 0; i < styles.length; i++) {
        var style = styles[i];
        var cssText = Platform.ShadowCSS.shimStyle(style, 'brick-layout');
        Platform.ShadowCSS.addCssToDocument(cssText);
        style.remove();
      }
    }

    // create shadowRoot and append template to it.
    var shadowRoot = this.createShadowRoot();
    shadowRoot.appendChild(template.content.cloneNode(true));
  };

  window.BrickLayoutElement = document.registerElement('brick-layout', {
    prototype: BrickLayoutElementPrototype
  });

})();
