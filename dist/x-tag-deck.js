(function() {
    var BEFORE_ANIM_ATTR = "_before-animation";
    function HistoryStack(validatorFn, itemCap) {
        this._historyStack = [];
        this.currIndex = -1;
        this._itemCap = undefined;
        this.itemCap = itemCap;
        this._validatorFn = validatorFn ? validatorFn : function() {
            return true;
        };
    }
    var HISTORYSTACK_PROTOTYPE = HistoryStack.prototype;
    HISTORYSTACK_PROTOTYPE.pushState = function(newState) {
        if (this.canRedo) {
            this._historyStack.splice(this.currIndex + 1, this._historyStack.length - (this.currIndex + 1));
        }
        this._historyStack.push(newState);
        this.currIndex = this._historyStack.length - 1;
        this.sanitizeStack();
        if (this._itemCap !== "none" && this._historyStack.length > this._itemCap) {
            var len = this._historyStack.length;
            this._historyStack.splice(0, len - this._itemCap);
            this.currIndex = this._historyStack.length - 1;
        }
    };
    HISTORYSTACK_PROTOTYPE.sanitizeStack = function() {
        var validatorFn = this._validatorFn;
        var lastValidState;
        var i = 0;
        while (i < this._historyStack.length) {
            var state = this._historyStack[i];
            if (state !== lastValidState && validatorFn(state)) {
                lastValidState = state;
                i++;
            } else {
                this._historyStack.splice(i, 1);
                if (i <= this.currIndex) {
                    this.currIndex--;
                }
            }
        }
    };
    HISTORYSTACK_PROTOTYPE.forwards = function() {
        if (this.canRedo) {
            this.currIndex++;
        }
        this.sanitizeStack();
    };
    HISTORYSTACK_PROTOTYPE.backwards = function() {
        if (this.canUndo) {
            this.currIndex--;
        }
        this.sanitizeStack();
    };
    Object.defineProperties(HISTORYSTACK_PROTOTYPE, {
        DEFAULT_CAP: {
            value: 10
        },
        itemCap: {
            get: function() {
                return this._itemCap;
            },
            set: function(newCap) {
                if (newCap === undefined) {
                    this._itemCap = this.DEFAULT_CAP;
                } else if (newCap === "none") {
                    this._itemCap = "none";
                } else {
                    var num = parseInt(newCap, 10);
                    if (isNaN(newCap) || newCap <= 0) {
                        throw "attempted to set invalid item cap: " + newCap;
                    }
                    this._itemCap = num;
                }
            }
        },
        canUndo: {
            get: function() {
                return this.currIndex > 0;
            }
        },
        canRedo: {
            get: function() {
                return this.currIndex < this._historyStack.length - 1;
            }
        },
        numStates: {
            get: function() {
                return this._historyStack.length;
            }
        },
        currState: {
            get: function() {
                var index = this.currIndex;
                if (0 <= index && index < this._historyStack.length) {
                    return this._historyStack[index];
                }
                return null;
            }
        }
    });
    function getDurationStr(elem) {
        var style = window.getComputedStyle(elem);
        var browserDurationName = xtag.prefix.js + "TransitionDuration";
        if (style.transitionDuration) {
            return style.transitionDuration;
        } else {
            return style[browserDurationName];
        }
    }
    function durationStrToMs(str) {
        if (typeof str !== typeof "") {
            return 0;
        }
        var reg = /^(\d*\.?\d+)(m?s)$/;
        var matchInfo = str.toLowerCase().match(reg);
        if (matchInfo) {
            var strVal = matchInfo[1];
            var unit = matchInfo[2];
            var val = parseFloat(strVal);
            if (isNaN(val)) {
                throw "value error";
            }
            if (unit === "s") {
                return val * 1e3;
            } else if (unit === "ms") {
                return val;
            } else {
                throw "unit error";
            }
        } else {
            return 0;
        }
    }
    function posModulo(x, divisor) {
        return (x % divisor + divisor) % divisor;
    }
    function _getAllCards(elem) {
        return xtag.queryChildren(elem, "x-card");
    }
    function _getCardAt(deck, targetIndex) {
        var cards = _getAllCards(deck);
        return isNaN(parseInt(targetIndex, 10)) || targetIndex < 0 || targetIndex >= cards.length ? null : cards[targetIndex];
    }
    function _getCardIndex(deck, card) {
        var allCards = _getAllCards(deck);
        return allCards.indexOf(card);
    }
    function _animateCardReplacement(deck, oldCard, newCard, cardAnimName, isReverse) {
        deck.xtag._selectedCard = newCard;
        var animTimeStamp = new Date();
        deck.xtag._lastAnimTimestamp = animTimeStamp;
        var _onComplete = function() {
            if (animTimeStamp === deck.xtag._lastAnimTimestamp) {
                _sanitizeCardAttrs(deck);
                xtag.fireEvent(deck, "shuffleend", {
                    detail: {
                        oldCard: oldCard,
                        newCard: newCard
                    }
                });
            }
        };
        if (newCard === oldCard) {
            _onComplete();
            return;
        }
        var oldCardAnimReady = false;
        var newCardAnimReady = false;
        var animationStarted = false;
        var _attemptBeforeCallback = function() {
            if (oldCardAnimReady && newCardAnimReady) {
                _getAllCards(deck).forEach(function(card) {
                    card.removeAttribute("selected");
                    card.removeAttribute("leaving");
                });
                oldCard.setAttribute("leaving", true);
                newCard.setAttribute("selected", true);
                deck.xtag._selectedCard = newCard;
                deck.selectedIndex = _getCardIndex(deck, newCard);
                if (isReverse) {
                    oldCard.setAttribute("reverse", true);
                    newCard.setAttribute("reverse", true);
                }
                xtag.fireEvent(deck, "shufflestart", {
                    detail: {
                        oldCard: oldCard,
                        newCard: newCard
                    }
                });
            }
        };
        var _attemptAnimation = function() {
            if (animationStarted) {
                return;
            }
            if (!(oldCardAnimReady && newCardAnimReady)) {
                return;
            }
            _doAnimation();
        };
        var _doAnimation = function() {
            animationStarted = true;
            var oldCardDone = false;
            var newCardDone = false;
            var animationComplete = false;
            var onTransitionComplete = function(e) {
                if (animationComplete) {
                    return;
                }
                if (e.target === oldCard) {
                    oldCardDone = true;
                    oldCard.removeEventListener("transitionend", onTransitionComplete);
                } else if (e.target === newCard) {
                    newCardDone = true;
                    newCard.removeEventListener("transitionend", onTransitionComplete);
                }
                if (oldCardDone && newCardDone) {
                    animationComplete = true;
                    _onComplete();
                }
            };
            oldCard.addEventListener("transitionend", onTransitionComplete);
            newCard.addEventListener("transitionend", onTransitionComplete);
            var oldDuration = durationStrToMs(getDurationStr(oldCard));
            var newDuration = durationStrToMs(getDurationStr(newCard));
            var maxDuration = Math.max(oldDuration, newDuration);
            var waitMultiplier = 1.15;
            var timeoutDuration = cardAnimName.toLowerCase() === "none" ? 0 : Math.ceil(maxDuration * waitMultiplier);
            if (timeoutDuration === 0) {
                animationComplete = true;
                oldCard.removeEventListener("transitionend", onTransitionComplete);
                newCard.removeEventListener("transitionend", onTransitionComplete);
                oldCard.removeAttribute(BEFORE_ANIM_ATTR);
                newCard.removeAttribute(BEFORE_ANIM_ATTR);
                _onComplete();
            } else {
                oldCard.removeAttribute(BEFORE_ANIM_ATTR);
                newCard.removeAttribute(BEFORE_ANIM_ATTR);
                window.setTimeout(function() {
                    if (animationComplete) {
                        return;
                    }
                    animationComplete = true;
                    oldCard.removeEventListener("transitionend", onTransitionComplete);
                    newCard.removeEventListener("transitionend", onTransitionComplete);
                    _onComplete();
                }, timeoutDuration);
            }
        };
        xtag.skipTransition(oldCard, function() {
            oldCard.setAttribute("card-anim-type", cardAnimName);
            oldCard.setAttribute(BEFORE_ANIM_ATTR, true);
            oldCardAnimReady = true;
            _attemptBeforeCallback();
            return _attemptAnimation;
        }, this);
        xtag.skipTransition(newCard, function() {
            newCard.setAttribute("card-anim-type", cardAnimName);
            newCard.setAttribute(BEFORE_ANIM_ATTR, true);
            newCardAnimReady = true;
            _attemptBeforeCallback();
            return _attemptAnimation;
        }, this);
    }
    function _replaceCurrCard(deck, newCard, transitionType, progressType, ignoreHistory) {
        var oldCard = deck.xtag._selectedCard;
        if (oldCard === newCard) {
            var eDetail = {
                detail: {
                    oldCard: oldCard,
                    newCard: newCard
                }
            };
            xtag.fireEvent(deck, "shufflestart", eDetail);
            xtag.fireEvent(deck, "shuffleend", eDetail);
            return;
        }
        _sanitizeCardAttrs(deck);
        if (transitionType === undefined) {
            transitionType = "none";
        }
        var isReverse;
        switch (progressType) {
          case "forward":
            isReverse = false;
            break;

          case "reverse":
            isReverse = true;
            break;

          default:
            if (!oldCard) {
                isReverse = false;
            }
            var allCards = _getAllCards(deck);
            if (allCards.indexOf(newCard) < allCards.indexOf(oldCard)) {
                isReverse = true;
            } else {
                isReverse = false;
            }
            break;
        }
        if (newCard.hasAttribute("transition-override")) {
            transitionType = newCard.getAttribute("transition-override");
        }
        if (!ignoreHistory) {
            deck.xtag.history.pushState(newCard);
        }
        _animateCardReplacement(deck, oldCard, newCard, transitionType, isReverse);
    }
    function _replaceWithIndex(deck, targetIndex, transitionType, progressType) {
        var newCard = _getCardAt(deck, targetIndex);
        if (!newCard) {
            throw "no card at index " + targetIndex;
        }
        _replaceCurrCard(deck, newCard, transitionType, progressType);
    }
    function _sanitizeCardAttrs(deck) {
        if (!deck.xtag._initialized) {
            return;
        }
        var cards = _getAllCards(deck);
        var currCard = deck.xtag._selectedCard;
        if (!currCard || currCard.parentNode !== deck) {
            if (cards.length > 0) {
                if (deck.xtag.history && deck.xtag.history.numStates > 0) {
                    currCard = deck.xtag.history.currState;
                } else {
                    currCard = cards[0];
                }
            } else {
                currCard = null;
            }
        }
        cards.forEach(function(card) {
            card.removeAttribute("leaving");
            card.removeAttribute(BEFORE_ANIM_ATTR);
            card.removeAttribute("card-anim-type");
            card.removeAttribute("reverse");
            if (card !== currCard) {
                card.removeAttribute("selected");
            } else {
                card.setAttribute("selected", true);
            }
        });
        deck.xtag._selectedCard = currCard;
        deck.selectedIndex = _getCardIndex(deck, currCard);
    }
    xtag.register("x-deck", {
        lifecycle: {
            created: function() {
                var self = this;
                self.xtag._initialized = true;
                var _historyValidator = function(card) {
                    return card.parentNode === self;
                };
                self.xtag.history = new HistoryStack(_historyValidator, HistoryStack.DEFAULT_CAP);
                self.xtag._selectedCard = self.xtag._selectedCard ? self.xtag._selectedCard : null;
                self.xtag._lastAnimTimestamp = null;
                self.xtag.transitionType = "scrollLeft";
                var initCard = self.getCardAt(self.getAttribute("selected-index"));
                if (initCard) {
                    self.xtag._selectedCard = initCard;
                }
                _sanitizeCardAttrs(self);
                var currCard = self.xtag._selectedCard;
                if (currCard) {
                    self.xtag.history.pushState(currCard);
                }
            }
        },
        events: {
            "show:delegate(x-card)": function() {
                var card = this;
                card.show();
            }
        },
        accessors: {
            transitionType: {
                attribute: {
                    name: "transition-type"
                },
                get: function() {
                    return this.xtag.transitionType;
                },
                set: function(newType) {
                    this.xtag.transitionType = newType;
                }
            },
            selectedIndex: {
                attribute: {
                    skip: true,
                    name: "selected-index"
                },
                get: function() {
                    return _getCardIndex(this, this.xtag._selectedCard);
                },
                set: function(newIndex) {
                    if (this.selectedIndex !== newIndex) {
                        _replaceWithIndex(this, newIndex, "none");
                    }
                    this.setAttribute("selected-index", newIndex);
                }
            },
            historyCap: {
                attribute: {
                    name: "history-cap"
                },
                get: function() {
                    return this.xtag.history.itemCap;
                },
                set: function(itemCap) {
                    this.xtag.history.itemCap = itemCap;
                }
            },
            numCards: {
                get: function() {
                    return this.getAllCards().length;
                }
            },
            currHistorySize: {
                get: function() {
                    return this.xtag.history.numStates;
                }
            },
            currHistoryIndex: {
                get: function() {
                    return this.xtag.history.currIndex;
                }
            },
            cards: {
                get: function() {
                    return this.getAllCards();
                }
            },
            selectedCard: {
                get: function() {
                    return this.getSelectedCard();
                }
            }
        },
        methods: {
            shuffleTo: function(index, progressType) {
                var targetCard = _getCardAt(this, index);
                if (!targetCard) {
                    throw "invalid shuffleTo index " + index;
                }
                var transitionType = this.xtag.transitionType;
                _replaceWithIndex(this, index, transitionType, progressType);
            },
            shuffleNext: function(progressType) {
                progressType = progressType ? progressType : "auto";
                var cards = _getAllCards(this);
                var currCard = this.xtag._selectedCard;
                var currIndex = cards.indexOf(currCard);
                if (currIndex > -1) {
                    this.shuffleTo(posModulo(currIndex + 1, cards.length), progressType);
                }
            },
            shufflePrev: function(progressType) {
                progressType = progressType ? progressType : "auto";
                var cards = _getAllCards(this);
                var currCard = this.xtag._selectedCard;
                var currIndex = cards.indexOf(currCard);
                if (currIndex > -1) {
                    this.shuffleTo(posModulo(currIndex - 1, cards.length), progressType);
                }
            },
            getAllCards: function() {
                return _getAllCards(this);
            },
            getSelectedCard: function() {
                return this.xtag._selectedCard;
            },
            getCardIndex: function(card) {
                return _getCardIndex(this, card);
            },
            getCardAt: function(index) {
                return _getCardAt(this, index);
            },
            historyBack: function(progressType) {
                var history = this.xtag.history;
                if (history.canUndo) {
                    history.backwards();
                    var newCard = history.currState;
                    if (newCard) {
                        _replaceCurrCard(this, newCard, this.transitionType, progressType, true);
                    }
                }
            },
            historyForward: function(progressType) {
                var history = this.xtag.history;
                if (history.canRedo) {
                    history.forwards();
                    var newCard = history.currState;
                    if (newCard) {
                        _replaceCurrCard(this, newCard, this.transitionType, progressType, true);
                    }
                }
            }
        }
    });
    xtag.register("x-card", {
        lifecycle: {
            inserted: function() {
                var self = this;
                var deckContainer = self.parentNode;
                if (deckContainer) {
                    if (deckContainer.tagName.toLowerCase() === "x-deck") {
                        _sanitizeCardAttrs(deckContainer);
                        self.xtag.parentDeck = deckContainer;
                        xtag.fireEvent(deckContainer, "cardadd", {
                            detail: {
                                card: self
                            }
                        });
                    }
                }
            },
            created: function() {
                var deckContainer = this.parentNode;
                if (deckContainer && deckContainer.tagName.toLowerCase() === "x-deck") {
                    this.xtag.parentDeck = deckContainer;
                }
            },
            removed: function() {
                var self = this;
                if (!self.xtag.parentDeck) {
                    return;
                }
                var deck = self.xtag.parentDeck;
                deck.xtag.history.sanitizeStack();
                _sanitizeCardAttrs(deck);
                xtag.fireEvent(deck, "cardremove", {
                    detail: {
                        card: self
                    }
                });
            }
        },
        accessors: {
            transitionOverride: {
                attribute: {
                    name: "transition-override"
                }
            }
        },
        methods: {
            show: function() {
                var deck = this.parentNode;
                if (deck === this.xtag.parentDeck) {
                    deck.shuffleTo(deck.getCardIndex(this));
                }
            }
        }
    });
})();