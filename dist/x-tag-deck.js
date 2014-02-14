(function() {
    var matchNum = /[1-9]/, replaceSpaces = / /g, captureTimes = /(\d|\d+?[.]?\d+?)(s|ms)(?!\w)/gi, transPre = "transition" in getComputedStyle(document.documentElement) ? "t" : xtag.prefix.js + "T", transDur = transPre + "ransitionDuration", transProp = transPre + "ransitionProperty", skipFrame = function(fn) {
        xtag.requestFrame(function() {
            xtag.requestFrame(fn);
        });
    }, ready = document.readyState == "complete" ? skipFrame(function() {
        ready = false;
    }) : xtag.addEvent(document, "readystatechange", function() {
        if (document.readyState == "complete") {
            skipFrame(function() {
                ready = false;
            });
            xtag.removeEvent(document, "readystatechange", ready);
        }
    });
    function getTransitions(node) {
        node.__transitions__ = node.__transitions__ || {};
        return node.__transitions__;
    }
    function startTransition(node, name, transitions) {
        var style = getComputedStyle(node), after = transitions[name].after;
        node.setAttribute("transition", name);
        if (after && !style[transDur].match(matchNum)) after();
    }
    xtag.addEvents(document, {
        transitionend: function(e) {
            var node = e.target, name = node.getAttribute("transition");
            if (name) {
                var i = 0, max = 0, prop = null, style = getComputedStyle(node), transitions = getTransitions(node), props = style[transProp].replace(replaceSpaces, "").split(",");
                style[transDur].replace(captureTimes, function(match, time, unit) {
                    time = parseFloat(time) * (unit === "s" ? 1e3 : 1);
                    if (time > max) prop = i, max = time;
                    i++;
                });
                prop = props[prop];
                if (!prop) throw new SyntaxError("No matching transition property found"); else if (e.propertyName == prop && transitions[name].after) transitions[name].after();
            }
        }
    });
    xtag.transition = function(node, name, obj) {
        var transitions = getTransitions(node), options = transitions[name] = obj || {};
        if (options.immediate) options.immediate();
        if (options.before) {
            options.before();
            if (ready) xtag.skipTransition(node, function() {
                startTransition(node, name, transitions);
            }); else skipFrame(function() {
                startTransition(node, name, transitions);
            });
        } else startTransition(node, name, transitions);
    };
    xtag.pseudos.transition = {
        onCompiled: function(fn, pseudo) {
            var options = {}, when = pseudo["arguments"][0] || "immediate", name = pseudo["arguments"][1] || pseudo.key.split(":")[0];
            return function() {
                var target = this, args = arguments;
                if (this.hasAttribute("transition")) {
                    options[when] = function() {
                        return fn.apply(target, args);
                    };
                    xtag.transition(this, name, options);
                } else return fn.apply(this, args);
            };
        }
    };
})();

(function() {
    var sides = {
        next: [ "nextElementSibling", "firstElementChild" ],
        previous: [ "previousElementSibling", "lastElementChild" ]
    };
    function indexOfCard(deck, card) {
        return Array.prototype.indexOf.call(deck.children, card);
    }
    function getCard(deck, item) {
        return item && item.nodeName ? item : isNaN(item) ? xtag.queryChildren(deck, item) : deck.children[item];
    }
    function checkCard(deck, card, selected) {
        return card && (selected ? card == deck.xtag.selected : card != deck.xtag.selected) && deck == card.parentNode && card.nodeName == "X-CARD";
    }
    function shuffle(deck, side, direction) {
        var getters = sides[side], selected = deck.xtag.selected && deck.xtag.selected[getters[0]];
        if (selected) deck.showCard(selected, direction); else if (deck.loop || deck.selectedIndex == -1) deck.showCard(deck[getters[1]], direction);
    }
    xtag.register("x-deck", {
        events: {
            "reveal:delegate(x-card)": function(e) {
                if (this.parentNode == e.currentTarget) e.currentTarget.showCard(this);
            }
        },
        accessors: {
            loop: {
                attribute: {
                    "boolean": true
                }
            },
            cards: {
                get: function() {
                    return xtag.queryChildren(this, "x-card");
                }
            },
            selectedCard: {
                get: function() {
                    return this.xtag.selected || null;
                },
                set: function(card) {
                    this.showCard(card);
                }
            },
            selectedIndex: {
                attribute: {
                    name: "selected-index",
                    unlink: true
                },
                get: function() {
                    return this.hasAttribute("selected-index") ? Number(this.getAttribute("selected-index")) : -1;
                },
                set: function(value) {
                    var index = Number(value), card = this.cards[index];
                    if (card) {
                        this.setAttribute("selected-index", index);
                        if (card != this.xtag.selected) this.showCard(card);
                    } else {
                        this.removeAttribute("selected-index");
                        if (this.xtag.selected) this.hideCard(this.xtag.selected);
                    }
                }
            },
            transitionType: {
                attribute: {
                    name: "transition-type"
                },
                get: function() {
                    return this.getAttribute("transition-type") || "fade-scale";
                }
            }
        },
        methods: {
            nextCard: function(direction) {
                shuffle(this, "next", direction);
            },
            previousCard: function(direction) {
                shuffle(this, "previous", direction);
            },
            showCard: function(item, direction) {
                var card = getCard(this, item);
                if (checkCard(this, card, false)) {
                    var selected = this.xtag.selected, nextIndex = indexOfCard(this, card);
                    direction = direction || (nextIndex > indexOfCard(this, selected) ? "forward" : "reverse");
                    if (selected) this.hideCard(selected, direction);
                    this.xtag.selected = card;
                    this.selectedIndex = nextIndex;
                    if (!card.hasAttribute("selected")) card.selected = true;
                    xtag.transition(card, "show", {
                        before: function() {
                            card.setAttribute("show", "");
                            card.setAttribute("transition-direction", direction);
                        },
                        after: function() {
                            xtag.fireEvent(card, "show");
                        }
                    });
                }
            },
            hideCard: function(item, direction) {
                var card = getCard(this, item);
                if (checkCard(this, card, true)) {
                    this.xtag.selected = null;
                    if (card.hasAttribute("selected")) card.selected = false;
                    xtag.transition(card, "hide", {
                        before: function() {
                            card.removeAttribute("show");
                            card.setAttribute("hide", "");
                            card.setAttribute("transition-direction", direction || "reverse");
                        },
                        after: function() {
                            card.removeAttribute("hide");
                            card.removeAttribute("transition");
                            card.removeAttribute("transition-direction");
                            xtag.fireEvent(card, "hide");
                        }
                    });
                }
            }
        }
    });
    xtag.register("x-card", {
        lifecycle: {
            inserted: function() {
                var deck = this.parentNode;
                if (deck.nodeName == "X-DECK") {
                    this.xtag.deck = deck;
                    if (this != deck.selected && this.selected) deck.showCard(this);
                }
            },
            removed: function() {
                var deck = this.xtag.deck;
                if (deck) {
                    if (this == deck.xtag.selected) {
                        deck.xtag.selected = null;
                        deck.removeAttribute("selected-index");
                    } else deck.showCard(deck.selectedCard);
                    this.xtag.deck = null;
                }
            }
        },
        accessors: {
            transitionType: {
                attribute: {
                    name: "transition-type"
                }
            },
            selected: {
                attribute: {
                    "boolean": true
                },
                set: function(val) {
                    var deck = this.xtag.deck;
                    if (deck) {
                        if (val && this != deck.selected) deck.showCard(this); else if (!val && this == deck.selected) deck.hideCard(this);
                    }
                }
            }
        }
    });
})();