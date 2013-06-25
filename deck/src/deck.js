(function(){
    /** HistoryStack
    
    a generic stack implementation intended for keeping track of state history
    
    constructor params:
        validatorFn             a function taking a single state and returns 
                                a Boolean, with false indicating an invalid 
                                state
        itemCap                 (optional) the maximum number of items to keep
                                in the stack at a time. If not set, will default
                                to HistoryStack.DEFAULT_CAP. If set to "none",
                                will allow infinite items in the stack.
    **/
    function HistoryStack(validatorFn, itemCap){
        this._historyStack = [];
        this.currIndex = -1;
        
        // .itemCap setter takes care of sanitizing and setting ._itemCap value
        this._itemCap = undefined;
        this.itemCap = itemCap;
        
        this._validatorFn = (validatorFn) ? validatorFn : 
                                            function(x){ return true; };
    }   
    
    // add item and set it as the current state
    HistoryStack.prototype.pushState = function(newState){
        if(this.canRedo){
             // remove all future items, if any exist
            this._historyStack.splice(this.currIndex + 1,  
                                      this._historyStack.length - 
                                            (this.currIndex + 1));
        }
        this._historyStack.push(newState);
        this.currIndex = this._historyStack.length - 1;
        
        this.sanitizeStack();
        
        // remove oldest items to cap number of items in history
        if(this._itemCap != "none" && 
           this._historyStack.length > this._itemCap)
        {
            var len = this._historyStack.length;
            this._historyStack.splice(0, len - this._itemCap);
            
            this.currIndex = this._historyStack.length - 1;
        }
    }
    
    // remove consecutive duplicate states and also removes all invalid states
    HistoryStack.prototype.sanitizeStack = function(){
        var validatorFn = this._validatorFn;
        var lastValidState = undefined;
        var i = 0;
        while(i < this._historyStack.length){
            var state = this._historyStack[i];
            if((state !== lastValidState) && validatorFn(state))
            {
                lastValidState = state;
                i++;
            }
            else{
                this._historyStack.splice(i, 1);
                if(i <= this.currIndex){
                    this.currIndex--;
                }
            }
        }
    }
    
    HistoryStack.prototype.forwards = function(){
        if(this.canRedo){
            this.currIndex++;
        }
        this.sanitizeStack();
    }

    HistoryStack.prototype.backwards = function(){
        if(this.canUndo){
            this.currIndex--;
        }
        this.sanitizeStack();
    }

    Object.defineProperties(HistoryStack.prototype, {
        "DEFAULT_CAP": {
            value: 50
        },
        "itemCap": {
            get: function(){
                return this._itemCap;
            },
            set: function(newCap){
                if(newCap === undefined){
                    this._itemCap = this.DEFAULT_CAP;
                }
                else if(newCap === "none")
                {
                    this._itemCap = "none";
                }
                else{
                    var num = parseInt(newCap);
                    if(isNaN(newCap) || newCap <= 0){
                        throw "attempted to set invalid item cap: " + newCap;
                    }
                    
                    this._itemCap = num;
                }
            }
        },
        "canUndo": {
            get: function(){
                return this.currIndex > 0;
            }
        },
        "canRedo": {
            get: function(){
                return this.currIndex < this._historyStack.length-1;
            }
        },
        "numStates":{
            get: function(){
                return this._historyStack.length;
            }
        },
        "currState": {
            get: function(){
                var index = this.currIndex;
                if(0 <= index && index < this._historyStack.length){
                    return this._historyStack[index];
                }
                return null;
            }
        }
    });
    
    /** HELPERS **/
    
    /** getDurationStr: (DOM) => String
    
    returns the computed style value of the given element's CSS transition
    duration property
    **/
    function getDurationStr(elem){
        var style = window.getComputedStyle(elem);
        var browserDurationName = xtag.prefix.js+"TransitionDuration";
        
        if(style.transitionDuration){
            return style.transitionDuration;
        }
        else{
            return style[browserDurationName];
        }
    }
    
    /** durationStrToMs: (String) => Number
    
    given a string in an acceptable format for a css transition duration, 
    parse out and return the number of milliseconds this represents
    **/
    function durationStrToMs(str){
        var reg = /^(\d*\.?\d+)(m?s)$/;
        var matchInfo = str.toLowerCase().match(reg);
        
        if(matchInfo){
            var strVal = matchInfo[1];
            var unit = matchInfo[2];
            
            var val = parseFloat(strVal);
            if(isNaN(val)){
                throw "value error";
            }
            
            if(unit === "s"){
                return val * 1000;
            }
            else if (unit === "ms"){
                return val;
            }
            else{
                throw "unit error";
            }
        }
        else{
            return 0;
        }
    }
    
    /** posModulo : (Number, Number) => Number
    * hacky workaround to get Python-esque modding so that doing
    * negative modulos return positive numbers
    * ex: -5 % 3 should return 1 instead of -2
    **/
    function posModulo(x, divisor){
        return ((x % divisor) + divisor) % divisor;
    }
    
    /** _getAllCards : (DOM) => DOM array
    
    simply returns a list of all x-card DOM elements in the given 
    DOM element
    **/
    function _getAllCards(elem){
        var cards = xtag.query(elem, "x-card");
        var output = [];
        // filter for those that are actually direct descendents
        cards.forEach(function(card){
            if(card.parentNode && card.parentNode === elem){
                output.push(card);
            }
        });
        
        return output;
    }
    
    /** _getTargetCard : (DOM, Number) => DOM/null
     *
     * return the card at the current index in the given deck DOM
     *
     * returns null if no such card exists
    **/
    function _getTargetCard(deck, targetIndex){
        var cards = _getAllCards(deck);
        
        return (targetIndex < 0 || targetIndex >= cards.length) ? 
                    null : cards[targetIndex];
    }
    
    /** _getCardIndex: (DOM, DOM) => Number
    *
    * returns the index of the given x-card in the deck
    * returns -1 if the given card does not exist in this deck
    **/
    function _getCardIndex(deck, card){
        var allCards = _getAllCards(deck);
        
        return allCards.indexOf(card);
    }
    
    /**  _animateCardReplacement : (DOM, DOM, DOM, string, Boolean, Function)
    
    given a transform data map and the callbacks to fire during an animation,
    will animate the transition of replacing oldCard with newCard in the given
    deck
    
    params:
        deck             the x-deck DOM element we are working in
        oldCard                the x-card DOM element we are replacing
        newCard                the x-card DOM element we are replacing 
                                the oldCard with
        cardAnimName           the name of the animation type to use   
        isReverse               whether or not the animation should be reversed
                                
    **/
    function _animateCardReplacement(deck, oldCard, newCard, 
                                      cardAnimName, isReverse){
        deck.xtag._selectedCard = newCard;
                                      
        // set up an attribute-cleaning up function and callback caller function
        // that will be fired when the animation is completed
        var _onComplete = function(){
            // for synchronization purposes, only set these attributes if 
            // the newCard is actually the currently selected card
            if(newCard === deck.xtag._selectedCard){
                // guarantee that attributes are consistent upon completion
                _getAllCards(deck).forEach(function(card){
                    card.removeAttribute("card-anim-type");
                    card.removeAttribute("selected");
                    card.removeAttribute("leaving");
                    card.removeAttribute("reverse");
                });
                newCard.setAttribute("selected", true);
                deck.xtag._selectedCard = newCard;
            }
            
            xtag.fireEvent(deck, "shuffleend");
        };
        
        // abort redundant transitions
        if (newCard === oldCard){
            _onComplete();
            return;
        }    
        
        var oldCardAnimReady = false;
        var newCardAnimReady = false;
        var animationStarted = false;
        
        // define a helper function to call
        // when both cards are ready to animate;
        // necessary so that card additions aren't transitioning into the void
        // and graphically flickering
        var _attemptBeforeCallback = function(){
            if(oldCardAnimReady && newCardAnimReady){
                _getAllCards(deck).forEach(function(card){
                    card.removeAttribute("selected");
                    card.removeAttribute("leaving");
                });
                oldCard.setAttribute("leaving", true);
                newCard.setAttribute("selected", true);
                deck.xtag._selectedCard = newCard;
                if(isReverse){
                    oldCard.setAttribute("reverse", true);
                    newCard.setAttribute("reverse", true);
                }
                xtag.fireEvent(deck, "shufflebefore");
            }
        };
        
        // define a helper function to attempt an animation only when both
        // cards are ready to animate
        var _attemptAnimation = function(){
            if(animationStarted){
                return;
            }
            if(!(oldCardAnimReady && newCardAnimReady))
            {
                return;
            }
            _doAnimation();
        };

        // function to actually perform the animation of the two cards,
        // starting from the initial state and going until the end of the 
        // animation
        var _doAnimation = function(){
            animationStarted = true;
            
            var oldCardDone = false;
            var newCardDone = false;
            var animationComplete = false;
            
            // create the listener to be fired after the final animations 
            // have completed
            var onTransitionComplete = function(e){
                if(animationComplete){
                    return;
                }
                
                if(e.target === oldCard){
                    oldCardDone = true;
                    oldCard.removeEventListener("transitionend", 
                                                 onTransitionComplete);
                }
                else if(e.target === newCard){
                    newCardDone = true;
                    newCard.removeEventListener("transitionend", 
                                                 onTransitionComplete);
                }
                
                if(oldCardDone && newCardDone){
                    animationComplete = true;
                    // actually call the completion callback function
                    _onComplete();
                }
            };
            
            // wait for both to finish sliding before firing completion callback
            oldCard.addEventListener('transitionend', onTransitionComplete);
            newCard.addEventListener('transitionend', onTransitionComplete);
            
            // unleash the animation!
            oldCard.removeAttribute("before-animation");
            newCard.removeAttribute("before-animation");
            
            // alternatively, because transitionend may not ever fire, have a
            // fallback setTimeout to catch cases where transitionend doesn't
            // fire (heuristic:wait some multiplier longer than actual duration)
            var oldDuration = durationStrToMs(getDurationStr(oldCard));
            var newDuration = durationStrToMs(getDurationStr(newCard));
            
            var maxDuration = Math.max(oldDuration, newDuration);
            var waitMultiplier = 1.15;
            
            // special case on the "none" transition, which should be 
            // near instant
            var timeoutDuration = (cardAnimName.toLowerCase() === "none") ?
                                  0 : Math.ceil(maxDuration * waitMultiplier);
                                  
            window.setTimeout(function(){
                if(animationComplete){
                    return;
                }
                
                animationComplete = true;
                
                newCard.removeEventListener("transitionend", 
                                             onTransitionComplete);
                newCard.removeEventListener("transitionend", 
                                             onTransitionComplete);
                _onComplete();
            }, timeoutDuration);
        };
        
        // finally, after setting up all these callback functions, actually
        // start the animation by setting the old and new cards at their
        // animation beginning states 
        xtag.skipTransition(oldCard, function(){
            oldCard.setAttribute("card-anim-type", cardAnimName);
            oldCard.setAttribute("before-animation", true);
            
            oldCardAnimReady = true;
            _attemptBeforeCallback();
            
            return _attemptAnimation;
        }, this);
        
        xtag.skipTransition(newCard, function(){
            newCard.setAttribute("card-anim-type", cardAnimName);
            newCard.setAttribute("before-animation", true);
            
            newCardAnimReady = true;
            _attemptBeforeCallback();
            
            return _attemptAnimation;
        }, this);
    }
    
    
    /** _replaceCurrCard: (DOM, DOM, String, String)
    
    replaces the current card in the deck with the given newCard,
    using the transition animation defined by the parameters
    
    param:
        deck             the x-deck DOM element we are working in
        newCard                the x-card DOM element we are replacing
                                the current card with
        transitionType          (optional) The name of the animation type
                                Valid options are any type defined in 
                                transitionTypeData
                                Defaults to "scrollLeft" if not given a type
                                
        progressType            (optional)
                                if "forward", card will use forwards animation
                                if "reverse", card will use reverse animation
                                if "auto", card will use forward animation if
                                the target's is further ahead and reverse if
                                it is farther behind (default option)
        ignoreHistory           (optional) if true, the slide replacement will
                                _not_ be registered to the stack's history
                                default: false
    **/
    function _replaceCurrCard(deck, newCard, transitionType, 
                              progressType, ignoreHistory){
        _sanitizeCardAttrs(deck);
        
        var oldCard = deck.xtag._selectedCard;
        
        // avoid redundant call that doesnt actually change anything
        // about the cards
        if(oldCard === newCard){
            xtag.fireEvent(deck, "shufflebefore");
            xtag.fireEvent(deck, "shuffleend");
            return;
        }
        
        if(transitionType === undefined){
            console.log("defaulting to none transition");
            transitionType = "none";
        }
        
        var isReverse;
        switch (progressType){
            case "forward":
                isReverse = false;
                break;
            case "reverse":
                isReverse = true;
                break;
            // automatically determine direction based on which way the target
            // index is from our current index
            default:
                if(!oldCard){
                    isReverse = false;
                }
                var allCards = _getAllCards(deck);
                if(allCards.indexOf(newCard) < allCards.indexOf(oldCard)){
                    isReverse = true;
                }
                else{
                    isReverse = false;
                }
                break;
        }
        
        // check for requested animation overrides
        if(newCard.hasAttribute("transition-override")){
            transitionType = newCard.getAttribute("transition-override");
        }
        
        // register replacement to deck history, unless otherwise indicated
        if(!ignoreHistory){
            deck.xtag.history.pushState(newCard);
        }
        
        // actually perform the transition
        _animateCardReplacement(deck, oldCard, newCard, 
                                transitionType, isReverse);
    }
    
    
    /** _replaceWithIndex: (DOM, Number, String, String)
    
    transitions to the card at the given index in the deck, using the
    given animation type
    
    param:
        deck                    the x-deck DOM element we are working in
        targetIndex             the index of the x-card we want to  
                                display
        transitionType          same as _replaceCurrCard's transitionType
                                parameter
                                
        progressType            same as _replaceCurrCard's progressType
                                parameter
    **/
    function _replaceWithIndex(deck, targetIndex, transitionType, progressType){
        var newCard = _getTargetCard(deck, targetIndex);
        
        if(!newCard){
            throw "no card at index " + targetIndex;
        }
            
        _replaceCurrCard(deck, newCard, transitionType, progressType);
    }
    
    /** _sanitizeCardAttrs: DOM
    
    sanitizes the cards in the deck by ensuring that there is always a single
    selected card except (and only except) when no cards exist
    
    also removes any temp-attributes used for animation
    **/
    function _sanitizeCardAttrs(deck){
        var cards = _getAllCards(deck);
        
        var currCard = deck.xtag._selectedCard;
        
        if(!currCard || currCard.parentNode !== deck){
            // if no card is yet selected, but cards still exist, match to either
            // the most recent card in the history stack, or to the first card, 
            // if no history exists
            if(cards.length > 0){
                // we need to check for the existence of history, as x-cards
                // may sometimes initialize before x-decks (ie: before
                // x-deck even has a history stack)
                if(deck.xtag.history && deck.xtag.history.numStates > 0){
                    currCard = deck.xtag.history.currState;
                }
                else{
                    currCard = cards[0];
                }
            }
            else{
                currCard = null;
            }
        }
        
        // ensure that the currCard and _only_ the currCard is selected
        cards.forEach(function(card){
            card.removeAttribute("leaving");
            card.removeAttribute("before-animation");
            card.removeAttribute("card-anim-type");
            card.removeAttribute("reverse");
            if(card !== currCard){
                card.removeAttribute("selected");
            }
            else{
                card.setAttribute("selected", true);
            }
        });
        
        deck.xtag._selectedCard = currCard;
    }
    
    /** init: (DOM)
    
    initializes the deck by sanitizing the cards and 
    ensuring that we are showing the current card
    **/
    function init(deck){
        _sanitizeCardAttrs(deck);
    }
    
    xtag.register("x-deck", {
        lifecycle:{
            created: function(){
                this.xtag.history = new HistoryStack(function(card){
                                        return card.parentNode === this;
                                    }.bind(this), HistoryStack.DEFAULT_CAP);
                                    
                this.xtag._selectedCard = (this.xtag._selectedCard) ? 
                                          this.xtag._selectedCard : null; 
                init(this);
                this.xtag.transitionType = "scrollLeft";
                
                var currCard = this.xtag._selectedCard;
                if(currCard){
                    this.xtag.history.pushState(currCard);
                }
            }
        },
        events:{
            // shuffleend is fired when done transitioning
            "show:delegate(x-card)": function(e){
                var card = this;
                card.show();
            }
        },
        accessors:{
            "transitionType":{
                attribute: {name: "transition-type"},
                get: function(){
                    return this.xtag.transitionType;
                },
                set: function(newType){
                    this.xtag.transitionType = newType;
                }
            },
            
            "selectedIndex":{
                attribute: {name: "selected-index"},
                get: function(){
                    return _getCardIndex(this, this.xtag._selectedCard);
                },
                set: function(newIndex){
                    this.shuffleTo(newIndex);
                }
            },
            
            "numCards":{
                get: function(){
                    return this.getAllCards().length;
                }
            },
            
            'historyCap': {
                attribute: {name: "history-cap"},
                get: function(){
                    return this.xtag.history.itemCap;
                },
                set: function(itemCap){
                    this.xtag.history.itemCap = itemCap;
                }
            },
            
            "currHistorySize": {
                get: function(){
                    return this.xtag.history.numStates;
                }
            },
            
            "currHistoryIndex": {
                get: function(){
                    return this.xtag.history.currIndex;
                }
            }
        },
        methods:{        
            /** shuffleTo: (Number, String) 
            
            transitions to the card at the given index
            
            parameters:
                index          the index to shuffle to
                progressType    if "forward", card will use forwards animation
                                if "reverse", card will use reverse animation
                                if "auto", card will use forward animation if
                                the target's is further ahead and reverse if
                                it is farther behind (default option)
            **/
            shuffleTo: function(index, progressType){
                var targetCard = _getTargetCard(this, index);
                if(!targetCard){
                    throw "invalid shuffleTo index " + index;
                }
                
                var transitionType = this.xtag.transitionType;
                     
                _replaceWithIndex(this, index, transitionType, progressType);
            },
            
            /** shuffleNext: (String) 
            
            transitions to the card at the next index
            
            parameters:
                progressType    if "forward", card will use forwards animation
                                if "reverse", card will use reverse animation
                                if "auto", card will use forward animation if
                                the target's is further ahead and reverse if
                                it is farther behind (default option)
            **/
            shuffleNext: function(progressType){
                progressType = (progressType) ? progressType : "auto";
            
                var cards = _getAllCards(this);
                var currCard = this.xtag._selectedCard;
                var currIndex = cards.indexOf(currCard);
                
                if(currIndex > -1){
                    this.shuffleTo(posModulo(currIndex+1, cards.length), 
                                   progressType);
                }
            },
            
            /** shufflePrev: (String) 
            
            transitions to the card at the previous index
            
            parameters:
                progressType    if "forward", card will use forwards animation
                                if "reverse", card will use reverse animation
                                if "auto", card will use forward animation if
                                the target's is further ahead and reverse if
                                it is farther behind (default option)
            **/
            shufflePrev: function(progressType){
                progressType = (progressType) ? progressType : "auto";
            
                var cards = _getAllCards(this);
                var currCard = this.xtag._selectedCard;
                var currIndex = cards.indexOf(currCard);
                if(currIndex > -1){
                    this.shuffleTo(posModulo(currIndex-1, cards.length), 
                                   progressType);
                }
            },
            
            /** getAllCards: => DOM array
            
            returns a list of all x-card elements in the deck
            **/
            getAllCards: function(){
                return _getAllCards(this);
            },
            
            /** getSelectedCard: => DOM/null
            
            returns the currently selected x-card in the deck, if any
            **/
            getSelectedCard: function(){
                return this.xtag._selectedCard;
            },
            
            /** getCardIndex: (DOM) => Number
            *
            * returns the index of the given x-card in the deck
            * returns -1 if the given card does not exist in this deck
            **/
            getCardIndex: function(card){
                return _getCardIndex(this, card);
            },
            
            getCardAt: function(index){
                var cards = this.getAllCards();
                
                if(0 <= index && index < cards.length){
                    return cards[index];
                }
                else{
                    return null;
                }
            },

            historyBack: function(progressType){
                var history = this.xtag.history;
                var deck = this;
                
                if(history.canUndo){
                    history.backwards();
                    
                    var newCard = history.currState;
                    if(newCard){
                        _replaceCurrCard(this, newCard, this.transitionType,
                                         progressType, true);
                    }
                }
            },
            historyForward: function(progressType){
                var history = this.xtag.history;
                var deck = this;
                
                if(history.canRedo){
                    history.forwards();
                    
                    var newCard = history.currState;
                    if(newCard){
                        _replaceCurrCard(this, newCard, this.transitionType,
                                         progressType, true);
                    }
                }
            }            
        }
    });

    xtag.register("x-card", {
        lifecycle:{
            inserted: function(){
                var deckContainer = this.parentNode;
                if (deckContainer){
                    if(deckContainer.tagName.toLowerCase() === 'x-deck')
                    {
                        init(deckContainer);
                        this.xtag.parentDeck = deckContainer;
                    }
                }                
                        
            },
            created: function(){
                var deckContainer = this.parentNode;
                if (deckContainer && 
                        deckContainer.tagName.toLowerCase() === 'x-deck')
                {
                    init(deckContainer);
                    this.xtag.parentDeck = deckContainer;
                }
            },
            removed: function(){
                if(!this.xtag.parentDeck){
                    return;
                }
                
                var deck = this.xtag.parentDeck;
                deck.xtag.history.sanitizeStack();
                init(deck);
            }
        },
        accessors:{
            "transitionOverride": {
                attribute: {name: "transition-override"}
            }
        },
        methods:{
            "show": function(){
                var deck = this.parentNode;
                if(deck === this.xtag.parentDeck){
                    deck.shuffleTo(deck.getCardIndex(this));
                }
            }
        }
    });
    
})();