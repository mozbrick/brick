var DemoHelpers;

(function(){
    var _DEMO_SECT_SELECTOR = "section.demo-wrap";
    var _BUTTON_SELECTOR = _DEMO_SECT_SELECTOR + 
                                " > .markup-wrap > .controls > button";

    function _DemoHelpers(){}

    _DemoHelpers.prototype.controlButtonToDemoSect = function(button){
        return button.parentNode.parentNode.parentNode;
    }

    _DemoHelpers.prototype.randomColor = function(alpha){
        var _randomVal = function(){
            return Math.floor(Math.random() * 256);
        }
        var type = (alpha) ? "rgba" : "rgb";
        var alphaStr = (alpha) ? ","+alpha : "";
        
        return type+"("+_randomVal()+","+_randomVal()+","+_randomVal()+alphaStr+")";
    };

    _DemoHelpers.prototype.hasNativeInputTypeSupport = function(type){
        var inputEl = document.createElement("input");
        inputEl.setAttribute("type", type);

        return (inputEl.type === type);
    };

    _DemoHelpers.prototype.hasNativeDateSupport = function(){
        return this.hasNativeInputTypeSupport("date");
    };

    _DemoHelpers.prototype.hasNativeRangeSupport = function(){
        return this.hasNativeInputTypeSupport("range");
    };

    // find the least amount of tabbing and dedent each line by that much
    _DemoHelpers.prototype.dedentAll = function(source){
        var tabRegex = /\n(\s*?)(\S|\n)/g;
        var spacing = tabRegex.exec(source);
        if(spacing){
            var shortest = spacing[1].length;
            while(spacing){
                if(spacing[1].length < shortest){
                    shortest = spacing[1].length;
                }
                spacing = tabRegex.exec(source);
            }
            if(shortest > 0){
                var dedentRegex = new RegExp("\\n\\s{"+shortest+"}", "g");
                source = source.replace(dedentRegex, "\n");
            }
        }
        return source;
    };

    // dedent html source and remove ignored attributes
    _DemoHelpers.prototype.cleanHtmlSource = function(html, ignoreAttrs){
        // remove any attributes given in parameter, but only if they are
        // actually in a tag
        if(ignoreAttrs && ignoreAttrs.length){
            // no global flag, or we will over-skip through string
            var attrIgnoreRegex = new RegExp("(<[^>]*?\\s)(("+
                                             ignoreAttrs.join("|")+
                                             ")=\".*?\"\\s?)([^<]*?>)");
            var match = attrIgnoreRegex.exec(html);
            while(match){
                html = html.substr(0, match.index) + match[1] + match[4] + 
                       html.substr(match.index + match[0].length);
                match = attrIgnoreRegex.exec(html);
            }
            html = html.replace(/\s*>/g, ">");
        }
        // remove blank attribute values (TODO: more complex regex to catch more 
        //  edge cases involving content)
        html = html.replace(/="(|true|null)"/g, "");

        // remove comments
        html = html.replace(/<!--.*?-->/g, "");
        
        html = this.dedentAll(html);
        // trim spacing from start/end of markup
        html = html.replace(/^\s*\n/, "");
        html = html.replace(/\n\s*$/, "");
        return html;
    };

    _DemoHelpers.prototype.getFormString = function(formEl){
        // retrieves all _actual_ <input> elements (ie: not fake polyfills)
        var inputElems = e.currentTarget.elements;
        var vals = [];
        for (var i = 0; i < inputElems.length; i++) {
            var input = inputElems[i];
            if(!input.name) continue;
            if((input.type === "radio" || input.type === "checkbox") &&
                (!input.checked))
            {
                continue;
            }

            vals.push(encodeURIComponent(input.name) + "=" + 
                      encodeURIComponent(input.value));
        }
        return vals.join("&");
    };

    // defaults to first item if given item is not in list
    _DemoHelpers.prototype.nextItem = function(items, prevItem){
        if(items.length === 0) return null;
        var index = items.indexOf(prevItem);

        if(index === -1) return null;

        return items[(index+1) % items.length];
    };

    _DemoHelpers.prototype.updatePrettyprintEl = function(prettyprintEl, rawContent){
        prettyprintEl.textContent = rawContent;
        prettyprintEl.innerHTML = prettyPrintOne(prettyprintEl.innerHTML);
        xtag.addClass(prettyprintEl, "prettyprinted");
    };

    _DemoHelpers.prototype.getMarkupEl = function(demoSect, lang){
        return demoSect.querySelector(".markup-wrap ."+lang);
    };

    _DemoHelpers.prototype.getContextEl = function(demoSect){
        return demoSect.querySelector(".demo");
    };

    // will register listeners on each of the given event type to fire "update-demo"
    // events on the corresponding demo section
    _DemoHelpers.prototype.registerUpdateListeners = function(eventTypes){
        for(var i = 0; i < eventTypes.length; i++){
            var eventType = eventTypes[i];
            var selector = eventType+":delegate("+_DEMO_SECT_SELECTOR+")";
            xtag.addEvent(document, selector, function(e){
                xtag.fireEvent(e.currentTarget, "update-demo");
            });
        }
    };

    _DemoHelpers.prototype.initializeDemos = function(){
        // prevent submission of any demo forms and alert values instead
        xtag.addEvent(document, "submit:delegate(" +
                                _DEMO_SECT_SELECTOR +
                                " > .demo form)", function(e){
            alert(DemoHelpers.getFormString(e.target));
            e.preventDefault();
            e.stopPropagation();
        });

        // listen for any button with data-toggle-attr and toggle through attributes
        // will fire an "update-demo" event on the demo section
        // 
        // button attributes:
        // data-toggle-attr = name of attribute to toggle
        // data-toggle-target-selector = a CSS selector to call on the demo-wrap's
        //                               querySelector indicating where to apply
        //                               the attribute
        // data-toggle-options = If given, should be a JSON for a list of options
        //                       to cycle through for the attribute's value
        //                       If not given, indicates that the attribute is a
        //                       boolean attribute to toggle on and off
        xtag.addEvent(document, "click:delegate(" +
                                _BUTTON_SELECTOR +
                                "[data-toggle-attr])", function(e){
            var button = this;
            var demoSect = DemoHelpers.controlButtonToDemoSect(button);
            var toggleAttr = button.getAttribute("data-toggle-attr");
            var toggleTargetSelector = button.getAttribute(
                                            "data-toggle-target"
                                       );
            if((!toggleAttr) || (!toggleTargetSelector)) return;

            var targetElem = demoSect.querySelector(toggleTargetSelector);
            if(!targetElem) return;

            var oldVal = targetElem[toggleAttr];
            var newVal;

            if(button.hasAttribute("data-toggle-options")){
                var toggleOptions = JSON.parse(
                                        button.getAttribute("data-toggle-options")
                                    );
                newVal = DemoHelpers.nextItem(toggleOptions, oldVal);
                if(newVal === null){
                    console.warn("invalid original option of ", oldVal, 
                                 " for attribute ", toggleAttr, " on ", targetElem);
                }
            }
            else{
                newVal = !oldVal;
            }
            targetElem[toggleAttr] = newVal;

            // account for any skip transitions
            xtag.requestFrame(function(){
                var statusEl = button.querySelector(".attr-status");
                if(statusEl){
                    var content = toggleAttr+'="'+targetElem[toggleAttr]+'"';
                    DemoHelpers.updatePrettyprintEl(statusEl, content);
                }
                xtag.fireEvent(demoSect, "update-demo");
            });
        });

        // fire initial update on all demo sections
        xtag.query(document, _DEMO_SECT_SELECTOR).forEach(function(demoSect){
            xtag.fireEvent(demoSect, "update-demo");
        });

        prettyPrint();
    };

    Object.defineProperties(_DemoHelpers.prototype, {
        "DEMO_SECT_SELECTOR":{
            get: function(){
                return _DEMO_SECT_SELECTOR;
            }
        },
        "BUTTON_SELECTOR": {
            get: function(){
                return _BUTTON_SELECTOR;
            }
        }
    });
    
    DemoHelpers = new _DemoHelpers();
})();