/* globals Platform */

(function () {

  var currentScript = document._currentScript || document.currentScript;

  var requestAnimationFrame = window.requestAnimationFrame ||
                              window.webkitRequestAnimationFrame ||
                              function (fn) { setTimeout(fn, 16); };

  var skipFrame = function(fn){
    requestAnimationFrame(function(){ requestAnimationFrame(fn); });
  };

  var BrickDialogElementPrototype = Object.create(HTMLElement.prototype);

  BrickDialogElementPrototype.attachedCallback = function() {

    var importDoc = currentScript.ownerDocument;
    var template = importDoc.querySelector('#brick-dialog-template');

    // fix styling for polyfill
    if (Platform.ShadowCSS) {
      var styles = template.content.querySelectorAll('style');
      for (var i = 0; i < styles.length; i++) {
        var style = styles[i];
        var cssText = Platform.ShadowCSS.shimStyle(style, 'brick-dialog');
        Platform.ShadowCSS.addCssToDocument(cssText);
        style.remove();
      }
    }

    // create shadowRoot and append template to it.
    var shadowRoot = this.createShadowRoot();
    shadowRoot.appendChild(template.content.cloneNode(true));

    
    this.addEventListener('click', this.hide.bind(this));

    var dialog = shadowRoot.querySelector('.dialog');
    dialog.addEventListener('click', function(e) {
      e.stopPropagation();
    });

  };

  BrickDialogElementPrototype.detachedCallback = function() {
    this.removeEventListener('click', this.hide.bind(this));
  };



  BrickDialogElementPrototype.show = function() {
    var dialog = this;
    dialog.setAttribute('show','');

    skipFrame(function() {
      dialog.setAttribute('show', 'in');
    });
  };

  BrickDialogElementPrototype.hide = function() {
    var dialog = this;
    dialog.setAttribute('show', 'out');

    var animationendHandler = function() {
      dialog.removeAttribute('show');
      dialog.removeEventListener('animationend', animationendHandler);
      dialog.removeEventListener('webkitAnimationEnd', animationendHandler);
    };

    dialog.addEventListener('animationend', animationendHandler);
    dialog.addEventListener('webkitAnimationEnd', animationendHandler);
  };

  // Register the element
  window.BrickDialogElement = document.registerElement('brick-dialog', {
    prototype: BrickDialogElementPrototype
  });

})();
