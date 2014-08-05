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
;
/* global Platform */
(function () {

  var currentScript = document._currentScript || document.currentScript;

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

  var skipFrame = function(fn){
    requestAnimationFrame(function(){ requestAnimationFrame(fn); });
  };

  var sides = {
        next: ['nextElementSibling', 'firstElementChild'],
        previous: ['previousElementSibling', 'lastElementChild']
      };

  function indexOfCard(deck, card){
    return Array.prototype.indexOf.call(deck.children, card);
  }

  function getCard(deck, item){
    if (item && item.nodeName) {
      return item;
    } else {
      if (isNaN(item)) {
        return deck.querySelector(item);
      } else {
        return deck.children[item];
      }
    }
  }


  var card = document.createElement('brick-card');
  //ensure the children is a brick-card (or wraps it with one)
  function ensureIsCard(child){
    if(child.tagName !== 'BRICK-CARD'){
      var wrap = card.cloneNode();
      child.parentNode.replaceChild(wrap, child);
      wrap.appendChild(child);
    }
  }
  // check if a card is a card in a deck
  function checkCard(deck, card){
    return card &&
           deck === card.parentNode &&
           card.nodeName.toLowerCase() === 'brick-card';
  }

  function shuffle(deck, side, direction){
    var getters = sides[side];
    var selected = deck.selectedCard && deck.selectedCard[getters[0]];

    if (selected) {
      deck.showCard(selected, {'direction': direction});
    } else if (deck.loop || deck.selectedIndex === -1) {
      deck.showCard(deck[getters[1]], {'direction': direction});
    }
  }

  var BrickDeckElementPrototype = Object.create(HTMLElement.prototype);

  BrickDeckElementPrototype.createdCallback = function() {
    this.ns = {};
    var children = this.children, i, max;

    for(i=0, max=children.length; i<max; i++){
      ensureIsCard(children[i]);
    }

    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        var added = mutation.addedNodes || [];
        for(var i=0, max=added.length; i<max; i++){
          ensureIsCard(added[i]);
        }
      });
    });

    observer.observe(this, { childList: true });
  };

  BrickDeckElementPrototype.attachedCallback = function() {

    var importDoc = currentScript.ownerDocument;
    var template = importDoc.querySelector('template');

    // fix styling for polyfill
    if (Platform.ShadowCSS) {
      var styles = template.content.querySelectorAll('style');
      for (var i = 0; i < styles.length; i++) {
        var style = styles[i];
        var cssText = Platform.ShadowCSS.shimStyle(style, 'brick-deck');
        Platform.ShadowCSS.addCssToDocument(cssText);
        style.remove();
      }
    }

    // create shadowRoot and append template to it.
    var shadowRoot = this.createShadowRoot();
    shadowRoot.appendChild(template.content.cloneNode(true));

    this.revealHandler = delegate('brick-card', function(e) {
      e.currentTarget.showCard(this);
    });
    this.addEventListener('reveal', this.revealHandler);
  };

  BrickDeckElementPrototype.detachedCallback = function() {
    this.removeEventListener('reveal', this.revealHandler);
  };

  BrickDeckElementPrototype.attributeChangedCallback = function (attr, oldVal, newVal) {
    if (attr in attrs) {
      attrs[attr].call(this, oldVal, newVal);
    }
  };

  var attrs = {
    'selected-index': function (oldVal, newVal) {
      var index = parseInt(newVal);
      if (!isNaN(index)  && this.cards[index] !== this.selectedCard) {
        this.showCard(index);
      }
    }
  };

  BrickDeckElementPrototype.nextCard = function(direction){
    shuffle(this, 'next', direction);
  };

  BrickDeckElementPrototype.previousCard = function(direction){
    shuffle(this, 'previous', direction);
  };

  BrickDeckElementPrototype.showCard = function(item, options){
    options = options || {};
    var direction = options.direction;
    var skipTransition = options.skipTransition;
    var card = getCard(this, item);
    if (!checkCard(this, card) || (card === this.selectedCard)) {
      return;
    }
    var selectedCard = this.ns.selectedCard;
    var currentIndex = indexOfCard(this, selectedCard);
    var nextIndex = indexOfCard(this, card);
    if (!direction) {
      direction = nextIndex > currentIndex ? 'forward' : 'reverse';
      // if looping is turned on, check if the other way round is shorter
      if (this.loop) {
        // the distance between two cards
        var dist = nextIndex - currentIndex;
        // the distance between two cards when skipping over the end of the deck
        var distLooped = this.cards.length - Math.max(nextIndex,currentIndex) + Math.min(nextIndex,currentIndex);
        // set the direction if the looped way is shorter
        if (Math.abs(distLooped) < Math.abs(dist)) {
          direction = nextIndex < currentIndex ? 'forward' : 'reverse';
        }
      }
    }
    // hide the old card
    if (selectedCard) { this.hideCard(selectedCard, direction); }
    this.ns.selectedCard = card;
    this.ns.selectedIndex = nextIndex;
    this.setAttribute("selected-index", nextIndex);
    if (!card.selected) { card.selected = true; }
    card.removeAttribute("hide"); // be safe
    var hasTransition = card.hasAttribute('transition-type') || this.hasAttribute('transition-type');
    if (!skipTransition && hasTransition) {
      // set attributes, set transitionend listener, skip a frame set transition attribute
      card.setAttribute('transition-direction', direction);
      var transitionendHandler = function() {
        card.dispatchEvent(new CustomEvent('show',{'bubbles': true}));
        card.removeEventListener('transitionend', transitionendHandler);
      };
      card.addEventListener('transitionend', transitionendHandler);
      skipFrame(function(){ card.setAttribute('transition', ''); });
    } else {
      card.dispatchEvent(new CustomEvent('show',{'bubbles': true}));
      if (hasTransition) {
        card.setAttribute('transition', '');
      }
    }
  };

  BrickDeckElementPrototype.hideCard = function(item, direction){
    var card = getCard(this, item);
    if (!checkCard(this, card) || (card !== this.selectedCard)) {
      return;
    }
    this.ns.selectedCard = null;
    if (card.selected) { card.selected = false; }
    var hasTransition = card.hasAttribute('transition-type') || this.hasAttribute('transition-type');
    if (hasTransition) {
      // set attributes, set transitionend listener, skip a frame set transition attribute
      var transitionendHandler = function() {
        card.removeAttribute('hide');
        card.removeAttribute('transition');
        card.removeAttribute('transition-direction');
        card.dispatchEvent(new CustomEvent('hide',{'bubbles': true}));
        card.removeEventListener('transitionend', transitionendHandler);
      };
      card.addEventListener('transitionend', transitionendHandler);
      skipFrame(function(){
        card.setAttribute('transition-direction', direction || 'reverse');
        card.setAttribute('hide', '');
      });
    } else {
      card.dispatchEvent(new CustomEvent('hide',{'bubbles': true}));
    }
  };


  // Property handlers
  Object.defineProperties(BrickDeckElementPrototype, {
    'loop': {
      get: function() {
        return this.hasAttribute('loop');
      },
      set: function(newVal) {
        if (newVal) {
          this.setAttribute('loop', newVal);
        } else {
          this.removeAttribute('loop');
        }
      }
    },
    'cards': {
      get: function () {
        var cardList = this.querySelectorAll("brick-card");
        return Array.prototype.slice.call(cardList);
      }
    },
    'selectedCard': {
      get: function() {
        return this.ns.selectedCard || null;
      }
    },
    'selectedIndex': {
      get: function() {
        return this.hasAttribute('selected-index') ? Number(this.getAttribute('selected-index')) : -1;
      },
      set: function(value) {
        var index = Number(value);
        var card = this.cards[index];
        if (card) {
          if (card !== this.ns.selectedCard) {
            this.showCard(card);
          }
        } else {
          this.removeAttribute('selected-index');
          if (this.ns.selectedCard) {
            this.hideCard(this.ns.selectedCard);
          }
        }
      }
    },
    'transitionType': {
      get: function() {
        return this.getAttribute('transition-type');
      },
      set: function(newVal) {
        this.setAttribute('transition-type', newVal);
      }
    }
  });

  // Register the element
  window.BrickDeckElement = document.registerElement('brick-deck', {
    prototype: BrickDeckElementPrototype
  });

})();
