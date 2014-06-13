(function() {

  function delegate(delegateEl, type, selector, handler) {
    delegateEl.addEventListener(type, function(event) {
      var target = event.target;
      var matches = delegateEl.querySelectorAll(selector);
      for (var el = target; el.parentNode && el != delegateEl; el = el.parentNode) {
        for (i = 0; i < matches.length; i++) {
          if (matches[i] == el) {
            handler.call(el, event);
            return;
          }
        }
      }
    });
  }

  var formRowPrototype = Object.create(HTMLElement.prototype);

  Object.defineProperties(formRowPrototype, {
    "inputElem": {
      get: function() {
        return this.ns.input;
      } 
    },
    "value": {
      get: function() {
        return this.ns.input.value;
      },
      set: function(newVal) {
        this.ns.input.value = newVal;
      } 
    },
    "name": {
      get: function() {
        return this.ns.input.name;
      }
    }
  });

  formRowPrototype.createdCallback = function() {

    this.ns = {};

    // the label
    var label = this.querySelectorAll("label")[0];
    if (!label) {
      label = document.createElement("label");
      var labelText = this.getAttribute("label");
      label.innerHTML = labelText;
    }
    this.appendChild(label);

    // the input
    this.ns.input  = this.querySelectorAll("input")[0];
    if (!this.ns.input) {
      this.ns.input = document.createElement("input");
      var inputType = this.getAttribute("type") || "text";
      var name = this.getAttribute("name");
      this.ns.input.setAttribute("type", inputType);
      this.ns.input.setAttribute("name", inputType);
    }
    label.appendChild(this.ns.input);

    // Save the input data on change
    delegate(this, "change", "input", function(e){
      var event = new CustomEvent("x-formrow-change", e);
      this.dispatchEvent(event);
    }.bind(this));
  };  

  document.registerElement('x-formrow', {
    prototype: formRowPrototype
  });

}());
