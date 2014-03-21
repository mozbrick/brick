(function() {
    function getLayoutScroll(layout, element) {
        var scroll = element.__layoutScroll__ = element.__layoutScroll__ || Object.defineProperty(element, "__layoutScroll__", {
            value: {
                last: element.scrollTop
            }
        }).__layoutScroll__;
        var now = element.scrollTop, buffer = layout.scrollBuffer;
        scroll.max = scroll.max || Math.max(now + buffer, buffer);
        scroll.min = scroll.min || Math.max(now - buffer, buffer);
        return scroll;
    }
    function maxContent(layout) {
        layout.setAttribute("content-maximizing", null);
    }
    function minContent(layout) {
        layout.removeAttribute("content-maximized");
        layout.removeAttribute("content-maximizing");
    }
    function evaluateScroll(event) {
        var layout = event.currentTarget;
        if (layout.hideTrigger == "scroll" && !event.currentTarget.hasAttribute("content-maximizing")) {
            var target = event.target;
            if (layout.scrollTarget ? xtag.matchSelector(target, layout.scrollTarget) : target.parentNode == layout) {
                var now = target.scrollTop, buffer = layout.scrollBuffer, scroll = getLayoutScroll(layout, target);
                if (now > scroll.last) {
                    scroll.min = Math.max(now - buffer, buffer);
                } else if (now < scroll.last) {
                    scroll.max = Math.max(now + buffer, buffer);
                }
                if (!layout.maxcontent) {
                    if (now > scroll.max && !layout.hasAttribute("content-maximized")) {
                        maxContent(layout);
                    } else if (now < scroll.min) {
                        minContent(layout);
                    }
                }
                scroll.last = now;
            }
        }
    }
    xtag.register("x-layout", {
        events: {
            scroll: evaluateScroll,
            transitionend: function(e) {
                var node = e.target;
                if (this.hasAttribute("content-maximizing") && node.parentNode == this && (node.nodeName.toLowerCase() == "header" || node.nodeName.toLowerCase() == "footer")) {
                    this.setAttribute("content-maximized", null);
                    this.removeAttribute("content-maximizing");
                }
            },
            "tap:delegate(section)": function(e) {
                var layout = e.currentTarget;
                if (layout.hideTrigger == "tap" && !layout.maxcontent && this.parentNode == layout) {
                    if (layout.hasAttribute("content-maximizing") || layout.hasAttribute("content-maximized")) {
                        minContent(layout);
                    } else {
                        maxContent(layout);
                    }
                }
            },
            mouseout: function(e) {
                if (this.hideTrigger == "hover" && !this.maxcontent && !this.hasAttribute("content-maximized") && (!e.relatedTarget || !this.contains(e.relatedTarget))) {
                    maxContent(this);
                }
            },
            mouseover: function(e) {
                if (this.hideTrigger == "hover" && !this.maxcontent && (this.hasAttribute("content-maximized") || this.hasAttribute("content-maximizing")) && (this == e.relatedTarget || !this.contains(e.relatedTarget))) {
                    minContent(this);
                }
            }
        },
        accessors: {
            scrollTarget: {
                attribute: {
                    name: "scroll-target"
                }
            },
            scrollBuffer: {
                attribute: {
                    name: "scroll-buffer"
                },
                get: function() {
                    return Number(this.getAttribute("scroll-buffer")) || 80;
                }
            },
            hideTrigger: {
                attribute: {
                    name: "hide-trigger"
                }
            },
            maxcontent: {
                attribute: {
                    "boolean": true
                },
                set: function(value) {
                    if (value) {
                        maxContent(this);
                    } else if (!this.hasAttribute("content-maximizing")) {
                        minContent(this);
                    }
                }
            }
        }
    });
})();