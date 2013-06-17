(function(){
    xtag.register("x-tabbar", {
        lifecycle: {
            created: function(){}
        },
        events: {},
        accessors: {},
        methods: {}
    });
    
    xtag.register("x-tabbar-tab", {
        lifecycle: {
            created: function(){
                this.xtag.targetElems = [];
            }
        },
        events: {
            "tap": function(e){
                console.log(e);
                var targets = this.xtag.targetElems;
                for(var i = 0; i < targets.length; i++){
                    var target = targets[i];
                    
                    xtag.fireEvent(target, "showtab");
                }
            }
        },
        accessors: {
            "target-selector": {
                attribute: {},
                set: function(newTargetSelector){
                    this.xtag.targetElems = xtag.query(document, newTargetSelector);
                    
                    console.log("target of", this, "is", this.xtag.targetElems);
                }
            }
        },
        methods: {}
    });
})();