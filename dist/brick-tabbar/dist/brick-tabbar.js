(function () {

  function _onTapbarTabClick(tabEl) {
    if (tabEl.parentNode.nodeName.toLowerCase() === 'brick-tabbar') {
      var targetEvent = tabEl.targetEvent;
      var target = tabEl.targetElement;
      target.dispatchEvent(new CustomEvent(targetEvent, {'bubbles': true}));
    }
  }

  var BrickTabbarTabElementPrototype = Object.create(HTMLElement.prototype);

  BrickTabbarTabElementPrototype.attachedCallback = function() {
    this.addEventListener('click', function(e) {
      var tabEl = e.currentTarget;
      _onTapbarTabClick(tabEl);
    });
    this.addEventListener('select', function(e) {
      var tabEl = e.currentTarget;
      _onTapbarTabClick(tabEl);
    });
  };

  BrickTabbarTabElementPrototype.select = function() {
    this.dispatchEvent(new CustomEvent('select', {
      'bubbles': true
    }));
  };

  Object.defineProperties(BrickTabbarTabElementPrototype, {
    'target': {
      get: function() {
        return this.getAttribute('target');
      },
      set: function(newVal) {
        this.setAttribute('target', newVal);
      }
    },
    'targetEvent': {
      get: function() {
        if (this.hasAttribute('target-event')) {
          return this.getAttribute('target-event');
        } else if (this.parentNode.nodeName.toLowerCase() === 'brick-tabbar') {
          return this.parentNode.targetEvent;
        } else {
          throw 'tabbar-tab is missing event to fire';
        }
      },
      set: function(newVal) {
        this.setAttribute('target-event', newVal);
      }
    },
    'targetElement': {
      get: function() {
        if (this.overrideElement) {
          return this.overrideElement;
        } else {
          return document.getElementById(this.target);
        }
      },
      set: function(newVal) {
        this.overrideElement = newVal;
        this.removeAttribute('target');
      }
    }
  });

  window.BrickTabbarTabElement = document.registerElement('brick-tabbar-tab', {
    prototype: BrickTabbarTabElementPrototype
  });

})();
;
/* global Platform */

(function () {

  var currentScript = document._currentScript || document.currentScript;

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

  function _selectTab(tabEl) {
    var tabbar = tabEl.parentNode;
    var activeTab = tabbar.querySelectorAll('brick-tabbar-tab[selected]');
    for (var i = 0; i < activeTab.length; i++) {
      activeTab[i].removeAttribute('selected');
    }
    tabEl.setAttribute('selected', true);

    // move the indicator
    var index = tabbar.tabs.indexOf(tabEl);
    var indicator = tabbar.selectedIndicator;

    if (tabbar.hasAttribute('vertical')) {
      indicator.style.transform = 'translateY(' + 100 * index + '%)';
    } else {
      indicator.style.transform = 'translateX(' + 100 * index + '%)';
    }
  }

  var BrickTabbarElementPrototype = Object.create(HTMLElement.prototype);

  BrickTabbarElementPrototype.createdCallback = function() {

    var importDoc = currentScript.ownerDocument;
    var template = importDoc.querySelector('#brick-tabbar-template');

    // fix styling for polyfill
    if (Platform.ShadowCSS) {
      var styles = template.content.querySelectorAll('style');
      for (var i = 0; i < styles.length; i++) {
        var style = styles[i];
        var cssText = Platform.ShadowCSS.shimStyle(style, 'brick-tabbar');
        Platform.ShadowCSS.addCssToDocument(cssText);
        style.remove();
      }
    }

    // create shadowRoot and append template to it.
    var shadowRoot = this.createShadowRoot();
    shadowRoot.appendChild(template.content.cloneNode(true));

    this.selectedIndicator = shadowRoot.querySelector('.selected-indicator');
    if (this.hasAttribute('vertical')) {
      this.selectedIndicator.style.height = 100 / this.tabs.length + '%';
    } else {
      this.selectedIndicator.style.width = 100 / this.tabs.length + '%';
    }
    this.selectHandler = delegate('brick-tabbar-tab', function(){
      _selectTab(this);
    });

    this.addEventListener('click', this.selectHandler);
    this.addEventListener('select', this.selectHandler);
  };

  BrickTabbarElementPrototype.detachedCallback = function() {
    this.removeEventListener('click', this.selectHandler);
    this.removeEventListener('select', this.selectHandler);
  };

  Object.defineProperties(BrickTabbarElementPrototype, {
    'targetEvent': {
      get: function() {
        return this.getAttribute('target-event') || 'reveal';
      },
      set: function(newVal) {
        this.setAttribute('target-event', newVal);
      }
    },
    'tabs': {
      get: function() {
        var tabList = this.querySelectorAll('brick-tabbar-tab');
        return Array.prototype.slice.call(tabList);
      }
    }
  });

  window.BrickTabbarElement = document.registerElement('brick-tabbar', {
    prototype: BrickTabbarElementPrototype
  });

})();
