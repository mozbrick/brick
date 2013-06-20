(function(){
    var TRANSFORM_NAME = xtag.prefix.js + "Transform";

    function isNum(num){
        return !isNaN(parseFloat(num));
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
    
    function _calcValue(slider, sliderFraction){
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
        
        newThumbX = (sliderRect.width * fraction) - (thumbRect.width / 2);
        
        thumb.style[TRANSFORM_NAME] = "translateX("+newThumbX+"px)";
    }
    
    function _redraw(slider){
        _positionThumb(slider, slider.value);
    }

    function _onDragStart(slider, pageX, pageY){
        var inputEl = slider.xtag.rangeInputEl;
        var inputOffsets = inputEl.getBoundingClientRect();
        var inputClickX = pageX - inputOffsets.left;
        var inputClickY = pageY - inputOffsets.top;
        
        slider.value = _calcValue(slider, inputClickX / inputOffsets.width);
        _redraw(slider);
    }
    
    function onMouseStart(e){
        var slider = e.currentTarget;
        
        _onDragStart(slider, e.pageX, e.pageY);
    }
    
    xtag.register("x-slider", {
        lifecycle: {
            created: function(){
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
            }
        },
        events: {
            'change:delegate(input[type=range])': function(e){}
        },
        accessors: {
            "polyfill": {
                attribute: {boolean: true},
                set: function(isPolyfill){
                    // create polyfill thumb element if missing; 
                    // otherwise unhide it
                    if(isPolyfill){
                        this.xtag.rangeInputEl.setAttribute("readonly", true);
                        
                        if(this.xtag.polyFillSliderThumb){
                            this.xtag.polyFillSliderThumb.removeAttribute("hidden");
                        }
                        else{
                            var sliderThumb = document.createElement("span");
                            xtag.addClass(sliderThumb, "slider-thumb");
                            
                            this.xtag.polyFillSliderThumb = sliderThumb;
                            this.appendChild(sliderThumb);
                        }
                        _redraw(this);
                        
                        this.addEventListener("mousedown", onMouseStart);
                    }
                    // simply hide the polyfill element
                    else{
                        this.xtag.rangeInputEl.removeAttribute("readonly");
                        if(this.xtag.polyFillSliderThumb){
                            this.xtag.polyFillSliderThumb.setAttribute("hidden", true);
                        }
                        
                        this.removeEventListener("mousedown", onMouseStart);
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