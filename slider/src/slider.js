(function(){
    var TRANSFORM_NAME = xtag.prefix.js + "Transform";
    var KEYCODES = {
        37: "LEFT_ARROW",
        38: "UP_ARROW",
        39: "RIGHT_ARROW",
        40: "DOWN_ARROW"
    };
    
    /** isNum: (anything) => Boolean
    *
    * simple utility function to determine if a value is either a number or
    * a value representing a number
    *
    * ex: isNum(77) and isNum('77') both return true, but isNum('werg')
    * returns false
    **/
    function isNum(num){
        return !isNaN(parseFloat(num));
    }
    
    /** hasNumAttr: (DOM, string) => Boolean
    *
    * utility function returning true if the given element has a number as the
    * value of the specified attribute
    **/
    function hasNumAttr(elem, attrName){
        return (elem.hasAttribute(attrName) && 
                isNum(elem.getAttribute(attrName)));
    }

    /** roundToStep: (Number, Number) => Number
    *
    * given a value to round and the size of each step, round the given value to 
    * the closest multiple of the given step
    **/
    function roundToStep(value, step){
        if(!isNum(value)){
            throw "invalid value " + value;
        }
        if((!isNum(step)) || +step <= 0){
            throw "invalid step "+step;
        }
        
        return Math.round(value / step) * step;
    }
    
    
    /** getMidStep: (Number, Number, Number) => Number
    *
    * returns the multiple of the given step that is closest to the median of 
    * given range, while still remaining in the range
    **/
    function getMidStep(min, max, step){
        if(max < min) throw "invalid range: "+min+" - "+max;
        var roundedVal = roundToStep(((max - min) / 2) + min, step);
        return Math.max(min, Math.min(roundedVal, max));
    }
    
    
    /** _rawValToFraction: (DOM, Number) => Number
    *
    * returns a fractional value (ie: between 0.0 and 1.0) to which the given
    * value would correspond to on the given slider (ie: how far along the
    * slider the given value is
    **/
    function _rawValToFraction(slider, value){
        var min = slider.min;
        var max = slider.max;
        return (value - min) / (max - min);
    }
    
    /** _fractionToRawVal: (DOM, Number) => Number
    *
    * takes a fractional value (ie: between 0.0 and 1.0) and returns the raw
    * value that is that far along the slider's range
    **/
    function _fractionToRawVal(slider, fraction){
        var min = slider.min;
        var max = slider.max;
        return ((max - min) * fraction) + min;
    }
    
    /** _fractionToCorrectedVal: (DOM, Number) => Number
    *
    * returns the value at the given percentage along the slider, corrected
    * to account for step constraints
    **/
    function _fractionToCorrectedVal(slider, sliderFraction){
        sliderFraction = Math.min(Math.max(0.0, sliderFraction), 1.0);
        var rawVal = _fractionToRawVal(slider, sliderFraction);
        var roundedVal = roundToStep(rawVal, slider.step);
        return Math.max(slider.min, Math.min(roundedVal, slider.max));
    }
    
    function _positionThumb(slider, value){
        var thumb = slider.xtag.polyFillSliderThumb;
        
        if(!thumb){
            return;
        }
        var sliderRect = slider.getBoundingClientRect();
        var thumbRect = thumb.getBoundingClientRect();
        var fraction = _rawValToFraction(slider, value);
        
        // note that range inputs don't allow the thumb to spill past the bar
        // boundaries, so we actually have a little less width to work with
        // than the actual width of the slider when determining thumb position
        var availableWidth = Math.max(sliderRect.width - thumbRect.width, 0);
        
        newThumbX = (availableWidth * fraction);
        
        thumb.style[TRANSFORM_NAME] = "translateX("+newThumbX+"px)";
    }
    
    function _redraw(slider){
        _positionThumb(slider, slider.value);
    }

    function _onMouseInput(slider, pageX, pageY){
        var inputEl = slider.xtag.rangeInputEl;
        var inputOffsets = inputEl.getBoundingClientRect();
        var inputClickX = pageX - inputOffsets.left;
        
        var oldValue = slider.value;
        var newValue = _fractionToCorrectedVal(slider, 
                                              inputClickX / inputOffsets.width);
        
        slider.value = newValue;
        xtag.fireEvent(inputEl, "input");
        console.log(oldValue, slider.value);
        if(oldValue !== slider.value){
            xtag.fireEvent(inputEl, "change");
        }
        _redraw(slider);
    }
    
    function _onDragStart(slider, pageX, pageY){
        _onMouseInput(slider, pageX, pageY);
        
        var callbacks = slider.xtag.callbackFns;
        
        document.body.addEventListener("mousemove", callbacks.onMouseDragMove);
        document.body.addEventListener("touchmove", callbacks.onTouchDragMove);
        document.body.addEventListener("mouseup", callbacks.onDragEnd);
        document.body.addEventListener("touchend", callbacks.onDragEnd);
        
        var thumb = slider.xtag.polyFillSliderThumb;
        if(thumb){
            thumb.setAttribute("active", true);
        }
    }
    
    function _onDragMove(slider, pageX, pageY){
        _onMouseInput(slider, pageX, pageY);
    }
    
    function _makeCallbackFns(slider){
        return {
            "onMouseDragStart": function(e){
                _onDragStart(slider, e.pageX, e.pageY);
                
                e.preventDefault(); // disable selecting elements while dragging
            },
            
            "onTouchDragStart": function(e){
                var touches = e.targetTouches;
                if(touches.length !== 1){
                    return;
                }
                
                _onDragStart(slider, touches[0].pageX, touches[0].pageY);
                e.preventDefault();
            },
            
            "onMouseDragMove": function(e){
                _onDragMove(slider, e.pageX, e.pageY);
            },
            
            "onTouchDragMove": function(e){
                 var touches = e.targetTouches;
                 if(touches.length !== 1){
                     return;
                 }
                 _onDragMove(slider, touches[0].pageX, touches[0].pageY);
            },
            
            "onDragEnd": function(e){
                var callbacks = slider.xtag.callbackFns;
            
                document.body.removeEventListener("mousemove", callbacks.onMouseDragMove);
                document.body.removeEventListener("touchmove", callbacks.onTouchDragMove);
                document.body.removeEventListener("mouseup", callbacks.onDragEnd);
                document.body.removeEventListener("touchend", callbacks.onDragEnd);
                
                var thumb = slider.xtag.polyFillSliderThumb;
                if(thumb){
                    thumb.removeAttribute("active");
                }
            },
            
            "onKeyDown": function(e){
                if(e.keyCode in KEYCODES){
                    var oldVal = this.value;
                    var step = this.step;
                    
                    switch(KEYCODES[e.keyCode]){
                        case "LEFT_ARROW":
                        case "DOWN_ARROW":
                            this.value = oldVal - step;
                            break;
                        case "RIGHT_ARROW":
                        case "UP_ARROW":
                            this.value = oldVal + step;
                            break;
                        default:
                            break;
                    }
                    
                    if(this.value !== oldVal){
                        xtag.fireEvent(this, "change");
                    }
                    
                    e.preventDefault();
                }
            }
        };
    }
    
    xtag.register("x-slider", {
        lifecycle: {
            created: function(){
                this.xtag.callbackFns = _makeCallbackFns(this);
            
                /* create and initialize attributes of input */
                var input = document.createElement("input");
                xtag.addClass(input, "input");
                input.setAttribute("type", "range");
                
                // constrain initial attribute values
                var initMax = (hasNumAttr(this, "max")) ? 
                                +this.getAttribute("max") : 100;
                                
                var initMin = (hasNumAttr(this, "min")) ? 
                                +this.getAttribute("min") : 0;
                                
                var initStep = (hasNumAttr(this, "step")) ? 
                                +this.getAttribute("step") : 1;
                // steps must also be strictly positive
                initStep = (initStep > 0) ? initStep : 1;
                
                var initVal = (hasNumAttr(this, "value")) ? 
                                +this.getAttribute("value") : 
                                getMidStep(initMin, initMax, initStep);
                
                // because the x-slider accessors read from the input element's
                // attributes, make sure to actually set them
                input.setAttribute("max", initMax);
                input.setAttribute("min", initMin);
                input.setAttribute("step", initStep);
                input.setAttribute("value", initVal);
                
                // finally, actually add the the input to the x-slider
                this.xtag.rangeInputEl = input;
                this.appendChild(this.xtag.rangeInputEl);
                
                this.xtag.polyFillSliderThumb = null;
                
                // range support check
                if(input.type === "range"){
                    this.removeAttribute("polyfill");
                }
                // otherwise, set up and apply polyfill
                else{
                    this.setAttribute("polyfill", true);
                }
                
                _redraw(this);
            },
            attributeChanged: function(){
                _redraw(this);
            }
        },
        events: {
            'change:delegate(input[type=range])': function(e){},
            'input:delegate(input[type=range])': function(e){},
            'focus': function(e){},
            'blur': function(e){}
        },
        accessors: {
            "polyfill": {
                attribute: {boolean: true},
                set: function(isPolyfill){
                    var callbackFns = this.xtag.callbackFns;
                    
                    // create polyfill thumb element if missing; 
                    // otherwise CSS takes care of unhiding it
                    if(isPolyfill){
                        // make the slider focusable, not the underlying input
                        this.setAttribute("tabindex", 0);
                        this.xtag.rangeInputEl.setAttribute("tabindex", -1);
                        this.xtag.rangeInputEl.setAttribute("readonly", true);
                        
                        if(!this.xtag.polyFillSliderThumb){
                            var sliderThumb = document.createElement("span");
                            xtag.addClass(sliderThumb, "slider-thumb");
                            
                            this.xtag.polyFillSliderThumb = sliderThumb;
                            this.appendChild(sliderThumb);
                        }
                        this.addEventListener("mousedown", callbackFns.onMouseDragStart);
                        this.addEventListener("touchstart", callbackFns.onTouchDragStart);
                        this.addEventListener("keydown", callbackFns.onKeyDown);
                    }
                    // simply hide the polyfill element
                    else{
                        this.removeAttribute("tabindex");
                        this.xtag.rangeInputEl.removeAttribute("tabindex");
                        this.xtag.rangeInputEl.removeAttribute("readonly");
                        this.removeEventListener("mousedown", callbackFns.onMouseDragStart);
                        this.removeEventListener("touchstart", callbackFns.onTouchDragStart);
                        this.removeEventListener("keydown", callbackFns.onKeyDown);
                    }
                }
            },
            "max": {
                attribute: {
                    selector: "input[type=range]"
                },
                get: function(){
                    return +this.xtag.rangeInputEl.getAttribute("max");
                }
            },
            "min": {
                attribute: {
                    selector: "input[type=range]"
                },
                get: function(){
                    return +this.xtag.rangeInputEl.getAttribute("min");
                }
            },
            "step": {
                attribute: {
                    selector: "input[type=range]"
                },
                get: function(){
                    return +this.xtag.rangeInputEl.getAttribute("step");
                }
            },
            "value": {
                attribute: {
                    selector: "input[type=range]"
                },
                get: function(){
                    return +this.xtag.rangeInputEl.value;
                },
                set: function(newVal){
                    if(!isNum(newVal)){
                        newVal = getMidStep(this.min, this.max, this.step);
                    }
                    
                    newVal = +newVal;
                    var min = this.min;
                    var max = this.max;
                    var step = this.step;
                
                    newVal = roundToStep(newVal, step);
                    newVal = Math.max(min, Math.min(newVal, max));
                
                    this.xtag.rangeInputEl.value = newVal;
                    _redraw(this);
                }
            },
            "name": {
                attribute: {
                    selector: "input[type=range]"
                }
            },
            
            "required": {
                attribute: {
                    selector: "input[type=range]"
                }
            },
            
            "inputElem": {
                get: function(){
                    return this.xtag.rangeInputEl;
                }
            }
        },
        methods: {}
    });

})();