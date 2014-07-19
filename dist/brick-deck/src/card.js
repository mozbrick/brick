(function () {

  var BrickCardElementPrototype = Object.create(HTMLElement.prototype);

  BrickCardElementPrototype.createdCallback = function () {
    this.ns = {};
  };

  BrickCardElementPrototype.attachedCallback = function () {
    var deck = this.parentNode;
    if (deck.nodeName.toLowerCase() === 'brick-deck') {
      this.ns.deck = deck;
      if (this !== deck.selectedCard && this.selected) {
        deck.showCard(this, {'skipTransition':true});
      }
    }
  };

  BrickCardElementPrototype.detachedCallback = function () {
    var deck = this.ns.deck;
    if (deck) {
      if (this === deck.selectedCard) {
        deck.selectedCard = null;
        deck.removeAttribute('selected-index');
      }
      this.ns.deck = null;
    }
  };

  BrickCardElementPrototype.attributeChangedCallback = function (attr, oldVal, newVal) {
    if (attr in attrs) {
      attrs[attr].call(this, oldVal, newVal);
    }
  };

  // Attribute handlers
  var attrs = {
    'selected': function (oldVal, newVal) {
      var deck = this.ns.deck;
      if (!deck) { return; }
      // check for null because empty string is true
      // for our booleon attribute
      if (newVal !== null) {
        if (this !== deck.selectedCard) { deck.showCard(this); }
      } else {
        if (this === deck.selectedCard) { deck.hideCard(this); }
      }
    },
  };

  BrickCardElementPrototype.reveal = function() {
    this.dispatchEvent(new CustomEvent("reveal",{bubbles: true}));
  };

  // Property handlers
  Object.defineProperties(BrickCardElementPrototype, {
    'selected': {
      get : function () {
        return this.hasAttribute('selected');
      },
      set : function (newVal) {
        if (newVal) {
          this.setAttribute('selected','');
        } else {
          this.removeAttribute('selected');
        }
      }
    },
    'transitionType': {
      get: function() {
        return this.getAttribute("transition-type");
      },
      set: function(newVal) {
        this.setAttribute("transition-type", newVal);
      }
    }
  });

  // Register the element
  window.BrickCardElement = document.registerElement('brick-card', {
    prototype: BrickCardElementPrototype
  });

})();
