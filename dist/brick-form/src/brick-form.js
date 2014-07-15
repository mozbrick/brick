(function () {
  var BrickFormElementPrototype = Object.create(HTMLElement.prototype);

  BrickFormElementPrototype.attachedCallback = function () {
    var self = this;

    // wrap everuthing inside a form
    self.form = document.createElement('form');

    var children = Array.prototype.slice.call(self.childNodes);
    for (var i = 0; i < children.length; i++) {
      self.form.appendChild(children[i]);
    }
    self.appendChild(self.form);

    // use querySelector because form.elements
    // does not work in chrome
    self.inputElements = self.querySelectorAll("input, select");

    if (self.autosave) {
      self.form.addEventListener("change", function(){
        self.saveFormData();
      });
    }

    self.form.addEventListener("submit", function(e){
      e.preventDefault();
      self.saveFormData();
    });

    self.loadFormData();
  };

  BrickFormElementPrototype.attributeChangedCallback = function (attr, oldVal, newVal) {
    if (attr in attrs) {
      attrs[attr].call(this, oldVal, newVal);
    }
  };

  var attrs = {
    'name': function () {
      this.loadFormData();
    }
  };

  BrickFormElementPrototype.loadFormData = function () {
    var self = this;
    self.storage.get(self.name).then(function(data){
      for (var i = 0; i < self.elements.length; i++) {
        var element = self.elements[i];
        if (element.name) {
          var val = data ? data[element.name] || "" : "";
          if (element.type === "checkbox") {
            element.checked = !!val;
          } else {
            element.value = val;
          }
        }
      }
    });
  };

  BrickFormElementPrototype.saveFormData = function () {
    var self = this;
    var data = {};
    data[self.keyname] = self.name;
    for (var i = 0; i < self.elements.length; i++) {
      var input = self.elements[i];
      if (input.name) {
        var key = input.name;
        var value = input.value;
        if (input.type === "checkbox") {
          value = input.checked;
        }
        data[key] = value;
      }
    }
    return self.storage.set(data);
  };

  // Property handlers
  Object.defineProperties(BrickFormElementPrototype, {
    'name': {
      get: function () {
        return this.getAttribute("name");
      },
      set: function (newVal) {
        this.setAttribute("name", newVal);
      }
    },
    'autosave': {
      get: function () {
        return this.hasAttribute("autosave");
      },
      set: function (newVal) {
        if (newVal) {
          this.setAttribute("autosave", newVal);
        } else {
          this.removeAttribute("autosave");
        }
      }
    },
    'storage': {
      get: function () {
        return document.getElementById(this.getAttribute("storage"));
      }
    },
    'elements': {
      get: function() {
        return this.inputElements;
      }
    },
    'keyname': {
      get: function() {
        return this.storage.getAttribute("keyname");
      }
    }
  });

  // Register the element
  window.BrickFormElement = document.registerElement('brick-form', {
    prototype: BrickFormElementPrototype
  });

})();
