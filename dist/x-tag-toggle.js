(function() {
    function setScope(toggle) {
        var form = toggle.xtag.inputEl.form;
        if (form) {
            toggle.removeAttribute("x-toggle-no-form");
        } else {
            toggle.setAttribute("x-toggle-no-form", "");
        }
        toggle.xtag.scope = toggle.parentNode ? form || document : null;
    }
    function updateScope(scope) {
        var names = {};
        var docSelector = scope == document ? "[x-toggle-no-form]" : "";
        xtag.query(scope, "x-toggle[name]" + docSelector).forEach(function(toggle) {
            var name = toggle.name;
            if (name && !names[name]) {
                var named = xtag.query(scope, 'x-toggle[name="' + name + '"]' + docSelector);
                var type = named.length > 1 ? "radio" : "checkbox";
                named.forEach(function(toggle) {
                    if (toggle.xtag && toggle.xtag.inputEl) {
                        toggle.type = type;
                    }
                });
                names[name] = true;
            }
        });
    }
    var shifted = false;
    xtag.addEvents(document, {
        DOMComponentsLoaded: function() {
            updateScope(document);
            xtag.toArray(document.forms).forEach(updateScope);
        },
        WebComponentsReady: function() {
            updateScope(document);
            xtag.toArray(document.forms).forEach(updateScope);
        },
        keydown: function(e) {
            shifted = e.shiftKey;
        },
        keyup: function(e) {
            shifted = e.shiftKey;
        },
        "focus:delegate(x-toggle)": function() {
            this.setAttribute("focus", "");
        },
        "blur:delegate(x-toggle)": function() {
            this.removeAttribute("focus");
        },
        "tap:delegate(x-toggle)": function() {
            if (shifted && this.group) {
                var toggles = this.groupToggles;
                var selector = 'x-toggle[group="' + this.group + '"][active]';
                var active = this.xtag.scope.querySelector(selector);
                if (active && this != active) {
                    var self = this;
                    var state = active.checked;
                    var index = toggles.indexOf(this);
                    var activeIndex = toggles.indexOf(active);
                    var minIndex = Math.min(index, activeIndex);
                    var maxIndex = Math.max(index, activeIndex);
                    toggles.slice(minIndex, maxIndex).forEach(function(toggler) {
                        if (toggler != self) {
                            toggler.checked = state;
                        }
                    });
                }
            }
        },
        "change:delegate(x-toggle)": function() {
            var selector = 'x-toggle[group="' + this.group + '"][active]';
            var active = this.xtag.scope.querySelector(selector);
            if (shifted && active && this != active) {
                this.checked = active.checked;
            } else {
                this.checked = this.xtag.inputEl.checked;
            }
            if (this.group) {
                this.groupToggles.forEach(function(toggle) {
                    toggle.active = false;
                });
                this.active = true;
            }
        }
    });
    xtag.register("x-toggle", {
        lifecycle: {
            created: function() {
                this.innerHTML = '<label class="x-toggle-input-wrap">' + '<input type="checkbox"></input>' + "</label>" + '<div class="x-toggle-check"></div>' + '<div class="x-toggle-content"></div>';
                this.xtag.inputWrapEl = this.querySelector(".x-toggle-input-wrap");
                this.xtag.inputEl = this.xtag.inputWrapEl.querySelector("input");
                this.xtag.contentWrapEl = this.querySelector(".x-toggle-content-wrap");
                this.xtag.checkEl = this.querySelector(".x-toggle-check");
                this.xtag.contentEl = this.querySelector(".x-toggle-content");
                this.type = "checkbox";
                setScope(this);
                var name = this.getAttribute("name");
                if (name) {
                    this.xtag.inputEl.name = this.getAttribute("name");
                }
                if (this.hasAttribute("checked")) {
                    this.checked = true;
                }
            },
            inserted: function() {
                setScope(this);
                if (this.parentNode && this.parentNode.nodeName.toLowerCase() === "x-togglegroup") {
                    if (this.parentNode.hasAttribute("name")) {
                        this.name = this.parentNode.getAttribute("name");
                    }
                    if (this.parentNode.hasAttribute("group")) {
                        this.group = this.parentNode.getAttribute("group");
                    }
                    this.setAttribute("no-box", true);
                }
                if (this.name) {
                    updateScope(this.xtag.scope);
                }
            },
            removed: function() {
                updateScope(this.xtag.scope);
                setScope(this);
            }
        },
        accessors: {
            noBox: {
                attribute: {
                    name: "no-box",
                    "boolean": true
                },
                set: function() {}
            },
            type: {
                attribute: {},
                set: function(newType) {
                    this.xtag.inputEl.type = newType;
                }
            },
            label: {
                attribute: {},
                get: function() {
                    return this.xtag.contentEl.innerHTML;
                },
                set: function(newLabelContent) {
                    this.xtag.contentEl.innerHTML = newLabelContent;
                }
            },
            active: {
                attribute: {
                    "boolean": true
                }
            },
            group: {
                attribute: {}
            },
            groupToggles: {
                get: function() {
                    return xtag.query(this.xtag.scope, 'x-toggle[group="' + this.group + '"]');
                }
            },
            name: {
                attribute: {
                    skip: true
                },
                get: function() {
                    return this.getAttribute("name");
                },
                set: function(name) {
                    if (name === null) {
                        this.removeAttribute("name");
                        this.type = "checkbox";
                    } else {
                        this.setAttribute("name", name);
                    }
                    this.xtag.inputEl.name = name;
                    updateScope(this.xtag.scope);
                }
            },
            checked: {
                get: function() {
                    return this.xtag.inputEl.checked;
                },
                set: function(value) {
                    var name = this.name, state = value === "true" || value === true;
                    if (name) {
                        var scopeSelector = this.xtag.scope == document ? "[x-toggle-no-form]" : "";
                        var selector = 'x-toggle[checked][name="' + name + '"]' + scopeSelector;
                        var previous = this.xtag.scope.querySelector(selector);
                        if (previous) {
                            previous.removeAttribute("checked");
                        }
                    }
                    this.xtag.inputEl.checked = state;
                    if (state) {
                        this.setAttribute("checked", "");
                    } else {
                        this.removeAttribute("checked");
                    }
                }
            },
            value: {
                attribute: {},
                get: function() {
                    return this.xtag.inputEl.value;
                },
                set: function(newVal) {
                    this.xtag.inputEl.value = newVal;
                }
            }
        }
    });
})();