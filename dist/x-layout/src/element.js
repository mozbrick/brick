(function () {

  function cleanupHandler(el) {
    var pair = el._ns.listener;
    if (pair[0]) {
      pair[0].removeEventListener(pair[1], pair[2]);
    }
  }

  function makeHandler(method, target) {
    return function(e) {
      var data = e.detail;
      if (method in target && typeof target[method] === 'function') {
        target[method](data);
      }
    };
  }

  function setupHandler(el) {
    var source = el.getAttribute('source');
    var trigger = el.getAttribute('trigger') || 'click';
    var action = el.getAttribute('action');
    var target = el.getAttribute('target');
    var sourceEl;
    if (!action || !target) {
      return;
    }
    var targetEl = document.getElementById(target);
    if (!targetEl) {
      return;
    }
    if (source) {
      sourceEl = document.getElementById(source);
    }
    if (!sourceEl) {
      sourceEl = el;
    }
    var listener = makeHandler(action, targetEl);
    el._ns.listener = [sourceEl, trigger, listener];
    sourceEl.addEventListener(trigger, listener);
  }

  var XActionPrototype = Object.create(HTMLElement.prototype);

  // Lifecycle methods

  XActionPrototype.createdCallback = function () {
    this._ns = {};
  };

  XActionPrototype.attachedCallback = function () {
    setupHandler(this);
  };

  XActionPrototype.detachedCallback = function () {
    cleanupHandler(this);
  };

  XActionPrototype.attributeChangedCallback = function () {
    cleanupHandler(this);
    setupHandler(this);
  };

  // Register the element

  window.XAction = document.registerElement('custom-element', {
    prototype: XActionPrototype
  });

})();
