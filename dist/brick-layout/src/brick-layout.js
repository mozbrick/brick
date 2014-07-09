(function () {

  var BrickLayoutElementPrototype = Object.create(HTMLElement.prototype);

  window.BrickLayoutElement = document.registerElement('brick-layout', {
    prototype: BrickLayoutElementPrototype
  });

})();
