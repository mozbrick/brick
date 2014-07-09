(function () {

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

  window.BrickLayoutElement = document.registerElement('brick-layout', {
    prototype: BrickLayoutElementPrototype
  });

})();
