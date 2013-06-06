(function(){
    // browser-specific name of the transform css property
    var transformPropName = xtag.prefix.js + "Transform";
    
    // holds data on the transition functions used for different transition types
    var transitionTypeData = {
        "scrollLeft": {
            forwardFn: function(slideBox, oldSlide, newSlide, completeCallback){
                _scrollTransition(slideBox, oldSlide, newSlide, "left", completeCallback);
            },
            reverseFn: function(slideBox, oldSlide, newSlide, completeCallback){
                transitionTypeData['scrollRight'].forwardFn.apply(this, arguments);
            }
        },
        "scrollRight": {
            forwardFn: function(slideBox, oldSlide, newSlide, completeCallback){
                _scrollTransition(slideBox, oldSlide, newSlide, "right", completeCallback);
            },
            reverseFn: function(slideBox, oldSlide, newSlide, completeCallback){
                transitionTypeData['scrollLeft'].forwardFn.apply(this, arguments);
            }
        },
        "scrollUp": {
            forwardFn: function(slideBox, oldSlide, newSlide, completeCallback){
                _scrollTransition(slideBox, oldSlide, newSlide, "up", completeCallback);
            },
            reverseFn: function(slideBox, oldSlide, newSlide, completeCallback){
                transitionTypeData['scrollDown'].forwardFn.apply(this, arguments);
            }
        },
        "scrollDown": {
            forwardFn: function(slideBox, oldSlide, newSlide, completeCallback){
                _scrollTransition(slideBox, oldSlide, newSlide, "down", completeCallback);
            },
            reverseFn: function(slideBox, oldSlide, newSlide, completeCallback){
                transitionTypeData['scrollUp'].forwardFn.apply(this, arguments);
            }
        }
    }
    
    // hacky workaround to get Python-esque modding so that doing
    // negative mods returns a positive number
    // ex: -5 % 3 should return 1 instead of -2
    function posModulo(x, divisor){
        return ((x % divisor) + divisor) % divisor;
    }
    
    // transition function for scroll-type transitions
    // essentially places the new slide next to the current slide and moves 
    // both over
    // with CSS translates
    function _scrollTransition(slideBox, oldSlide, newSlide, 
                               incomingDir, completeCallback){
        // abort redundant transitions and simply place into correct spot
        if (newSlide === oldSlide){
            // skip any transitions and immediately place slide into 
            // butting up against the top-left corner
            xtag.skipTransition(oldSlide, function(){
                oldSlide.style[transformPropName] = "translate(0%, 0%)";
                // trigger completion callback after placing redundant slide
                return function(){
                    completeCallback(oldSlide, newSlide);
                }
            }, this);
            return;
        }                               
        
        // set default transform targets
        var oldStartingTransform = {x: "0%", y: "0%"};
        var oldEndingTransform = {x: "0%", y: "0%"};
        var newStartingTransform = {x: "0%", y: "0%"};
        var newEndingTransform = {x: "0%", y: "0%"};                
        
        switch(incomingDir){
            case "down":
                newStartingTransform.y = "-100%"; // go from top to bottom
                oldEndingTransform.y = "100%"; 
                break;
            case "up":
                newStartingTransform.y = "100%"; // go from bottom to top
                oldEndingTransform.y = "-100%"; 
                break;
            case "right":
                newStartingTransform.x = "-100%"; // go from left to right
                oldEndingTransform.x = "100%";
                break;
            case "left":
            default:
                newStartingTransform.x = "100%"; // go from right to left
                oldEndingTransform.x = "-100%";
                break;
        }
        
        // helper function to apply a transform {x, y} data object to the
        // css transition property of the given DOM element
        var _applyTransform = function(targetElem, transformData){
            var xStr = (transformData.hasOwnProperty("x")) ? 
                            "translateX("+transformData.x+")": "";
            var yStr = (transformData.hasOwnProperty("y")) ? 
                            "translateY("+transformData.y+")": "";
                            
            var finalTransformStr = xStr + " " + yStr;
            targetElem.style[transformPropName] = finalTransformStr;
        }
        
        // immediately place the old and new slides into their starting positions
        // where they will be scrolling from
        xtag.skipTransition(oldSlide, function(){
            xtag.skipTransition(newSlide, function(){
                _applyTransform(oldSlide, oldStartingTransform);
                _applyTransform(newSlide, newStartingTransform);
                
                console.log(oldSlide, newSlide, oldStartingTransform, newStartingTransform, newSlide.style[transformPropName]);
                // upon getting into position, perform scroll transitions
                return function(){
                    _applyTransform(oldSlide, oldEndingTransform);
                    _applyTransform(newSlide, newEndingTransform);
                    
                    // mark selection before scrolling to give illusion
                    // that active screen is replacing old screen
                    // 
                    // also ensure that only the newSlide is selected
                    _getAllSlides(slideBox).forEach(function(slide){
                        slide.removeAttribute("selected");
                    });
                    newSlide.removeAttribute("hiddenfoo");
                    newSlide.setAttribute("selected", true);
                    console.log(newSlide);
                    
                    // wait for both to finish sliding before firing completion callback
                    // TODO: waiting not yet implemented, see if there's a proper xtag helper for this before rolling own implementation
                    window.setTimeout(function(){completeCallback(oldSlide, newSlide);}, 500);
                };
            }, this);
        }, this);
    }
    
    function _getAllSlides(slideBox){
        return xtag.query(slideBox, "x-slide");
    }
    
    // return the slide at the current index
    function _getTargetSlide(slideBox, targetIndex){
        var slides = _getAllSlides(slideBox);
        
        return (targetIndex < 0 || targetIndex >= slides.length) ? 
                    null : slides[targetIndex];
    }
    
    function _getCurrSlide(slideBox){
        return slideBox.querySelector("[selected]");
    }
    
    function _replaceCurrSlide(slideBox, newSlide, transitionType, isReverse){
        var oldSlide = _getCurrSlide(slideBox);
        
        if(!(transitionType in transitionTypeData)){
            console.log("invalid transitionType, defaulting to scrollLeft");
            transitionType = "scrollLeft";
        }
        
        // pull appropriate transitioning animation functions
        // default to forwards animation if no reverse animation is specified
        var transitionData = transitionTypeData[transitionType];
        
        var transitionFn;
        if(isReverse && transitionData["reverseFn"]){
            transitionFn = transitionData["reverseFn"];
        }
        else{
            transitionFn = transitionData["forwardFn"];
        }
        
        // show both slides before calling transition function
        oldSlide.removeAttribute("hiddenfoo");
        newSlide.removeAttribute("hiddenfoo");
        
        transitionFn(slideBox, oldSlide, newSlide, function(oldSlide, newSlide){
            // guarantee that attributes are consistent upon completion
            _getAllSlides(slideBox).forEach(function(slide){
                slide.removeAttribute("selected");
            });
            oldSlide.setAttribute("hiddenfoo", true);
            oldSlide.removeAttribute("selected");
            newSlide.setAttribute("selected", true);
            newSlide.removeAttribute("hiddenfoo");
        });
    }
    
    function _slideTo(slideBox, targetIndex, transitionType, isReverse){
        var newSlide = _getTargetSlide(slideBox, targetIndex);
        if(!newSlide) return;
        
        _replaceCurrSlide(slideBox, newSlide, transitionType, isReverse);
    }
    
    // relies on caller to provide scope
    function init(){
        var slides = _getAllSlides(this);
                
        // if no slide is yet selected, choose the first available one      
        if((!_getCurrSlide(this)) && slides.length > 0){
            slides[0].setAttribute("selected", true);
        }
        
        slides.forEach(function(slide){
            if(!slide.hasAttribute("selected")){
                slide.setAttribute("hiddenfoo", true);
            }
        });
        
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
            slideTo: function(index, isReverse){
                _slideTo(this, index, this["transition-type"], isReverse);
            },
            slideNext: function(){
                var slides = _getAllSlides(this);
                var currSlide = _getCurrSlide(this);
                var currIndex = slides.indexOf(currSlide);
                
                if(currIndex > -1){
                    this.slideTo(posModulo(currIndex+1, slides.length));
                }
            },
            slidePrev: function(){
                var slides = _getAllSlides(this);
                var currSlide = _getCurrSlide(this);
                var currIndex = slides.indexOf(currSlide);
                if(currIndex > -1){
                    this.slideTo(posModulo(currIndex-1, slides.length), true);
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
                console.log("insert start");
                var deckContainer = this.parentNode;
                if (deckContainer && deckContainer.tagName.toLowerCase() == 'x-shuffledeck'){
                    init.call(deckContainer);
                    console.log("inserted", this);
                }
                console.log("insert end");
            },
            created: function(e){
                var deckContainer = this.parentNode;
                if (deckContainer && deckContainer.tagName.toLowerCase() == 'x-shuffledeck'){
                    init.call(deckContainer);
                    console.log("created", this);
                }
            }
        }
    });
    
})();