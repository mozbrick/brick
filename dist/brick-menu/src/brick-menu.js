(function () {

  function delegateChild(handler) {
    return function(e) {
      var target = e.target;
      var delegateEl = e.currentTarget;
      for (var el = target; el.parentNode && el !== delegateEl; el = el.parentNode) {
        if (delegateEl === el.parentNode) {
          handler.call(el, e);
          return;
        }
      }
    };
  }

  function _selectItem(item) {
    var selectedItems = item.parentNode.querySelectorAll('*[selected]');
    for (var i = 0; i < selectedItems.length; i++) {
      selectedItems[i].removeAttribute('selected');
    }
    item.setAttribute('selected', true);
  }

  var BrickMenuElementPrototype = Object.create(HTMLElement.prototype);

  BrickMenuElementPrototype.attachedCallback = function () {
    var self = this;
    self.selectHandler = delegateChild(function(){
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
