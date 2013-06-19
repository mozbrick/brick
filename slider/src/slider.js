(function(){

    xtag.register("x-slider", {
        lifecycle: {
            created: function(){
                this.xtag.rangeInput = document.createElement("input");
                this.xtag.rangeInput.setAttribute("type", "range");
                
                // range support check
                if(this.xtag.rangeInput.type === "range"){
                    this.xtag.nativeSupport = true;
                }
                // TODO: apply polyfill here
                else{
                    this.xtag.nativeSupport = false;
                }
                
                this.appendChild(this.xtag.rangeInput);
            }
        },
        events: {},
        accessors: {},
        methods: {}
    });

})();