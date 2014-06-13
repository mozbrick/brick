(function () {

  document.webComponentsReady = new Promise(function (resolve, reject) {
    document.addEventListener('WebComponentsReady', function (){
      resolve();
    });
  });

  var XFormPrototype = Object.create(HTMLElement.prototype);

  // Lifecycle methods
  XFormPrototype.createdCallback = function () {
    var self = this;

    // self.inputs = self.elements;
    self.inputs = this.querySelectorAll("input, select");

    self.storage = document.getElementById(self.getAttribute("storage"));

    self.settings = {};
    self.settings.name = this.getAttribute("name") || "x-form";
    self.settings.autosave = Boolean(self.getAttribute("autosave"));
    self.settings.key = self.storage.getAttribute("key");

    // populate the form from storage
    document.webComponentsReady.then(function(){
      self.populateForm();
    });

    if (self.hasAttribute("autosave")) {
      self.addEventListener("change", function(e){
        self.saveFormData(e.target);
      });
    }

    self.addEventListener("submit", function(e){
      e.preventDefault();
      self.saveFormData();
    });
  };

  XFormPrototype.attachedCallback = function () {

  };

  XFormPrototype.detachedCallback = function () {

  };

  XFormPrototype.attributeChangedCallback = function (attr, oldVal, newVal) {
    if (attr in attrs) {
      attrs[attr].call(this, oldVal, newVal);
    }
  };

  // Custom methods
  XFormPrototype.saveFormData = function () {
    var self = this;
    var data = {};
    data[self.settings.key] = self.settings.name;
    for (var i = 0; i < self.inputs.length; i++) {
      var input = self.inputs[i];
      var key = input.name;
      var value = input.value;
      if (input.type === "checkbox") {
        value = input.checked;
      }
      data[key] = value;
    }
    return self.storage.set(data).then(function(name){
      console.info("x-form:saved formdata", name, data);
    });
  };

  XFormPrototype.loadFormData = function() {
    var self = this;
    return self.storage.get(self.settings.name).then(function(data){
      console.info("x-form:loaded:data", data);
      return data;
    });
  };

  XFormPrototype.populateForm = function() {
    var self = this;
    var formValuePromise = self.loadFormData();
    formValuePromise.then(function(formData){
      for (var i = 0; i < self.inputs.length; i++) {
        var input = self.inputs[i];
        var val = formData ? formData[input.name] || "" : "";
        if (input.type === "checkbox") {
          input.checked = val;
        } else {
          input.value = val;
        }
      }
    });
  };

  // Attribute handlers
  var attrs = {
    'name': function (oldVal, newVal) {
      // set the internal value directly to not change the attribute again.
      console.log("name attr change");
      this.settings.name = newVal;
    }
  };

  // Property handlers
  Object.defineProperties(XFormPrototype, {
    "name": {
      get: function() {
        return this.settings.name;
      },
      set: function(newVal) {
        console.info("x-form:namechange");
        this.settings.name = newVal;
        this.setAttribute("name",newVal);
        this.populateForm();
      }
    }
  });

  // Register the element
  window.XForm = document.registerElement('x-form', {
    prototype: XFormPrototype,
    extends: 'form'
  });

})();
