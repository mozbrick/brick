(function () {

  var BrickAppbarElementPrototype = Object.create(HTMLElement.prototype);

  // Lifecycle methods
  BrickAppbarElementPrototype.attachedCallback = function () {
    this.header = this.querySelectorAll('h1,h2,h3,h4,h5,h6')[0];
    if (!this.header) {
      this.header = document.createElement('h1');
      this.header.innerHTML = this.getAttribute('heading');
      this.appendChild(this.header);
    }
  };

  BrickAppbarElementPrototype.attributeChangedCallback = function (attr, oldVal, newVal) {
    if (attr in attrs) {
      attrs[attr].call(this, oldVal, newVal);
    }
  };

  var attrs = {
    'heading': function (oldVal, newVal) {
      this.header.innerHTML = newVal;
    }
  };

  Object.defineProperties(BrickAppbarElementPrototype, {
    'heading': {
      get: function () {
        return this.header.innerHTML;
      },
      set: function (newVal) {
        this.setAttribute('heading',newVal);
      }
    }
  });

  window.BrickAppbarElement = document.registerElement('brick-appbar', {
    prototype: BrickAppbarElementPrototype
  });

})();
