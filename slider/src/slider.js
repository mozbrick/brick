(function(){
    var TRANSFORM_NAME = xtag.prefix.js + "Transform";
    var KEYCODES = {
        33: "PAGE_UP",
        34: "PAGE_DOWN",
        35: "END",
        36: "HOME",
        37: "LEFT_ARROW",
        38: "UP_ARROW",
        39: "RIGHT_ARROW",
        40: "DOWN_ARROW"
    };    
    var LEFT_MOUSE_BTN = 0;

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

    /** roundToStep: (Number, Number, Number, Function) => Number
    *
    * given a value to round and the size of each step, round the given value to 
    * the closest multiple of the given step, accounting for the offset
    * provided for the given range (ie: so that the steps are in terms of 
    * distance from the range minimum. So, a range of min = 3 and step = 5 
    * should round to to 3, 8, 13, etc instead of 5, 10, 15, etc.)
    * 
    * params:
    *   rawRangeVal             the raw value that we want to round
    *   step                    the spacing between valid steps
    *   rangeMin                (optional) the starting value of the valid range
    *                           defaults to 0
    *   roundFn                 (optional) The rounding function to use in
    *                           in determining closest steps
    *                           defaults to Math.round
    **/
    function roundToStep(rawRangeVal, step, rangeMin, roundFn){
        roundFn = (roundFn) ? roundFn : Math.round;
        rangeMin = (rangeMin != undefined) ? rangeMin : 0;
        
        if(!isNum(rawRangeVal)){
            throw "invalid value " + rawRangeVal;
        }
        if((!isNum(step)) || +step <= 0){
            throw "invalid step "+step;
        }
        return roundFn((rawRangeVal - rangeMin) / step) * step + rangeMin;
    }
    
    
    /** constrainToSteppedRange: (Number, Number, Number, Number) => Number
    *
    * given a value and range parameters, constrains the 
    * value to the given range by following these rules:
    *   - if the value is too small for the range, return the range minimum
    *   - if the value is too big for the range, return the largest stepped
    *     value that is less than the range maximum
    **/
    function constrainToSteppedRange(value, min, max, step){
        if(max < min){
            return min;
        }
        else if(value < min){
            return min;
        }
        else if(value > max){
            // return the largest number that is a multiple of step away from
            // the range start, but is still under the max
            return Math.max(min, roundToStep(max, step, min, Math.floor));
        }
        else{
            return value;
        }
    }
    
    
    /** getDefaultVal: (Number, Number, Number) => Number
    *
    * returns the multiple of the given step that is closest to the median of 
    * given range, while still remaining in the range
    **/
    function getDefaultVal(min, max, step){
        if(max < min) throw "invalid range: "+min+" - "+max;
        var roundedVal = roundToStep(((max - min) / 2) + min, step, min);
        return constrainToSteppedRange(roundedVal, min, max, step);
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
    * to account for step constraints, as well as the offset caused
    * by the range minimum
    **/
    function _fractionToCorrectedVal(slider, sliderFraction){
        sliderFraction = Math.min(Math.max(0.0, sliderFraction), 1.0);
        
        var rawVal = _fractionToRawVal(slider, sliderFraction);
        
        // temporarily translate the range to start at zero for the step
        // rounding, then add back in the minimum so that the step is always in
        // relation to the start of the range, instead of starting partially
        // within the range
        var roundedVal = roundToStep(rawVal, slider.step, slider.min);
        
        return constrainToSteppedRange(roundedVal, slider.min, slider.max, 
                                       slider.step);
    }
    
    
    /** _positionThumb: (DOM, Number)
    *
    * given a value on the slider, position the polyfill thumb graphic element
    * to be centered on the given value
    **/
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
    
    
    /** _redraw: DOM
    *
    * when called, refreshes the graphics of the polyfill slider
    **/
    function _redraw(slider){
        _positionThumb(slider, slider.value);
    }

    
    /** _onMouseInput: (DOM, Number, Number)
    *
    * given the slider and absolute coordinates, reposition the polyfill
    * slider to match the closest valid value on the slider to the mouse
    * coordinates
    *
    * fires 'input' event, also fires 'change' if the value changes
    *
    * params
    *    slider                     the x-slider element to reposition
    *    pageX                      the page absolute x-coordinate of the mouse
    *    pageY                      the page absolute y-coordinate of the mouse
    **/
    function _onMouseInput(slider, pageX, pageY){
        var inputEl = slider.xtag.rangeInputEl;
        var inputOffsets = inputEl.getBoundingClientRect();
        var inputClickX = pageX - inputOffsets.left;
        
        var oldValue = slider.value;
        var newValue = _fractionToCorrectedVal(slider, 
                                              inputClickX / inputOffsets.width);
        
        slider.value = newValue;
        
        // fire events
        xtag.fireEvent(inputEl, "input");
        if(oldValue !== slider.value){
            xtag.fireEvent(inputEl, "change");
        }
        _redraw(slider);
    }
    
    
    /** _onDragStart: (DOM, Number, Number)
    *
    * called when the user begins dragging the the polyfill slider,
    * positions the slider to match the given aboslute mouse coordinates and 
    * sets up callbacks functions for handling the rest of the drag
    **/
    function _onDragStart(slider, pageX, pageY){
        _onMouseInput(slider, pageX, pageY);
        
        var callbacks = slider.xtag.callbackFns;
        
        document.body.addEventListener("mousemove", callbacks.onMouseDragMove);
        document.body.addEventListener("touchmove", callbacks.onTouchDragMove);
        document.body.addEventListener("mouseup", callbacks.onDragEnd);
        document.body.addEventListener("touchend", callbacks.onDragEnd);
        
        var thumb = slider.xtag.polyFillSliderThumb;
        // set flag to allow CSS stylings to apply
        if(thumb){
            thumb.setAttribute("active", true);
        }
    }
    
    
    /** _onDragMove: (DOM, Number, Number)
    *
    * handles how to update the slider when the cursor is moved during a slider
    * drag, based on the given page absolute mouse coordinates
    **/
    function _onDragMove(slider, pageX, pageY){
        _onMouseInput(slider, pageX, pageY);
    }
    
    
    /** _makeCallbackFns: (DOM) => datamap
    *
    * given a x-slider element, returns a dictionary of callback functions
    * to use when attaching/removing event listeners for controlling the
    * polyfill slider
    *
    * we create these once on slider creation so that we are able to easily
    * attach and remove event listeners without repeatedly creating the
    * same function again and again
    **/
    function _makeCallbackFns(slider){
        return {
            // function to call on a mousedown
            "onMouseDragStart": function(e){
                if(e.button !== LEFT_MOUSE_BTN){
                    return;
                }
            
                _onDragStart(slider, e.pageX, e.pageY);
                
                e.preventDefault(); // disable selecting elements while dragging
            },
            
            // function to call on a touchstart
            "onTouchDragStart": function(e){
                var touches = e.targetTouches;
                if(touches.length !== 1){
                    return;
                }
                
                _onDragStart(slider, touches[0].pageX, touches[0].pageY);
                e.preventDefault();
            },
            
            // function to call on a mousemove during a drag
            "onMouseDragMove": function(e){
                _onDragMove(slider, e.pageX, e.pageY);
            },
            
            // function to call on a touchmove during a drag
            "onTouchDragMove": function(e){
                 var touches = e.targetTouches;
                 if(touches.length !== 1){
                     return;
                 }
                 _onDragMove(slider, touches[0].pageX, touches[0].pageY);
            },
            
            // function to call on the end of a drag (whether mouse or touch)
            // removes listeners for handling drag
            "onDragEnd": function(e){
                var callbacks = slider.xtag.callbackFns;
            
                document.body.removeEventListener("mousemove", 
                                                  callbacks.onMouseDragMove);
                document.body.removeEventListener("touchmove", 
                                                  callbacks.onTouchDragMove);
                document.body.removeEventListener("mouseup", 
                                                  callbacks.onDragEnd);
                document.body.removeEventListener("touchend", 
                                                  callbacks.onDragEnd);
                
                var thumb = slider.xtag.polyFillSliderThumb;
                if(thumb){
                    thumb.removeAttribute("active");
                }
            },
            
            // function to call when the polyfill slider receives key inputs,
            // allowing keyboard controls
            "onKeyDown": function(e){
                if(e.keyCode in KEYCODES){
                    var oldVal = this.value;
                    var min = this.min;
                    var max = this.max;
                    var step = this.step;
                    var rangeSize = Math.max(0, max - min);
                    var largeStep = Math.max(rangeSize / 10, step);
                    
                    switch(KEYCODES[e.keyCode]){
                        case "LEFT_ARROW":
                        case "DOWN_ARROW":
                            this.value = Math.max(oldVal - step, min);
                            break;
                        case "RIGHT_ARROW":
                        case "UP_ARROW":
                            this.value = Math.min(oldVal + step, max);
                            break;
                        case "HOME":
                            this.value = min;
                            break;
                        case "END":
                            this.value = max;
                            break;
                        case "PAGE_DOWN":
                            this.value = Math.max(oldVal - largeStep, min);
                            break;
                        case "PAGE_UP":
                            this.value = Math.min(oldVal + largeStep, max);
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
            
                /** create and initialize attributes of input **/
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
                                getDefaultVal(initMin, initMax, initStep);
                
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
            // note that focus/blur events don't bubble by default, so 
            // in order for users to attach listeners to the x-slider focus
            // instead of the input's, fake one level of bubbling
            'focus:delegate(input[type=range])': function(e){
                var slider = e.currentTarget;
                
                xtag.fireEvent(slider, "focus", {}, {bubbles: false});
            },
            'blur:delegate(input[type=range])': function(e){
                var slider = e.currentTarget;
                
                xtag.fireEvent(slider, "blur", {}, {bubbles: false});
            }
        },
        accessors: {
            "polyfill": {
                attribute: {boolean: true},
                /** when polyfill is set, enable the polyfill slider graphical
                 *  elements and event handlers
                 *
                 * when unset, remove polyfill elements and revert to original 
                 * settings
                 **/
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
                        this.addEventListener("mousedown", 
                                              callbackFns.onMouseDragStart);
                        this.addEventListener("touchstart", 
                                              callbackFns.onTouchDragStart);
                        this.addEventListener("keydown", callbackFns.onKeyDown);
                    }
                    // simply hide the polyfill element
                    else{
                        this.removeAttribute("tabindex");
                        this.xtag.rangeInputEl.removeAttribute("tabindex");
                        this.xtag.rangeInputEl.removeAttribute("readonly");
                        this.removeEventListener("mousedown", 
                                                 callbackFns.onMouseDragStart);
                        this.removeEventListener("touchstart", 
                                                 callbackFns.onTouchDragStart);
                        this.removeEventListener("keydown", 
                                                 callbackFns.onKeyDown);
                    }
                }
            },
            // simple interface with the actual input element
            "max": {
                attribute: {
                    selector: "input[type=range]"
                },
                get: function(){
                    return +this.xtag.rangeInputEl.getAttribute("max");
                }
            },
            // simple interface with the actual input element
            "min": {
                attribute: {
                    selector: "input[type=range]"
                },
                get: function(){
                    return +this.xtag.rangeInputEl.getAttribute("min");
                }
            },
            // simple interface with the actual input element
            "step": {
                attribute: {
                    selector: "input[type=range]"
                },
                get: function(){
                    return +this.xtag.rangeInputEl.getAttribute("step");
                }
            },
            // simple interface with the actual input element
            "value": {
                attribute: {
                    selector: "input[type=range]"
                },
                get: function(){
                    return +this.xtag.rangeInputEl.value;
                },
                // rounds the input value to the closest constrained 
                // valid step value
                set: function(rawVal){
                    if(!isNum(rawVal)){
                        rawVal = getDefaultVal(this.min, this.max, this.step);
                    }
                    
                    rawVal = +rawVal;
                    var min = this.min;
                    var max = this.max;
                    var step = this.step;
                
                    var roundedVal = roundToStep(rawVal, step, min);
                    var finalVal = constrainToSteppedRange(roundedVal, min, 
                                                           max, step);
                    this.xtag.rangeInputEl.value = finalVal;
                    _redraw(this);
                }
            },
            // simple interface with the actual input element
            "name": {
                attribute: {
                    selector: "input[type=range]"
                },
                get: function(){
                    return this.xtag.rangeInputEl.getAttribute("name");
                }
            },
            
            // getter to retrieve the actual input DOM element we are wrapping
            "inputElem": {
                get: function(){
                    return this.xtag.rangeInputEl;
                }
            }
        },
        methods: {}
    });

})();