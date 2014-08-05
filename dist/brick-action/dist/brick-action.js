(function () {

  var BrickActionElementPrototype = Object.create(HTMLElement.prototype);

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

  BrickActionElementPrototype.createdCallback = function () {
    this._ns = {};
  };

  BrickActionElementPrototype.attachedCallback = function () {
    setupHandler(this);
  };

  BrickActionElementPrototype.detachedCallback = function () {
    cleanupHandler(this);

  };

  BrickActionElementPrototype.attributeChangedCallback = function () {
    cleanupHandler(this);
    setupHandler(this);
  };

  window.BrickActionElement = document.registerElement('brick-action', {
    prototype: BrickActionElementPrototype
  });

})();
