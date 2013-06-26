(function(){
    xtag.register("x-tabbar", {
        lifecycle: {
            created: function(){
                this.xtag.overallEventToFire = "show";
            }
        },
        events: {
            "tap:delegate(x-tabbar-tab)": function(e) {
                var activeTab = xtag.query(this.parentNode, "x-tabbar-tab[data-active]");
                if (activeTab.length) {
                    activeTab.forEach(function(t) {
                        t.removeAttribute('data-active');
                    });
                }
                e.target.setAttribute('data-active', true);
            }
        },
        accessors: {
            // retrive a list of the tabs in this bar
            'tabs': {
                get: function(){
                    return xtag.queryChildren(this, "x-tabbar-tab");
                }
            },
            "eventToFire": {
                attribute: {name: "event-to-fire"},
                get: function(){
                    return this.xtag.overallEventToFire;
                },
                set: function(newEventType){
                    this.xtag.overallEventToFire = newEventType;
                }
            }
        },
        methods: {}
    });

    xtag.register("x-tabbar-tab", {
        lifecycle: {
            created: function(){
                this.xtag.targetSelector = null;
                // for when the user provides DOM programmatically
                // instead of through selector
                this.xtag.overrideTargetElems = null;
                this.xtag.eventToFire = null;
            }
        },
        events: {
            "tap": function(e){
                if(this.parentNode.nodeName.toLowerCase() === "x-tabbar"){
                    var eventToFire = this.eventToFire; // getter handles casing
                
                    var targets = this.targetElems;
                    for(var i = 0; i < targets.length; i++){
                        var target = targets[i];
                        xtag.fireEvent(target, eventToFire);
                    }
                }
            }
        },
        accessors: {
            "targetSelector": {
                attribute: {name: "target-selector"},
                get: function(){
                    return this.xtag.targetSelector;
                },
                set: function(newTargetSelector){
                    this.xtag.targetSelector = newTargetSelector;
                    
                    if(newTargetSelector){
                        this.xtag.overrideTargetElems = null;
                    }
                }
            },
            "targetElems":{
                get: function(){
                    if(this.targetSelector){
                        return xtag.query(document, this.targetSelector);
                    }
                    else if(this.xtag.overrideTargetElems != null){
                        return this.xtag.overrideTargetElems;
                    }
                    else{
                        return [];
                    }
                },
                // provide a way to manually override targets by passing DOM
                // elements in with code if users don't want to bother with
                // CSS selectors
                set: function(newElems){
                    // remove attribute to avoid confusing desynched attributes
                    this.removeAttribute("target-selector");

                    this.xtag.overrideTargetElems = newElems;
                }
            },
            "eventToFire":{
                attribute: {name: "event-to-fire"},
                get: function(){
                    if(this.xtag.eventToFire){
                        return this.xtag.eventToFire;
                    }
                    else if(this.parentNode.nodeName.toLowerCase() === "x-tabbar"){
                        return this.parentNode.eventToFire;
                    }
                    else{
                        throw "tabbar-tab is missing event to fire";
                    }
                },
                set: function(newEvent){
                    this.xtag.eventToFire = newEvent;
                }
            }
        },
        methods: {}
    });
})();