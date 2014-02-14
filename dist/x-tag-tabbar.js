(function() {
    function getWindowViewport() {
        var docElem = document.documentElement;
        var rect = {
            left: docElem.scrollLeft || document.body.scrollLeft || 0,
            top: docElem.scrollTop || document.body.scrollTop || 0,
            width: docElem.clientWidth,
            height: docElem.clientHeight
        };
        rect.right = rect.left + rect.width;
        rect.bottom = rect.top + rect.height;
        return rect;
    }
    function getRect(el) {
        var rect = el.getBoundingClientRect();
        var viewport = getWindowViewport();
        var docScrollLeft = viewport.left;
        var docScrollTop = viewport.top;
        return {
            left: rect.left + docScrollLeft,
            right: rect.right + docScrollLeft,
            top: rect.top + docScrollTop,
            bottom: rect.bottom + docScrollTop,
            width: rect.width,
            height: rect.height
        };
    }
    function _pointIsInRect(x, y, rect) {
        return rect.left <= x && x <= rect.right && rect.top <= y && y <= rect.bottom;
    }
    xtag.register("x-tabbar", {
        lifecycle: {
            created: function() {
                this.xtag.overallEventToFire = "reveal";
            }
        },
        events: {
            "tap:delegate(x-tabbar-tab)": function() {
                var activeTab = xtag.query(this.parentNode, "x-tabbar-tab[selected]");
                if (activeTab.length) {
                    activeTab.forEach(function(t) {
                        t.removeAttribute("selected");
                    });
                }
                this.setAttribute("selected", true);
            }
        },
        accessors: {
            tabs: {
                get: function() {
                    return xtag.queryChildren(this, "x-tabbar-tab");
                }
            },
            targetEvent: {
                attribute: {
                    name: "target-event"
                },
                get: function() {
                    return this.xtag.overallEventToFire;
                },
                set: function(newEventType) {
                    this.xtag.overallEventToFire = newEventType;
                }
            }
        },
        methods: {}
    });
    function _onTabbarTabTap(tabEl) {
        if (tabEl.parentNode.nodeName.toLowerCase() === "x-tabbar") {
            var targetEvent = tabEl.targetEvent;
            var targets = tabEl.targetSelector ? xtag.query(document, tabEl.targetSelector) : tabEl.targetElems;
            targets.forEach(function(targ) {
                xtag.fireEvent(targ, targetEvent);
            });
        }
    }
    xtag.register("x-tabbar-tab", {
        lifecycle: {
            created: function() {
                this.xtag.targetSelector = null;
                this.xtag.overrideTargetElems = null;
                this.xtag.targetEvent = null;
            }
        },
        events: {
            tap: function(e) {
                var tabEl = e.currentTarget;
                if (e.changedTouches && e.changedTouches.length > 0) {
                    var releasedTouch = e.changedTouches[0];
                    var tabRect = getRect(tabEl);
                    if (_pointIsInRect(releasedTouch.pageX, releasedTouch.pageY, tabRect)) {
                        _onTabbarTabTap(tabEl);
                    }
                } else {
                    _onTabbarTabTap(tabEl);
                }
            }
        },
        accessors: {
            targetSelector: {
                attribute: {
                    name: "target-selector"
                },
                get: function() {
                    return this.xtag.targetSelector;
                },
                set: function(newTargetSelector) {
                    this.xtag.targetSelector = newTargetSelector;
                    if (newTargetSelector) {
                        this.xtag.overrideTargetElems = null;
                    }
                }
            },
            targetElems: {
                get: function() {
                    if (this.targetSelector) {
                        return xtag.query(document, this.targetSelector);
                    } else if (this.xtag.overrideTargetElems !== null) {
                        return this.xtag.overrideTargetElems;
                    } else {
                        return [];
                    }
                },
                set: function(newElems) {
                    this.removeAttribute("target-selector");
                    this.xtag.overrideTargetElems = newElems;
                }
            },
            targetEvent: {
                attribute: {
                    name: "target-event"
                },
                get: function() {
                    if (this.xtag.targetEvent) {
                        return this.xtag.targetEvent;
                    } else if (this.parentNode.nodeName.toLowerCase() === "x-tabbar") {
                        return this.parentNode.targetEvent;
                    } else {
                        throw "tabbar-tab is missing event to fire";
                    }
                },
                set: function(newEvent) {
                    this.xtag.targetEvent = newEvent;
                }
            }
        },
        methods: {}
    });
})();