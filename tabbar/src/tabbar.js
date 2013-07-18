(function(){
   /** getLeft: DOM element => Number

    returns the absolute left X coordinate of the given element in relation to 
    the document
    **/
    function getLeft(el) {
        if(el.getBoundingClientRect){
          var documentScrollLeft = (document.documentElement.scrollLeft ||
                                    document.body.scrollLeft || 0);
          return el.getBoundingClientRect().left + documentScrollLeft;
        }
        else if (el.offsetParent) {
          return getLeft(el.offsetParent) + el.offsetLeft;
        } else {
          return el.offsetLeft;
        }
    }

    /** getLeft: DOM element => Number

    returns the absolute top Y coordinate of the given element in relation to 
    the document
    **/
    function getTop(el) {
        if(el.getBoundingClientRect){
          var documentScrollTop = (document.documentElement.scrollTop ||
                                   document.body.scrollTop || 0);
          return el.getBoundingClientRect().top + documentScrollTop;
        }
        else if (el.offsetParent) {
          return getTop(el.offsetParent) + el.offsetTop;
        } else {
          return el.offsetTop;
        }   
    }

    /** getRect: DOM element => {top: number, left: number, 
                                  right: number, bottom: number,
                                  width: number, height: number}

    returns the absolute metrics of the given DOM element in relation to the
    document
    **/
    function getRect(el){
        var baseRect = {
            top: getTop(el),
            left: getLeft(el),
            width: el.offsetWidth,
            height: el.offsetHeight,
        };

        baseRect.right = baseRect.left + baseRect.width;
        baseRect.bottom = baseRect.top + baseRect.height;
        return baseRect;
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
                var activeTab = xtag.query(this.parentNode, "x-tabbar-tab[active]");
                if (activeTab.length) {
                    activeTab.forEach(function(t) {
                        t.removeAttribute('active');
                    });
                }
                e.target.setAttribute('active', true);
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
        
            var targets = tabEl.targetElems;
            for(var i = 0; i < targets.length; i++){
                var target = targets[i];
                xtag.fireEvent(target, targetEvent);
            }
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