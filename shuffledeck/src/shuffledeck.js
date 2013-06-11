(function(){
    function _makeSlideAnimatorFn(animationName){
        return function(shuffleDeck, oldSlide, newSlide, callbacks){
            _animateSlideReplacement(shuffleDeck, oldSlide, newSlide, 
                                     animationName, callbacks);
        };
    };

    /** transitionTypeData holds data on the transition-animating functions 
        used for different transition types
    
    Data is stored in format:
    
    <name of transition type> : {
        "forwardFn": a Function which defines how to animate a transition
                     
                     parameters are:
                        shuffleDeck      the current x-shuffledeck DOM element
                        oldSlide         the x-shuffleslide DOM element to be replaced
                        newSlide         the x-shuffleslide DOM element we are 
                                         transitioning to
                        callbacks        (optional) a data map with the 
                                         following possible options:
                                            before : a callback function taking
                                                     an oldSlide and a newSlide
                                                     to be called right 
                                                     after the slides are in 
                                                     their starting animation
                                                     positions, but before 
                                                     animating
                                           complete : a callback function taking
                                                      an oldSlide and a newSlide
                                                      to be called right after 
                                                      the slides are finished 
                                                      with their transition
                                                      animations
        "reverseFn" : (optional) a Function that takes the same parameters as
                      forwardFn does, but defines how to animate the reverse
                      version of a transition type. Will default to 
                      forwardFn if no reverseFn is defined
    }
    **/
    var transitionTypeData = {
        // transition in which no animations are performed at all 
        // (ie: an immediate jump to the new slide)
        "none": {
            forwardFn: function(shuffleDeck, oldSlide, newSlide, callbacks){
                // set up a helper function to handle calling the before
                // and complete callbacks
                var doCallbacks = function(){
                    if(callbacks.before){
                        callbacks.before(oldSlide, newSlide);
                    }
                    if(callbacks.complete){
                        callbacks.complete(oldSlide, newSlide);
                    }
                    xtag.fireEvent(shuffleDeck, "slideend");
                };
            
                if(!newSlide){
                    throw "new target slide is required for transition";
                }
                else{
                    doCallbacks(oldSlide, newSlide);
                }
            }
        },
        "scrollLeft": {
            forwardFn: _makeSlideAnimatorFn("scrollLeft"),
            reverseFn: function(shuffleDeck, oldSlide, newSlide, callbacks){
                transitionTypeData.scrollRight.forwardFn.apply(this, arguments);
            }
        },
        "scrollRight": {
            forwardFn: _makeSlideAnimatorFn("scrollRight"),
            reverseFn: function(shuffleDeck, oldSlide, newSlide, callbacks){
                transitionTypeData.scrollLeft.forwardFn.apply(this, arguments);
            }
        },
        "scrollUp": {
            forwardFn: _makeSlideAnimatorFn("scrollUp"),
            reverseFn: function(shuffleDeck, oldSlide, newSlide, callbacks){
                transitionTypeData.scrollDown.forwardFn.apply(this, arguments);
            }
        },
        "scrollDown": {
            forwardFn: _makeSlideAnimatorFn("scrollDown"),
            reverseFn: function(shuffleDeck, oldSlide, newSlide, callbacks){
                transitionTypeData.scrollUp.forwardFn.apply(this, arguments);
            }
        },
        "flipX": {
            forwardFn: _makeSlideAnimatorFn("flipX")
        },
        "flipY": {
            forwardFn: _makeSlideAnimatorFn("flipY")
        },
        
    };
    
    /** HELPERS **/
    
    /** posModulo : (Number, Number) => Number
    * hacky workaround to get Python-esque modding so that doing
    * negative modulos return positive numbers
    * ex: -5 % 3 should return 1 instead of -2
    **/
    function posModulo(x, divisor){
        return ((x % divisor) + divisor) % divisor;
    }
    
    /** _getAllSlides : (DOM) => DOM array
    
    simply returns a list of all x-shuffleslide DOM elements in the given DOM element
    **/
    function _getAllSlides(elem){
        return xtag.query(elem, "x-shuffleslide");
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
        return shuffleDeck.querySelector("[selected]");
    }
    
    function _getSlideIndex(shuffleDeck, slide){
        var allSlides = _getAllSlides(shuffleDeck);
        
        return allSlides.indexOf(slide);
    }
    
    
    
    /**  _animateSlideReplacement : (DOM, DOM, DOM, string, data map)
    
    given a transform data map and the callbacks to fire during an animation,
    will animate the transition of replacing oldSlide with newSlide in the given
    shuffleDeck
    
    params:
        shuffleDeck             the x-shuffledeck DOM element we are working in
        oldSlide                the x-shuffleslide DOM element we are replacing
        newSlide                the x-shuffleslide DOM element we are replacing with
        slideAnimName           the name of the animation type to use
        callbacks           (optional) a data map in the following format:
                            {
                                before : a callback function taking
                                         the oldSlide and newSlide
                                         to be called right 
                                         after the slides are in 
                                         their starting animation
                                         positions, but before 
                                         animating
                                complete : a callback function taking
                                          the oldSlide and newSlide
                                          to be called right after 
                                          the slides are finished 
                                          with their transition
                                          animations           
                            }              
    **/
    function _animateSlideReplacement(shuffleDeck, oldSlide, newSlide, 
                                      slideAnimName, callbacks){
        callbacks = (callbacks) ? callbacks : {};
        
        // abort redundant transitions
        if (newSlide === oldSlide){
            if(callbacks.complete){
                callbacks.complete(oldSlide, newSlide);
            }
            return;
        }    
        
        var oldSlideAtStart = false;
        var newSlideAtStart = false;
        var animationStarted = false;
        var _attemptBeforeCallback = function(){
            if(oldSlideAtStart && newSlideAtStart && callbacks.before){
                callbacks.before(oldSlide, newSlide);
            }
        };
        
        var _attemptAnimation = function(){
            if(animationStarted){
                return;
            }
            if(!(oldSlideAtStart && newSlideAtStart))
            {
                return;
            }
            animationStarted = true;
            
            var oldSlideDone = false;
            var newSlideDone = false;
            
            // create the listener to be fired after final animations 
            // complete
            var onTransitionComplete = function(e){
                if(e.target === oldSlide){
                    console.log("old slide done moving");
                    oldSlideDone = true;
                    oldSlide.removeEventListener("transitionend", 
                                                 onTransitionComplete);
                }
                else if(e.target === newSlide){
                    console.log("new slide done moving");
                    newSlideDone = true;
                    newSlide.removeEventListener("transitionend", 
                                                 onTransitionComplete);
                }
                
                if(oldSlideDone && newSlideDone){
                    // remove transforms to prevent them spilling beyond this scope
                    oldSlide.removeAttribute("slide-anim-type");
                    newSlide.removeAttribute("slide-anim-type");
                
                    // actually call the completion callback function
                    if(callbacks.complete){
                        callbacks.complete(oldSlide, newSlide);
                    }
                }
            };
            
            // wait for both to finish sliding before firing completion callback
            oldSlide.addEventListener('transitionend', onTransitionComplete);
            newSlide.addEventListener('transitionend', onTransitionComplete);
            
            // unleash the animation!
            oldSlide.removeAttribute("before-animation");
            newSlide.removeAttribute("before-animation");
        };
        
        
        xtag.skipTransition(oldSlide, function(){
            oldSlide.setAttribute("slide-anim-type", slideAnimName);
            oldSlide.setAttribute("before-animation", true);
            
            oldSlideAtStart = true;
            _attemptBeforeCallback();
            
            return _attemptAnimation;
        }, this);
        
        xtag.skipTransition(newSlide, function(){
            newSlide.setAttribute("slide-anim-type", slideAnimName);
            newSlide.setAttribute("before-animation", true);
            
            newSlideAtStart = true;
            _attemptBeforeCallback();
            
            // upon getting into position, perform scroll transitions
            return _attemptAnimation;
        }, this);
    }
    
    
    /** _replaceCurrSlide: (DOM, DOM, String, String)
    
    replaces the current slide in the shuffledeck with the given newSlide,
    using the transition animation defined by the parameters
    
    param:
        shuffleDeck             the x-shuffledeck DOM element we are working in
        newSlide                the x-shuffleslide DOM element we are replacing the
                                current slide with
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
                                once finished replacing slide
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
            console.log("defaulting to scrollLeft transition");
            
            transitionType = "scrollLeft";
        }
        else if(!(transitionType in transitionTypeData)){
            throw "invalid transitionType "+transitionType;
        }
        
        // pull appropriate transitioning animation functions
        var transitionData = transitionTypeData[transitionType];
        var forwardFn = transitionData.forwardFn;
        var reverseFn = transitionData.reverseFn;
        
        // reverseFn defaults to forwards animation if no 
        // reverse animation function is specified
        reverseFn = (reverseFn) ? reverseFn : forwardFn;
        
        var transitionFn;
        switch (progressType){
            case "forward":
                transitionFn = forwardFn;
                break;
            case "reverse":
                transitionFn = reverseFn;
                break;
            //case "auto":
            default:
                if(!oldSlide){
                    transitionFn = forwardFn;
                }
                var allSlides = _getAllSlides(shuffleDeck);
                if(allSlides.indexOf(newSlide) < allSlides.indexOf(oldSlide)){
                    transitionFn = reverseFn;
                }
                else{
                    transitionFn = forwardFn;
                }
                break;
        }
        
        // actually perform the transition
        transitionFn(shuffleDeck, oldSlide, newSlide, {
            // called when ready and at starting animation positions, 
            // but before transitioning
            before: function(oldSlide, newSlide){
                _getAllSlides(shuffleDeck).forEach(function(slide){
                    slide.removeAttribute("selected");
                    slide.removeAttribute("leaving");
                });
                // show both slides upon positioning into place
                oldSlide.setAttribute("leaving", true);
                newSlide.setAttribute("selected", true);
            },
            // called after transition animation is complete
            complete: function(oldSlide, newSlide){
                // for synchronization purposes, only set these attributes if 
                // the newSlide is actually the currently selected slide
                if(newSlide === _getSelectedSlide(shuffleDeck)){
                    // guarantee that attributes are consistent upon completion
                    _getAllSlides(shuffleDeck).forEach(function(slide){
                        slide.removeAttribute("selected");
                        slide.removeAttribute("leaving");
                    });
                    newSlide.setAttribute("selected", true);
                    if(callback){
                        callback();
                    }
                }
            }
        });
    }
    
    
    /** _slideToIndex: (DOM, Number, String, String)
    
    transitions to the slide at the given index in the shuffledeck, using the
    given animation type
    
    param:
        shuffleDeck             the x-shuffledeck DOM element we are working in
        targetIndex             the index of the x-shuffleslide we want to display
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
    
    also removes any temp-attributes used for animatoin
    **/
    function _sanitizeSlideAttrs(shuffleDeck){
        var slides = _getAllSlides(shuffleDeck);
        
        var currSlide = _getSelectedSlide(shuffleDeck);
        // if no slide is yet selected, choose the first available one      
        if((!currSlide) && slides.length > 0){
            currSlide = slides[0];
        }
        
        // ensure that only one slide is selected at a time
        slides.forEach(function(slide){
            slide.removeAttribute("leaving");
            slide.removeAttribute("before-animation");
            slide.removeAttribute("slide-anim-type");
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
            shuffleDeck.slideTo(_getAllSlides(shuffleDeck).indexOf(currSlide));
        }
    }
    
    
    xtag.register("x-shuffledeck", {
        lifecycle:{
            created: function(){
                init(this);
            }
        },
        events:{
            // tag fires a "slideend" event after transitions 
            // end on any current slide
            'transitionend:delegate(x-shuffleslide[selected])': function(e){
                if (e.target === this){
                  xtag.fireEvent(this, 'slideend');
                }
            }
        },
        accessors:{
            "transition-type":{
                attribute: {}
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
                _slideToIndex(this, index, this["transition-type"], 
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
            
            getAllSlides: function(){
                return _getAllSlides(this);
            },
            
            getSelectedSlide: function(){
                return _getSelectedSlide(this);
            },
            
            getSlideIndex: function(slide){
                return _getSlideIndex(this, slide);
            },
            
            appendSlide: function(newSlide){
                if(newSlide.nodeName.toLowerCase() === "x-shuffleslide"){
                    this.appendChild(newSlide);
                }
                else{
                    throw "given invalid element of type " + newSlide.nodeName;
                }
            },
            
            removeSlideFrom: function(index, callback){
                var slideToRemove = _getTargetSlide(this, index);
                
                if(!slideToRemove){
                    throw "attempted to remove slide at invalid index " + index;
                }
                
                var allSlides = _getAllSlides(this);
                var currSlide = _getSelectedSlide(this);
                
                var deleteFn = (function(shuffleDeck){
                    return function(){
                        console.log(shuffleDeck, slideToRemove);
                        shuffleDeck.removeChild(slideToRemove);
                        if(callback){
                            callback();
                        }
                    };
                })(this);
                
                if(currSlide === slideToRemove && allSlides.length > 1){
                    // if other slides exist, first move to another slide before
                    // removing the slide we want to get rid of in order
                    // to prevent graphical flickering that occurs when
                    // deleting the current slide out from under us
                    _slideToIndex(this, posModulo(index-1, allSlides.length),
                                  "none", "auto", deleteFn);
                }
                // otherwise, just immediately delete the slide without faffing
                // about
                else{
                    deleteFn();
                }
                
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
                    }
                }                
                        
            },
            created: function(){
                var deckContainer = this.parentNode;
                if (deckContainer && 
                        deckContainer.tagName.toLowerCase() == 'x-shuffledeck')
                {
                    init(deckContainer);
                }
            }
        }
    });
    
})();