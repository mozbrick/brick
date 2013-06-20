(function(){
    
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
    
    /** _getAllSlides : (DOM) => DOM array
    
    simply returns a list of all x-shuffleslide DOM elements in the given 
    DOM element
    **/
    function _getAllSlides(elem){
        var slides = xtag.query(elem, "x-shuffleslide");
        var output = [];
        // filter for those that are actually direct descendents
        slides.forEach(function(slide){
            if(slide.parentNode && slide.parentNode === elem){
                output.push(slide);
            }
        });
        
        return output;
    }
    
    /** _getTargetSlide : (DOM, Number) => DOM/null
     *
     * return the slide at the current index in the given shuffleDeck DOM
     *
     * returns null if no such slide exists
    **/
    function _getTargetSlide(shuffleDeck, targetIndex){
        var slides = _getAllSlides(shuffleDeck);
        
        return (targetIndex < 0 || targetIndex >= slides.length) ? 
                    null : slides[targetIndex];
    }
    
    /** _getSelectedSlide: (DOM) => DOM/null
     *
     * returns the currently selected slide DOM element in the given
     * shuffledeck, if any exists     
    **/
    function _getSelectedSlide(shuffleDeck){
        var selected = xtag.query(shuffleDeck, "[selected]");
        
        for(var i = 0; i < selected.length; i++){
            var selectedSlide = selected[i];
            if(selectedSlide.parentNode &&
               selectedSlide.parentNode === shuffleDeck)
            {
                return selectedSlide;
            }
        }
        
        return null;
    }
    
    /** _getSlideIndex: (DOM, DOM) => Number
    *
    * returns the index of the given x-shuffleslide in the deck
    * returns -1 if the given slide does not exist in this deck
    **/
    function _getSlideIndex(shuffleDeck, slide){
        var allSlides = _getAllSlides(shuffleDeck);
        
        return allSlides.indexOf(slide);
    }
    
    
    /**  _animateSlideReplacement : (DOM, DOM, DOM, string, Boolean, Function)
    
    given a transform data map and the callbacks to fire during an animation,
    will animate the transition of replacing oldSlide with newSlide in the given
    shuffleDeck
    
    params:
        shuffleDeck             the x-shuffledeck DOM element we are working in
        oldSlide                the x-shuffleslide DOM element we are replacing
        newSlide                the x-shuffleslide DOM element we are replacing 
                                the oldSlide with
        slideAnimName           the name of the animation type to use   
        isReverse               whether or not the animation should be reversed
        callback                (optional) on completion, call this function 
                                with no parameters
                                
    **/
    function _animateSlideReplacement(shuffleDeck, oldSlide, newSlide, 
                                      slideAnimName, isReverse, callback){
        // set up an attribute-cleaning up function and callback caller function
        // that will be fired when the animation is completed
        var _onComplete = function(){
            // for synchronization purposes, only set these attributes if 
            // the newSlide is actually the currently selected slide
            if(newSlide === _getSelectedSlide(shuffleDeck)){
                shuffleDeck.removeAttribute("active-transition-type");
                // guarantee that attributes are consistent upon completion
                _getAllSlides(shuffleDeck).forEach(function(slide){
                    slide.removeAttribute("selected");
                    slide.removeAttribute("leaving");
                    slide.removeAttribute("reverse");
                    slide.removeAttribute("slide-anim-type");
                });
                newSlide.setAttribute("selected", true);
                shuffleDeck.xtag.lastSelectedIndex = _getSlideIndex(shuffleDeck, newSlide);
                
                if(callback){
                    callback();
                }
                
                xtag.fireEvent(shuffleDeck, "slideend");
            }
        };
        
        // abort redundant transitions
        if (newSlide === oldSlide){
            _onComplete();
            return;
        }    
        
        var oldSlideAnimReady = false;
        var newSlideAnimReady = false;
        var animationStarted = false;
        
        // define a helper function to call
        // when both slides are ready to animate;
        // necessary so that slide additions aren't transitioning into the void
        // and graphically flickering
        var _attemptBeforeCallback = function(){
            if(oldSlideAnimReady && newSlideAnimReady){
                shuffleDeck.setAttribute("active-transition-type", 
                                         slideAnimName);
            
                _getAllSlides(shuffleDeck).forEach(function(slide){
                    slide.removeAttribute("selected");
                    slide.removeAttribute("leaving");
                });
                oldSlide.setAttribute("leaving", true);
                newSlide.setAttribute("selected", true);
                shuffleDeck.xtag.lastSelectedIndex = _getSlideIndex(shuffleDeck,
                                                                    newSlide);
                if(isReverse){
                    oldSlide.setAttribute("reverse", true);
                    newSlide.setAttribute("reverse", true);
                }
            }
        };
        
        // define a helper function to attempt an animation only when both
        // slides are ready to animate
        var _attemptAnimation = function(){
            if(animationStarted){
                return;
            }
            if(!(oldSlideAnimReady && newSlideAnimReady))
            {
                return;
            }
            _doAnimation();
        };

        // function to actually the animation of the two slides,
        // starting from the initial state and going until the end of the 
        // animation
        var _doAnimation = function(){
            animationStarted = true;
            
            var oldSlideDone = false;
            var newSlideDone = false;
            var animationComplete = false;
            
            // create the listener to be fired after the final animations 
            // have completed
            var onTransitionComplete = function(e){
                if(animationComplete){
                    return;
                }
                
                if(e.target === oldSlide){
                    oldSlideDone = true;
                    oldSlide.removeEventListener("transitionend", 
                                                 onTransitionComplete);
                }
                else if(e.target === newSlide){
                    newSlideDone = true;
                    newSlide.removeEventListener("transitionend", 
                                                 onTransitionComplete);
                }
                
                if(oldSlideDone && newSlideDone){
                    animationComplete = true;
                    console.log("transition done");
                    // actually call the completion callback function
                    _onComplete();
                }
            };
            
            // wait for both to finish sliding before firing completion callback
            oldSlide.addEventListener('transitionend', onTransitionComplete);
            newSlide.addEventListener('transitionend', onTransitionComplete);
            
            // unleash the animation!
            oldSlide.removeAttribute("before-animation");
            newSlide.removeAttribute("before-animation");
            
            // alternatively, because transitionend may not ever fire, have a
            // fallback setTimeout to catch cases where transitionend doesn't
            // fire (heuristic:wait some multiplier longer than actual duration)
            var oldDuration = durationStrToMs(getDurationStr(oldSlide));
            var newDuration = durationStrToMs(getDurationStr(newSlide));
            
            var maxDuration = Math.max(oldDuration, newDuration);
            var waitMultiplier = 1.15;
            
            // special case on the "none" transition, which should be 
            // near instant
            var timeoutDuration = (slideAnimName.toLowerCase() === "none") ?
                                  0 : Math.ceil(maxDuration * waitMultiplier);
                                  
            window.setTimeout(function(){
                if(animationComplete){
                    return;
                }
                animationComplete = true;
                
                newSlide.removeEventListener("transitionend", 
                                             onTransitionComplete);
                newSlide.removeEventListener("transitionend", 
                                             onTransitionComplete);
                _onComplete();
            }, timeoutDuration);
        };
        
        // finally, after setting up all these callback functions, actually
        // start the animation by setting the old and newslides at their
        // animation beginning states 
        
        xtag.skipTransition(oldSlide, function(){
            oldSlide.setAttribute("slide-anim-type", slideAnimName);
            oldSlide.setAttribute("before-animation", true);
            
            oldSlideAnimReady = true;
            _attemptBeforeCallback();
            
            return _attemptAnimation;
        }, this);
        
        xtag.skipTransition(newSlide, function(){
            newSlide.setAttribute("slide-anim-type", slideAnimName);
            newSlide.setAttribute("before-animation", true);
            
            newSlideAnimReady = true;
            _attemptBeforeCallback();
            
            return _attemptAnimation;
        }, this);
    }
    
    
    /** _replaceCurrSlide: (DOM, DOM, String, String)
    
    replaces the current slide in the shuffledeck with the given newSlide,
    using the transition animation defined by the parameters
    
    param:
        shuffleDeck             the x-shuffledeck DOM element we are working in
        newSlide                the x-shuffleslide DOM element we are replacing
                                the current slide with
        transitionType          (optional) The name of the animation type
                                Valid options are any type defined in 
                                transitionTypeData
                                Defaults to "scrollLeft" if not given a type
                                
        progressType            (optional)
                                if "forward", slide will use forwards animation
                                if "reverse", slide will use reverse animation
                                if "auto", slide will use forward animation if
                                the target's is further ahead and reverse if
                                it is farther behind (default option)
        callback                (optional) a callback function to execute 
                                once finished replacing slide; 
                                takes no parameters
    **/
    function _replaceCurrSlide(shuffleDeck, newSlide, 
                               transitionType, progressType, callback){
        _sanitizeSlideAttrs(shuffleDeck);
        
        var oldSlide = _getSelectedSlide(shuffleDeck);
        
        // avoid redundant call that doesnt actually change anything
        // about the slides
        if(oldSlide === newSlide){
            if(callback){
                callback();
            }
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
                if(!oldSlide){
                    isReverse = false;
                }
                var allSlides = _getAllSlides(shuffleDeck);
                if(allSlides.indexOf(newSlide) < allSlides.indexOf(oldSlide)){
                    isReverse = true;
                }
                else{
                    isReverse = false;
                }
                break;
        }
        
        // check for requested animation overrides
        if(newSlide.hasAttribute("transition-override")){
            transitionType = newSlide
                             .getAttribute("transition-override");
        }
        
        // actually perform the transition
        _animateSlideReplacement(shuffleDeck, oldSlide, newSlide, 
                                 transitionType, isReverse, callback);
    }
    
    
    /** _slideToIndex: (DOM, Number, String, String)
    
    transitions to the slide at the given index in the shuffledeck, using the
    given animation type
    
    param:
        shuffleDeck             the x-shuffledeck DOM element we are working in
        targetIndex             the index of the x-shuffleslide we want to  
                                display
        transitionType          same as _replaceCurrSlide's transitionType
                                parameter
                                
        progressType            same as _replaceCurrSlide's progressType
                                parameter
        callback                (optional)
                                a function to call once finished transitioning
    **/
    function _slideToIndex(shuffleDeck, targetIndex, 
                           transitionType, progressType, callback){
        var newSlide = _getTargetSlide(shuffleDeck, targetIndex);
        
        if(!newSlide){
            throw "no slide at index " + targetIndex;
        }
            
        _replaceCurrSlide(shuffleDeck, newSlide, 
                          transitionType, progressType, callback);
    }
    
    /** _sanitizeSlideAttrs: DOM
    
    sanitizes the slides in the deck by ensuring that there is always a single
    selected slide except (and only except) when no slides exist
    
    also synchronizes the selected slide with the lastSelectedIndex
    
    also removes any temp-attributes used for animation
    **/
    function _sanitizeSlideAttrs(shuffleDeck){
        shuffleDeck.removeAttribute("active-transition-type");
    
        var slides = _getAllSlides(shuffleDeck);
        
        var currSlide = _getSelectedSlide(shuffleDeck);
        // ensure that the index is in sync
        if(currSlide){
            shuffleDeck.xtag.lastSelectedIndex = _getSlideIndex(shuffleDeck, 
                                                                currSlide);
        }
        // if no slide is yet selected, attempt to match it to the index ref
        else if(slides.length > 0){
            if(shuffleDeck.xtag.lastSelectedIndex !== null){
                if(shuffleDeck.xtag.lastSelectedIndex == slides.length){
                    shuffleDeck.xtag.lastSelectedIndex = slides.length-1;
                    currSlide = slides[slides.length-1];
                }
                else{
                    currSlide = slides[shuffleDeck.xtag.lastSelectedIndex];
                }
            }
            else{
                currSlide = slides[0];
                shuffleDeck.xtag.lastSelectedIndex = 0;
            }
        }
        else{
            currSlide = null;
            shuffleDeck.xtag.lastSelectedIndex = null;
        }
        
        // ensure that the currSlide and _only_ the currSlide is selected
        slides.forEach(function(slide){
            slide.removeAttribute("leaving");
            slide.removeAttribute("before-animation");
            slide.removeAttribute("slide-anim-type");
            slide.removeAttribute("reverse");
            if(slide !== currSlide){
                slide.removeAttribute("selected");
            }
            else{
                slide.setAttribute("selected", true);
            }
        });
    }
    
    /** init: (DOM)
    
    initializes the shuffledeck by sanitizing the slides and 
    ensuring that we are showing the current slide
    **/
    function init(shuffleDeck){
        _sanitizeSlideAttrs(shuffleDeck);
        
        var currSlide = _getSelectedSlide(shuffleDeck);
        if(currSlide){
            // ensure that selected slide is actually shown
            shuffleDeck.slideTo(shuffleDeck.xtag.lastSelectedIndex);
        }
    }
    
    
    xtag.register("x-shuffledeck", {
        lifecycle:{
            created: function(){
                // make sure to sync this with the actual current slides
                this.xtag.lastSelectedIndex = null;
                init(this);
                this.xtag.transitionType = "scrollLeft";
            }
        },
        events:{
            // slideend is fired when done transitioning
        
            "show:delegate(x-shuffleslide)": function(e){
                var slide = e.target;
                if(slide.parentNode.nodeName.toLowerCase() === "x-shuffledeck"){
                    var deck = slide.parentNode;
                    deck.slideTo(deck.getSlideIndex(slide));
                }
            }
        },
        accessors:{
            "transition-type":{
                attribute: {},
                get: function(){
                    return this.xtag.transitionType;
                },
                set: function(newType){
                    this.xtag.transitionType = newType;
                }
            }
        },
        methods:{
            /** slideTo: (Number, String) 
            
            transitions to the slide at the given index
            
            parameters:
                index          the index to slide to
                progressType    if "forward", slide will use forwards animation
                                if "reverse", slide will use reverse animation
                                if "auto", slide will use forward animation if
                                the target's is further ahead and reverse if
                                it is farther behind (default option)
                callback        (optional)
                                a function to call once finished transitioning,
                                takes no parameters
            **/
            slideTo: function(index, progressType, callback){
                var targetSlide = _getTargetSlide(this, index);
                if(!targetSlide){
                    throw "invalid slideTo index " + index;
                }
                
                var transitionType = this.xtag.transitionType;
                     
                _slideToIndex(this, index, transitionType, 
                              progressType, callback);
            },
            
            /** slideNext: (String) 
            
            transitions to the slide at the next index
            
            parameters:
                progressType    if "forward", slide will use forwards animation
                                if "reverse", slide will use reverse animation
                                if "auto", slide will use forward animation if
                                the target's is further ahead and reverse if
                                it is farther behind (default option)
                callback        (optional)
                                a function to call once finished transitioning
            **/
            slideNext: function(progressType, callback){
                progressType = (progressType) ? progressType : "auto";
            
                var slides = _getAllSlides(this);
                var currSlide = _getSelectedSlide(this);
                var currIndex = slides.indexOf(currSlide);
                
                if(currIndex > -1){
                    this.slideTo(posModulo(currIndex+1, slides.length), 
                                 progressType, callback);
                }
            },
            
            /** slidePrev: (String) 
            
            transitions to the slide at the previous index
            
            parameters:
                progressType    if "forward", slide will use forwards animation
                                if "reverse", slide will use reverse animation
                                if "auto", slide will use forward animation if
                                the target's is further ahead and reverse if
                                it is farther behind (default option)
                callback        (optional)
                                a function to call once finished transitioning
            **/
            slidePrev: function(progressType, callback){
                progressType = (progressType) ? progressType : "auto";
            
                var slides = _getAllSlides(this);
                var currSlide = _getSelectedSlide(this);
                var currIndex = slides.indexOf(currSlide);
                if(currIndex > -1){
                    this.slideTo(posModulo(currIndex-1, slides.length), 
                                 progressType, callback);
                }
            },
            
            /** getAllSlides: => DOM array
            
            returns a list of all x-shuffleslide elements in the shuffledeck
            **/
            getAllSlides: function(){
                return _getAllSlides(this);
            },
            
            /** getSelectedSlide: => DOM/null
            
            returns the currently selected x-shuffleslide in the deck, if any
            **/
            getSelectedSlide: function(){
                return _getSelectedSlide(this);
            },
            
            /** getSlideIndex: (DOM) => Number
            *
            * returns the index of the given x-shuffleslide in the deck
            * returns -1 if the given slide does not exist in this deck
            **/
            getSlideIndex: function(slide){
                return _getSlideIndex(this, slide);
            }
            
        }
    });

    xtag.register("x-shuffleslide", {
        lifecycle:{
            inserted: function(){
                var deckContainer = this.parentNode;
                if (deckContainer){
                    if(deckContainer.tagName.toLowerCase() == 'x-shuffledeck')
                    {
                        init(deckContainer);
                        this.xtag.parentDeck = deckContainer;
                    }
                }                
                        
            },
            created: function(){
                var deckContainer = this.parentNode;
                if (deckContainer && 
                        deckContainer.tagName.toLowerCase() == 'x-shuffledeck')
                {
                    init(deckContainer);
                    this.xtag.parentDeck = deckContainer;
                }
            },
            removed: function(){
                if(!this.xtag.parentDeck){
                    return;
                }
                
                var shuffleDeck = this.xtag.parentDeck;
                init(shuffleDeck);
            },
            accessors:{
                "transition-override": {
                    attribute: {}
                }
            }
        }
    });
    
})();