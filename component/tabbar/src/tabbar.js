(function(){
    /** getWindowViewport() => { top: number, left: number, 
                                  right: number, bottom: number,
                                  width: number, height: number}

    returns the rectangle of the current window viewport, relative to the 
    document
    **/
    function getWindowViewport(){
        var docElem = document.documentElement;
        var rect = {
            left: (docElem.scrollLeft || document.body.scrollLeft || 0),
            top: (docElem.scrollTop || document.body.scrollTop || 0),
            width: docElem.clientWidth,
            height: docElem.clientHeight
        };
        rect.right = rect.left + rect.width;
        rect.bottom = rect.top + rect.height;
        return rect;
    }

    /** getRect: DOM element => { top: number, left: number, 
                                  right: number, bottom: number,
                                  width: number, height: number}

    returns the absolute metrics of the given DOM element in relation to the
    document

    returned coordinates already account for any CSS transform scaling on the
    given element
    **/
    function getRect(el){
        var rect = el.getBoundingClientRect();
        var viewport = getWindowViewport();
        var docScrollLeft = viewport.left;
        var docScrollTop = viewport.top;
        return {
            "left": rect.left + docScrollLeft,
            "right": rect.right + docScrollLeft,
            "top": rect.top + docScrollTop,
            "bottom": rect.bottom + docScrollTop,
            "width": rect.width,
            "height": rect.height
        };
    }
    /* _pointIsInRect: (Number, Number, {left: number, top: number, 
                                         right: number, bottom: number})
    */
    function _pointIsInRect(x, y, rect){
        return (rect.left <= x && x <= rect.right && 
                rect.top <= y && y <= rect.bottom);
    }

    xtag.register("x-tabbar", {
        lifecycle: {
            created: function(){
                this.xtag.overallEventToFire = "show";
            }
        },
        events: {
            "tap:delegate(x-tabbar-tab)": function(e) {
                var activeTab = xtag.query(this.parentNode, "x-tabbar-tab[selected]");
                if (activeTab.length) {
                    activeTab.forEach(function(t) {
                        t.removeAttribute('selected');
                    });
                }
                this.setAttribute('selected', true);
            }
        },
        accessors: {
            // retrive a list of the tabs in this bar
            'tabs': {
                get: function(){
                    return xtag.queryChildren(this, "x-tabbar-tab");
                }
            },
            "targetEvent": {
                attribute: {name: "target-event"},
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

    function _onTabbarTabTap(tabEl){
        if(tabEl.parentNode.nodeName.toLowerCase() === "x-tabbar"){
            var targetEvent = tabEl.targetEvent; // getter handles casing
        
            var targets = (tabEl.targetSelector) ? 
                              xtag.query(document, tabEl.targetSelector) : 
                              tabEl.targetElems;
            targets.forEach(function(targ){
                xtag.fireEvent(targ, targetEvent);
            });
        }
    }

    xtag.register("x-tabbar-tab", {
        lifecycle: {
            created: function(){
                this.xtag.targetSelector = null;
                // for when the user provides DOM programmatically
                // instead of through selector
                this.xtag.overrideTargetElems = null;
                this.xtag.targetEvent = null;
            }
        },
        events: {
            "tap": function(e){
                var tabEl = e.currentTarget;
                // for touchend, ensure that we actually tapped and didn't drag 
                // off
                if(e.changedTouches){
                    if(!e.changedTouches.length) return;

                    var releasedTouch = e.changedTouches[0];
                    var tabRect = getRect(tabEl);
                    if(_pointIsInRect(releasedTouch.pageX, releasedTouch.pageY, 
                                      tabRect))
                    {
                        _onTabbarTabTap(tabEl);
                    }
                }
                else{
                   _onTabbarTabTap(tabEl);
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
                    else if(this.xtag.overrideTargetElems !== null){
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
            "targetEvent":{
                attribute: {name: "target-event"},
                get: function(){
                    if(this.xtag.targetEvent){
                        return this.xtag.targetEvent;
                    }
                    else if(this.parentNode.nodeName.toLowerCase() === "x-tabbar"){
                        return this.parentNode.targetEvent;
                    }
                    else{
                        throw "tabbar-tab is missing event to fire";
                    }
                },
                set: function(newEvent){
                    this.xtag.targetEvent = newEvent;
                }
            }
        },
        methods: {}
    });
})();