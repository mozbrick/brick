(function () {

  var requestAnimationFrame = window.requestAnimationFrame ||
                              window.webkitRequestAnimationFrame ||
                              function (fn) { setTimeout(fn, 16); };

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

  var skipTransition = function(element, fn, bind){
    element.style.webkitTransitionProperty = 'none';
    element.style.transitionProperty = 'none';
    var callback = fn ? fn.call(bind) : null;
    return requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        element.style.webkitTransitionProperty = '';
        element.style.transitionProperty = '';
        if (callback) {
          requestAnimationFrame(callback);
        }
      });
    });
  };

  function reveal(e) {
    var flipBox = e.currentTarget;
    if (this.parentNode === flipBox) {
      if (this.parentNode.firstElementChild === this) {
        flipBox.showFront();
      }
      else if (this.parentNode.lastElementChild === this) {
        flipBox.showBack();
      }
    }
  }

  var BrickFlipboxElementPrototype = Object.create(HTMLElement.prototype);

  BrickFlipboxElementPrototype.attachedCallback = function () {
    // reveal a side when reveal a reveal event is triggered on it.
    this.revealEventHandler = delegate("x-flipbox > *", reveal);
    this.addEventListener("reveal", this.revealEventHandler);

    // default to right.
    var direction = this.getAttribute('direction') || 'right';
    this.direction = direction;
    // instantiate sides without initial flip animation
    if (this.firstElementChild) {
      skipTransition(this.firstElementChild, function () {});
      // fire an flipend Event when the transition ended.
      // only on the first child do avoid firing twice
      this.transitionendEventHandler = function(e) {
        var flipBox = e.target.parentNode;
        var event = new CustomEvent('flipend', {'bubbles': true});
        flipBox.dispatchEvent(event);
        e.stopPropagation();
      };
      this.firstElementChild.addEventListener('transitionend', this.transitionendEventHandler);
    }
    if (this.lastElementChild) {
      skipTransition(this.lastElementChild, function () {});
    }
  };

  BrickFlipboxElementPrototype.detachedCallback = function () {
    // cleanup event listeners
    this.removeEventListener('reveal',this.revealEventHandler);
    if (this.firstElementChild && this.transitionendEventHandler) {
      this.firstElementChild.removeEventListener('transitionend',this.transitionendEventHandler);
    }
  };

  BrickFlipboxElementPrototype.attributeChangedCallback = function (attr, oldVal, newVal) {
    if (attr in attrs) {
      attrs[attr].call(this, oldVal, newVal);
    }
  };

  // Attribute handlers
  var attrs = {
    'direction': function (oldVal, newVal) {
      // Use the setter to update the _anim-direction as well.
      this.direction = newVal;
    }
  };

  // Custom methods
  BrickFlipboxElementPrototype.toggle = function() {
    var newFlippedState = !this.hasAttribute('flipped');
    if (newFlippedState) {
      this.setAttribute('flipped','');
    } else {
      this.removeAttribute('flipped');
    }
  };

  BrickFlipboxElementPrototype.showFront = function() {
    this.removeAttribute('flipped');
  };

  BrickFlipboxElementPrototype.showBack = function() {
    this.setAttribute ('flipped','');
  };

  // Property handlers
  Object.defineProperties(BrickFlipboxElementPrototype, {

    'flipped': {
      // The flipped state is only represented in the flipped attribute.
      get: function() {
        return this.hasAttribute('flipped');
      },
      set: function(newVal) {
        if (newVal) {
          this.setAttribute('flipped', newVal);
        } else {
          this.removeAttribute('flipped');
        }
      }
    },

    'direction': {
      get: function() {
        return this.getAttribute('direction');
      },
      set: function(newVal) {
        var self = this;
        // update the attribute if needed.
        if (self.setAttribute !== newVal) {
          self.setAttribute('direction', newVal);
        }
        // do skipTransition before setting the direction
        // with bot sides if we have sides.
        if (self.firstElementChild) {
          skipTransition(this.firstElementChild, function () {
            self.setAttribute('_anim-direction', newVal);
          });
          skipTransition(this.lastElementChild, function () {});
        } else {
          self.setAttribute('_anim-direction', newVal);
        }
      }
    }

  });

  // Register the element
  window.BrickFlipboxElement = document.registerElement('brick-flipbox', {
    prototype: BrickFlipboxElementPrototype
  });

})();
