(function () {

  var BrickMenuItemElementPrototype = Object.create(HTMLElement.prototype);

  BrickMenuItemElementPrototype.attachedCallback = function () {

  };

  BrickMenuItemElementPrototype.detachedCallback = function () {

  };

  window.BrickMenuItemElement = document.registerElement('brick-menu-item', {
    prototype: BrickMenuItemElementPrototype
  });

})();
