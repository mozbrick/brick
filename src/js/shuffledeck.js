(function(){
    // browser-specific name of the transform css property
    var transformPropName = xtag.prefix.js + "Transform";
    
    // holds data on the transition functions used for different transition types
    var transitionTypeData = {
        "scrollLeft": {
            forwardFn: function(slideBox, oldSlide, newSlide, callbacks){
                _replaceWithScroll(slideBox, oldSlide, newSlide, "left", callbacks);
            },
            reverseFn: function(slideBox, oldSlide, newSlide, callbacks){
                transitionTypeData['scrollRight'].forwardFn.apply(this, arguments);
            }
        },
        "scrollRight": {
            forwardFn: function(slideBox, oldSlide, newSlide, callbacks){
                _replaceWithScroll(slideBox, oldSlide, newSlide, "right", callbacks);
            },
            reverseFn: function(slideBox, oldSlide, newSlide, callbacks){
                transitionTypeData['scrollLeft'].forwardFn.apply(this, arguments);
            }
        },
        "scrollUp": {
            forwardFn: function(slideBox, oldSlide, newSlide, callbacks){
                _replaceWithScroll(slideBox, oldSlide, newSlide, "up", callbacks);
            },
            reverseFn: function(slideBox, oldSlide, newSlide, callbacks){
                transitionTypeData['scrollDown'].forwardFn.apply(this, arguments);
            }
        },
        "scrollDown": {
            forwardFn: function(slideBox, oldSlide, newSlide, callbacks){
                _replaceWithScroll(slideBox, oldSlide, newSlide, "down", callbacks);
            },
            reverseFn: function(slideBox, oldSlide, newSlide, callbacks){
                transitionTypeData['scrollUp'].forwardFn.apply(this, arguments);
            }
        }
    }
    
    /** HELPERS **/
    
    // hacky workaround to get Python-esque modding so that doing
    // negative mods returns a positive number
    // ex: -5 % 3 should return 1 instead of -2
    function posModulo(x, divisor){
        return ((x % divisor) + divisor) % divisor;
    }
    
    
    function _getAllSlides(slideBox){
        return xtag.query(slideBox, "x-slide");
    }
    
    // return the slide at the current index
    // returns null if no such slide exists
    function _getTargetSlide(slideBox, targetIndex){
        var slides = _getAllSlides(slideBox);
        
        return (targetIndex < 0 || targetIndex >= slides.length) ? 
                    null : slides[targetIndex];
    }
    
    function _getCurrSlide(slideBox){
        return slideBox.querySelector("[selected]");
    }
    
    /** transition functions **/
    
    // helper function to apply a transform data object to the
    // css transition property of the given DOM element
    var _applyTransform = function(targetElem, transformData){
        var finalTransformStrs = [];
        
        for (var transformName in transformData){
            var transformValue = transformData[transformName];
            finalTransformStrs.push(transformName+"("+transformValue+")");
        }
                        
        targetElem.style[transformPropName] = finalTransformStrs.join(" ");
    }
    
    function _animateSlideReplacement(slideBox, oldSlide, newSlide, transforms, callbacks){
        var oldStartingTransform = ("oldStartingTransform" in transforms) ?
                transforms["oldStartingTransform"] : {};
        var newStartingTransform = ("newStartingTransform" in transforms) ?
                transforms["newStartingTransform"] : {};
        var oldEndingTransform = ("oldEndingTransform" in transforms) ?
                transforms["oldEndingTransform"] : {};
        var newEndingTransform = ("newEndingTransform" in transforms) ?
                transforms["newEndingTransform"] : {};
                
        callbacks = (callbacks) ? callbacks : {};
        
        // abort redundant transitions
        if (newSlide === oldSlide){
            return;
        }    
        
        // if no need for old slide exists, immediately place new slide in correct spot 
        // and abort remaining animation calculations
        if(!oldSlide){
            xtag.skipTransition(newSlide, function(){
                _applyTransform(newSlide, newEndingTransform);
                
                return function(){
                    if(callbacks.complete){
                        callbacks.complete(oldSlide, newSlide);
                    }
                }
            }, this);
            return;
        }
        
        // immediately place the old and new slides into their starting positions
        // where they will be scrolling from
        xtag.skipTransition(oldSlide, function(){
            xtag.skipTransition(newSlide, function(){
                _applyTransform(oldSlide, oldStartingTransform);
                _applyTransform(newSlide, newStartingTransform);
                
                // upon getting into position, perform scroll transitions
                return function(){
                    if(callbacks.before){
                        callbacks.before(oldSlide, newSlide);
                    }
                    var oldSlideDone = false;
                    var newSlideDone = false;
                    
                    // listener to be fired after final animations complete
                    var onTransitionComplete = function(e){
                        if(e.target === oldSlide){
                            oldSlideDone = true;
                            oldSlide.removeEventListener("transitionend", onTransitionComplete);
                        }
                        else if(e.target === newSlide){
                            newSlideDone = true;
                            newSlide.removeEventListener("transitionend", onTransitionComplete);
                        }
                        
                        if(oldSlideDone && newSlideDone){
                            // actually call the completion callback function
                            if(callbacks.complete){
                                callbacks.complete(oldSlide, newSlide);
                            }
                        }
                    }
                    
                    // wait for both to finish sliding before firing completion callback
                    oldSlide.addEventListener('transitionend', onTransitionComplete);
                    newSlide.addEventListener('transitionend', onTransitionComplete);
                    
                    _applyTransform(oldSlide, oldEndingTransform);
                    _applyTransform(newSlide, newEndingTransform);
                };
            }, this);
        }, this);
    }
    
    // transition function for scroll-type transitions
    // essentially places the new slide next to the current slide and moves 
    // both over simultaneously with CSS translates
    function _replaceWithScroll(slideBox, oldSlide, newSlide, 
                               incomingDir, callbacks){
                       
        
        // set default transform targets
        var oldStartingTransform = {translateX: "0%", translateY: "0%"};
        var oldEndingTransform = {translateX: "0%", translateY: "0%"};
        var newStartingTransform = {translateX: "0%", translateY: "0%"};
        var newEndingTransform = {translateX: "0%", translateY: "0%"};                
        
        switch(incomingDir){
            case "down":
                newStartingTransform.translateY = "-100%"; // go from top to bottom
                oldEndingTransform.translateY = "100%"; 
                break;
            case "up":
                newStartingTransform.translateY = "100%"; // go from bottom to top
                oldEndingTransform.translateY = "-100%"; 
                break;
            case "right":
                newStartingTransform.translateX = "-100%"; // go from left to right
                oldEndingTransform.translateX = "100%";
                break;
            case "left":
            default:
                newStartingTransform.translateX = "100%"; // go from right to left
                oldEndingTransform.translateX = "-100%";
                break;
        }
        
        var transforms = {
            "oldStartingTransform": oldStartingTransform,
            "newStartingTransform": newStartingTransform,
            "oldEndingTransform": oldEndingTransform,
            "newEndingTransform": newEndingTransform
        };
        
        _animateSlideReplacement(slideBox, oldSlide, newSlide, transforms, callbacks);
    }
    
    /**
    param:
        progressType            if "forward", slide will use forwards animation
                                if "reverse", slide will use reverse animation
                                if "auto", slide will use forward animation if
                                the target's is further ahead and reverse if
                                it is farther behind (default option)
    **/
    function _replaceCurrSlide(slideBox, newSlide, transitionType, progressType){
        var oldSlide = _getCurrSlide(slideBox);
        
        if(!(transitionType in transitionTypeData)){
            console.log("invalid transitionType, defaulting to scrollLeft");
            transitionType = "scrollLeft";
        }
        
        // pull appropriate transitioning animation functions
        var transitionData = transitionTypeData[transitionType];
        var forwardFn = transitionData["forwardFn"];
        var reverseFn = transitionData["reverseFn"];
        
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
            case "auto":
            default:
                if(!oldSlide){
                    transitionFn = forwardFn;
                }
                var allSlides = _getAllSlides(slideBox);
                if(allSlides.indexOf(newSlide) < allSlides.indexOf(oldSlide)){
                    transitionFn = reverseFn;
                }
                else{
                    transitionFn = forwardFn;
                }
                break;
        }
        
        
        transitionFn(slideBox, oldSlide, newSlide, {
            // called when ready and at starting animation positions, 
            // but before transitioning
            before: function(oldSlide, newSlide){
                _getAllSlides(slideBox).forEach(function(slide){
                    slide.removeAttribute("selected");
                    slide.removeAttribute("leaving");
                });
                // show both slides upon positioning into place
                oldSlide.setAttribute("leaving", true);
                newSlide.setAttribute("selected", true);
            },
            // called after transition animation is complete
            complete: function(oldSlide, newSlide){
                // guarantee that attributes are consistent upon completion
                
                _getAllSlides(slideBox).forEach(function(slide){
                    slide.removeAttribute("selected");
                    slide.removeAttribute("leaving");
                });
                
                newSlide.setAttribute("selected", true);
            }
        });
    }
    
    function _slideToIndex(slideBox, targetIndex, transitionType, progressType){
        var newSlide = _getTargetSlide(slideBox, targetIndex);
        
        if(!newSlide) return;
            
        _replaceCurrSlide(slideBox, newSlide, transitionType, progressType);
    }
    
    // relies on caller to provide scope
    function init(){
        var slides = _getAllSlides(this);
        
        var currSlide = _getCurrSlide(this);
        // if no slide is yet selected, choose the first available one      
        if((!currSlide) && slides.length > 0){
            currSlide = slides[0];
        }
        
        // ensure that only one slide is selected at a time
        slides.forEach(function(slide){
            slide.removeAttribute("leaving");
            
            if(slide !== currSlide){
                slide.removeAttribute("selected");
            }
        });
        
        if(currSlide){
            currSlide.setAttribute("selected", true);
        }
        
        // ensure that selected 
        this.slideTo(_getAllSlides(this).indexOf(_getCurrSlide(this)));
    }
    
    xtag.register("x-shuffledeck", {
        lifecycle:{
            created: function(){
                init.call(this);
            }
        },
        events:{
            // tag fires a slide end event after transitions end on any current slide
            'transitionend:delegate(x-slide[selected])': function(e){
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
            slideTo: function(index, progressType){
                _slideToIndex(this, index, this["transition-type"], progressType);
            },
            slideNext: function(){
                var slides = _getAllSlides(this);
                var currSlide = _getCurrSlide(this);
                var currIndex = slides.indexOf(currSlide);
                
                if(currIndex > -1){
                    this.slideTo(posModulo(currIndex+1, slides.length), "forward");
                }
            },
            slidePrev: function(){
                var slides = _getAllSlides(this);
                var currSlide = _getCurrSlide(this);
                var currIndex = slides.indexOf(currSlide);
                if(currIndex > -1){
                    this.slideTo(posModulo(currIndex-1, slides.length), "reverse");
                }
            },
            getAllSlides: function(){
                return _getAllSlides(this);
            },
            getCurrSlide: function(){
                return _getCurrSlide(this);
            }
        }
    });

    xtag.register("x-slide", {
        lifecycle:{
            inserted: function(){
                var deckContainer = this.parentNode;
                if (deckContainer && deckContainer.tagName.toLowerCase() == 'x-shuffledeck'){
                    init.call(deckContainer);
                }
            },
            created: function(e){
                var deckContainer = this.parentNode;
                if (deckContainer && deckContainer.tagName.toLowerCase() == 'x-shuffledeck'){
                    init.call(deckContainer);
                }
            }
        }
    });
    
})();