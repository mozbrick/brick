(function(){
    xtag.register("x-tabbar", {
        lifecycle: {
            created: function(){}
        },
        events: {},
        accessors: {
            // retrive a list of the tabs in this bar
            'tabs': {
                get: function(){
                    var tabs = xtag.query(this, "x-tabbar-tab");
                    var tabbar = this;
                    var output = [];
                    
                    tabs.forEach(function(tab){
                        if(tab.parentNode && tab.parentNode === tabbar){
                            output.push(tab);
                        }
                    });
                    return output;
                }
            }
        },
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
                var targets = this.xtag.targetElems;
                for(var i = 0; i < targets.length; i++){
                    var target = targets[i];
                    
                    xtag.fireEvent(target, "show");
                }
            }
        },
        accessors: {
            "target-selector": {
                attribute: {},
                set: function(newTargetSelector){
                    this.xtag.targetElems = xtag.query(document, 
                                                       newTargetSelector);
                }
            },
            "targetElems":{
                get: function(){
                    return this.xtag.targetElems;
                },
                // provide a way to manually override targets by passing DOM 
                // elements in with code if users don't want to bother with
                // CSS selectors
                set: function(newElems){
                    // remove attribute to avoid confusing desynched attributes
                    this.removeAttribute("target-selector");
                
                    this.xtag.targetElems = newElems;
                }
            }
        },
        methods: {}
    });
})();