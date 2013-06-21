(function(){
    var TRANSFORM_NAME = xtag.prefix.js + "Transform";

    function isNum(num){
        return !isNaN(parseFloat(num));
    }

    function _getDefaultVal(slider){
        var min = (isNum(slider.min)) ? (+slider.min) : 0;
        var max = (isNum(slider.max)) ? (+slider.max) : 100;
        var step = (isNum(slider.step) && slider.step > 0) ? (+slider.step) : 1;
        return Math.round((((max - min) / 2) + min) / step) * step;
    }
    
    function _valToFraction(slider, value){
        var min = (isNum(slider.min)) ? (+slider.min) : 0;
        var max = (isNum(slider.max)) ? (+slider.max) : 100;
        return (value - min) / (max - min);
    }
    
    function _fractionToVal(slider, fraction){
        var min = (isNum(slider.min)) ? (+slider.min) : 0;
        var max = (isNum(slider.max)) ? (+slider.max) : 100;
        return ((max - min) * fraction) + min;
    }
    
    function _fractionToSliderValue(slider, sliderFraction){
        sliderFraction = Math.min(Math.max(0.0, sliderFraction), 1.0);
        
        var step = (isNum(slider.step) && slider.step > 0) ? (+slider.step) : 1;
        
        var rawVal = _fractionToVal(slider, sliderFraction);
        var numSteps = Math.round(rawVal / step);
        
        return numSteps * step;
    }
    
    function _positionThumb(slider, value){
        var thumb = slider.xtag.polyFillSliderThumb;
        
        if(!thumb){
            return;
        }
        var sliderRect = slider.getBoundingClientRect();
        var thumbRect = thumb.getBoundingClientRect();
        var fraction = _valToFraction(slider, value);
        
        // note that range inputs don't allow the thumb to spill past the bar
        // boundaries, so we actually have a little less width to work with
        // than you'd think
        var availableWidth = Math.max(sliderRect.width - thumbRect.width, 0);
        
        newThumbX = (availableWidth * fraction);
        
        thumb.style[TRANSFORM_NAME] = "translateX("+newThumbX+"px)";
    }
    
    function _redraw(slider){
        var value = (isNum(slider.value)) ? 
                      (+slider.value) : _getDefaultVal(slider);
        
        _positionThumb(slider, value);
    }

    function _onMouseInput(slider, pageX, pageY){
        var inputEl = slider.xtag.rangeInputEl;
        var inputOffsets = inputEl.getBoundingClientRect();
        var inputClickX = pageX - inputOffsets.left;
        
        var oldValue = +slider.value;
        var newValue = +_fractionToSliderValue(slider, 
                                              inputClickX / inputOffsets.width);
        
        slider.value = newValue;
        xtag.fireEvent(inputEl, "input");
        if(oldValue !== newValue){
            xtag.fireEvent(inputEl, "change");
        }
        _redraw(slider);
    }
    
    function _onDragStart(slider, pageX, pageY){
        _onMouseInput(slider, pageX, pageY);
        
        document.body.addEventListener("mousemove", slider.xtag.callbackFns["onMouseDragMove"]);
        document.body.addEventListener("mouseup", slider.xtag.callbackFns["onMouseDragEnd"]);
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
            
            "onMouseDragMove": function(e){
                _onDragMove(slider, e.pageX, e.pageY);
            },
            
            "onMouseDragEnd": function(e){
                document.body.removeEventListener("mousemove", slider.xtag.callbackFns["onMouseDragMove"]);
                document.body.removeEventListener("mouseup", slider.xtag.callbackFns["onMouseDragEnd"]);
            }                  
        };
    }
    
    xtag.register("x-slider", {
        lifecycle: {
            created: function(){
                this.xtag.callbackFns = _makeCallbackFns(this);
            
                this.xtag.rangeInputEl = document.createElement("input");
                xtag.addClass(this.xtag.rangeInputEl, "input");
                this.xtag.rangeInputEl.setAttribute("type", "range");
                this.appendChild(this.xtag.rangeInputEl);
                
                this.xtag.polyFillSliderThumb = null;
                
                // range support check
                if(this.xtag.rangeInputEl.type === "range"){
                    this.removeAttribute("polyfill");
                }
                // otherwise, set up and apply polyfill
                else{
                    this.setAttribute("polyfill", true);
                }
                
                if(!isNum(this.value)){
                    var attrVal = this.getAttribute("value");
                    this.value = (isNum(attrVal)) ? (+attrVal) : _getDefaultVal(this);
                }
                
                _redraw(this);
            },
            attributeChanged: function(){
                _redraw(this);
            }
        },
        events: {
            'change:delegate(input[type=range])': function(e){},
            'input:delegate(input[type=range])': function(e){}
        },
        accessors: {
            "polyfill": {
                attribute: {boolean: true},
                set: function(isPolyfill){
                    var callbackFns = this.xtag.callbackFns;
                    
                    // create polyfill thumb element if missing; 
                    // otherwise CSS takes care of unhiding it
                    if(isPolyfill){
                        this.xtag.rangeInputEl.setAttribute("readonly", true);
                        
                        if(!this.xtag.polyFillSliderThumb){
                            var sliderThumb = document.createElement("span");
                            xtag.addClass(sliderThumb, "slider-thumb");
                            
                            this.xtag.polyFillSliderThumb = sliderThumb;
                            this.appendChild(sliderThumb);
                        }
                        
                        this.addEventListener("mousedown", callbackFns['onMouseDragStart']);
                    }
                    // simply hide the polyfill element
                    else{
                        this.xtag.rangeInputEl.removeAttribute("readonly");
                        this.removeEventListener("mousedown", callbackFns['onMouseDragStart']);
                    }
                }
            },
            "max": {
                attribute: {
                    selector: "input[type=range]"
                }
            },
            "min": {
                attribute: {
                    selector: "input[type=range]"
                }
            },
            "step": {
                attribute: {
                    selector: "input[type=range]"
                }
            },
            "value": {
                attribute: {
                    selector: "input[type=range]"
                },
                get: function(){
                    return this.xtag.rangeInputEl.value;
                },
                set: function(newVal){
                    this.xtag.rangeInputEl.value = newVal;
                }
            },
            "name": {
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