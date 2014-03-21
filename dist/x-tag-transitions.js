(function() {
    var matchNum = /[1-9]/, replaceSpaces = / /g, captureTimes = /(\d|\d+?[.]?\d+?)(s|ms)(?!\w)/gi, transPre = "transition" in getComputedStyle(document.documentElement) ? "t" : xtag.prefix.js + "T", transDur = transPre + "ransitionDuration", transProp = transPre + "ransitionProperty", skipFrame = function(fn) {
        xtag.requestFrame(function() {
            xtag.requestFrame(fn);
        });
    }, ready = document.readyState == "complete" ? skipFrame(function() {
        ready = false;
    }) : xtag.addEvent(document, "readystatechange", function() {
        if (document.readyState == "complete") {
            skipFrame(function() {
                ready = false;
            });
            xtag.removeEvent(document, "readystatechange", ready);
        }
    });
    function getTransitions(node) {
        return node.__transitions__ = node.__transitions__ || {};
    }
    function startTransition(node, name, transitions) {
        var style = getComputedStyle(node), after = transitions[name].after;
        node.setAttribute("transition", name);
        if (after && !style[transDur].match(matchNum)) after();
    }
    xtag.addEvents(document, {
        transitionend: function(e) {
            var node = e.target, name = node.getAttribute("transition");
            if (name) {
                var i = max = 0, prop = null, style = getComputedStyle(node), transitions = getTransitions(node), props = style[transProp].replace(replaceSpaces, "").split(",");
                style[transDur].replace(captureTimes, function(match, time, unit) {
                    var time = parseFloat(time) * (unit === "s" ? 1e3 : 1);
                    if (time > max) prop = i, max = time;
                    i++;
                });
                prop = props[prop];
                if (!prop) throw new SyntaxError("No matching transition property found"); else if (e.propertyName == prop && transitions[name].after) transitions[name].after();
            }
        }
    });
    xtag.transition = function(node, name, obj) {
        var transitions = getTransitions(node), options = transitions[name] = obj || {};
        if (options.immediate) options.immediate();
        if (options.before) {
            options.before();
            if (ready) xtag.skipTransition(node, function() {
                startTransition(node, name, transitions);
            }); else skipFrame(function() {
                startTransition(node, name, transitions);
            });
        } else startTransition(node, name, transitions);
    };
    xtag.pseudos.transition = {
        onCompiled: function(fn, pseudo) {
            var options = {}, when = pseudo.arguments[0] || "immediate", name = pseudo.arguments[1] || pseudo.key.split(":")[0];
            return function() {
                var target = this, args = arguments;
                if (this.hasAttribute("transition")) {
                    options[when] = function() {
                        return fn.apply(target, args);
                    };
                    xtag.transition(this, name, options);
                } else return fn.apply(this, args);
            };
        }
    };
})();