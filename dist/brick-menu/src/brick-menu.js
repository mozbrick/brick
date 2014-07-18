(function () {

  function delegate(selector, handler) {
    return function(e) {
      var target = e.target;
      var delegateEl = e.currentTarget;
      var matches = delegateEl.querySelectorAll(selector);
      for (var el = target; el.parentNode && el !== delegateEl; el = el.parentNode) {
        for (var i = 0; i < matches.length; i++) {
          if (matches[i] === el) {
            handler.call(el, e);
            return;
          }
        }
      }
    };
  }

  function _selectItem(el) {
    var selectedEl = el.parentNode.querySelectorAll('brick-menu-item[selected]');
    for (var i = 0; i < selectedEl.length; i++) {
      selectedEl[i].removeAttribute('selected');
    }
    el.setAttribute('selected', true);
  }

  var BrickMenuElementPrototype = Object.create(HTMLElement.prototype);

  BrickMenuElementPrototype.attachedCallback = function () {
    var self = this;
    self.selectHandler = delegate("brick-menu-item", function(){
      _selectItem(this);
    });
    self.addEventListener("click", self.selectHandler);
    self.addEventListener("select", self.selectHandler);
  };

  BrickMenuElementPrototype.detachedCallback = function () {
    this.removeEventListener("click", this.selectHandler);
    this.removeEventListener("select", this.selectHandler);
  };

  // Register the element
  window.BrickMenuElement = document.registerElement('brick-menu', {
    prototype: BrickMenuElementPrototype
  });

})();
