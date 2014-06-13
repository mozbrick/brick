(function () {

  var prefix = (function () {
    var styles = window.getComputedStyle(document.documentElement, ''),
        pre = (Array.prototype.slice
          .call(styles)
          .join('')
          .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
        )[1];
    return {
      dom: pre == 'ms' ? 'MS' : pre,
      lowercase: pre,
      css: '-' + pre + '-',
      js: pre == 'ms' ? pre : pre[0].toUpperCase() + pre.substr(1)
    };
  })();

  var requestFrame = (function(){
    var raf = window.requestAnimationFrame ||
              window[prefix.lowercase + 'RequestAnimationFrame'] ||
              function(fn){ return window.setTimeout(fn, 20); };
    return function(fn){ return raf(fn); };
  })();

  var skipTransition = function(element, fn, bind){
    var prop = prefix.js + 'TransitionProperty';
    element.style[prop] = element.style.transitionProperty = 'none';
    var callback = fn ? fn.call(bind) : null;
    return requestFrame(function(){
      requestFrame(function(){
        element.style[prop] = element.style.transitionProperty = '';
        if (callback) {
          requestFrame(callback);
        }
      });
    });
  };

  var FlipboxPrototype = Object.create(HTMLElement.prototype);

  FlipboxPrototype.createdCallback = function () {
    this.ns = {};
    this.flipped = this.hasAttribute("flipped") ? true : false;
    this.direction = this.getAttribute("direction");
    // instantiate sides without initial flip animation
    if (this.firstElementChild) {
      skipTransition(this.firstElementChild, function () {});
    }
    if (this.lastElementChild) {
      skipTransition(this.lastElementChild, function () {});
    }
    // fire an flipend Event when the transition ended.
    this.firstElementChild.addEventListener("transitionend", function(e) {
      var flipBox = e.target.parentNode;
      var event = new Event("flipend");
      flipBox.dispatchEvent(event);
      e.stopPropagation();
    });
  };

  FlipboxPrototype.attributeChangedCallback = function (attr, oldVal, newVal) {
    if (attr in attrs) {
      attrs[attr].call(this, oldVal, newVal);
    }
  };

  // Custom methods
  FlipboxPrototype.toggle = function() {
    this.flipped = !this.flipped;
  };

  FlipboxPrototype.showFront = function() {
    this.flipped = false;
  };

  FlipboxPrototype.showBack = function() {
    this.flipped = true;
  };

  // Attribute handlers
  var attrs = {
    // Prevent attributes and properties from going out of sync when
    // the attribute is manually changed.
    'flipped': function (oldVal, newVal) {
      // Set internal value directly to not set the attribute again.
      this.ns._flipped = newVal;
    },
    'direction': function (oldVal, newVal) {
      // Use the setter to update the _anim-direction as well.
      this.direction = newVal;
    }
  };

  // Property handlers
  Object.defineProperties(FlipboxPrototype, {

    'flipped': {
      get: function() {
        return this.ns._flipped;
      },
      set: function(newVal) {
        this.ns._flipped = newVal;
        if (newVal) {
          this.setAttribute('flipped', newVal);
        } else {
          this.removeAttribute('flipped');
        }
      }
    },

    'direction': {
      get: function() {
        return this.ns._direction;
      },
      set: function(newVal) {
        // default to left
        var val = newVal || "left";
        // set animation direction attribute and skip any transition
        var self = this;
        skipTransition(this.firstElementChild, function () {
          self.setAttribute('_anim-direction', val);
        });
        this.ns._direction = val;
      }
    }

  });

  // Register the element
  window.XFlipbox = document.registerElement('x-flipbox', {
    prototype: FlipboxPrototype
  });

})();
