(function(){
    function _hasNativeRangeSupport(slider){
        var rangeInput = slider.xtag.rangeInputEl;
        
        // create dummy node if the rangeinput isn't correct type
        // (try to defer DOM creation unless we need it)
        if(rangeInput.getAttribute("type").toLowerCase() !== "range"){
            rangeInput = document.createElement("input");
            rangeInput.setAttribute("type", "range");
        }
        
        return (rangeInput.type.toLowerCase() === "range");
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
                if(_hasNativeRangeSupport(this)){
                    this.removeAttribute("polyfill");
                }
                // otherwise, set up and apply polyfill
                else{
                    this.setAttribute("polyfill", true);
                }
            }
        },
        events: {
            'change:delegate(input[type=range])': function(e){
                console.log(e);
            }
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
                    }
                    // simply hide the polyfill element
                    else{
                        this.xtag.rangeInputEl.removeAttribute("readonly");
                        if(this.xtag.polyFillSliderThumb){
                            this.xtag.polyFillSliderThumb.setAttribute("hidden", true);
                        }
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