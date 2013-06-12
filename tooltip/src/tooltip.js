(function(){
    function _selectorToElems(tooltip, selector){
        if(selector === "_parentNode"){
            return (tooltip.parentNode) ? [tooltip.parentNode] : [];
        }
        else if(selector === "_previousSibling"){
            return (tooltip.previousElementSibling) ? [tooltip.previousElementSibling] : [];
        }
        else if(selector === "_nextSibling"){
            return (tooltip.nextElementSibling) ? [tooltip.nextElementSibling] : [];
        }
        else{
            return xtag.query(document, selector);
        }
    }

    function hasParentNode(elem, parent){
        while(elem){
            if(elem === parent){
                return true;
            }
            elem = elem.parentNode;
        }
        return false;
    }
    
    // create a function for mouseover/mouseleave events where:
    // - for mouseover events, only fires callback when
    //   the mouse first enters the element that has the mouseover event 
    //   listener attached to it and ignores any mouseovers between children
    //   elements in this same continer element; essentially emulates jQuery's
    //   mouseenter polyfill
    // - for mouseout events, only fires callback when the mouse actually
    //   completely exits the element that has the mouseleave event 
    //   listener attached to it and ignores any mouseouts that exit to 
    //   somewhere that is still within the listening container element;
    //   emulates jQuery's mouseleave polyfill
    //
    // TL;DR edition: creates a function that doesn't fire a callback if the
    // event is simply triggered by moving between children of the same 
    // listening element
    function makeIgnoreBetweenChildrenFn(callback){
        return function(e){
            var listeningElem = e.currentTarget;
            var fromElem = e.relatedTarget || event.toElement;
            
            if(!hasParentNode(fromElem, listeningElem)){
                callback(e);
            }
        };
    }
    
    function _showTooltip(tooltip, e){
        console.log("show", tooltip, e);
        tooltip.setAttribute("visible", true);
    }
    
    function _hideTooltip(tooltip, e){
        console.log("hide", tooltip, e);
        tooltip.removeAttribute("visible");
    }
    
    xtag.register("x-tooltip", {
        lifecycle:{
            created: function(){
                console.log("created");
                this.xtag.triggeringElems = [];
                
                var tooltip = this;
                this.xtag.showTooltipFn = makeIgnoreBetweenChildrenFn(function(e){
                    _showTooltip(tooltip, e);
                    return false;
                });
                
                this.xtag.hideTooltipFn = makeIgnoreBetweenChildrenFn(function(e){
                    _hideTooltip(tooltip, e);
                    return false;
                });
                
                // create content elements (allows user to style separately)
                this.xtag.contentEl = document.createElement("div");
                this.xtag.arrowEl = document.createElement("span");
                
                xtag.addClass(this.xtag.contentEl, "tooltip-content");
                xtag.addClass(this.xtag.arrowEl, "tooltip-arrow");
                
                // remove content and put into the content
                this.xtag.contentEl.innerHTML = this.innerHTML;
                this.innerHTML = "";
                
                this.appendChild(this.xtag.contentEl);
                this.appendChild(this.xtag.arrowEl);
            }
        },
        events: {
        },
        accessors: {
            "orientation":{
                attribute: {},
                set: function(newOrientation){
                    newOrientation = newOrientation.toLowerCase();
                    var arrow = this.querySelector(".tooltip-arrow");
                    
                    var orientationToArrowDirMap = {
                        "onleft": "right",
                        "onright": "left",
                        "below": "up",
                        "above": "down"
                    };
                    
                    var newArrowDir = null;
                    if(newOrientation in orientationToArrowDirMap){
                        newArrowDir = orientationToArrowDirMap[newOrientation];
                    }
                    
                    arrow.setAttribute("arrow-direction", newArrowDir);
                }
            },
            
            "visible":{
                attribute: {boolean: true},
                set: function(isVisible){
                    
                }
            },
        
            "target-selector": {
                attribute: {},
                set: function(newSelector){
                    console.log("selector setter called");
                    var showFn = this.xtag.showTooltipFn;
                    var hideFn = this.xtag.hideTooltipFn;
                    
                    // unbind elements
                    this.xtag.triggeringElems.forEach(function(oldTriggerElem){
                        console.log("unbound from", oldTriggerElem);
                        oldTriggerElem.removeEventListener("mouseover", showFn);
                        oldTriggerElem.removeEventListener("mouseout", hideFn);
                        oldTriggerElem.removeAttribute("x-tooltip-targeted");
                    });
                
                    // bind new element listeners
                    var newTriggerElems = _selectorToElems(this, newSelector);
                    newTriggerElems.forEach(function(newTriggerElem){
                        console.log("bound to", newTriggerElem);
                        newTriggerElem.addEventListener("mouseover", showFn);
                        newTriggerElem.addEventListener("mouseout", hideFn);
                        newTriggerElem.setAttribute("x-tooltip-targeted", true);
                    });
                    this.xtag.triggeringElems = newTriggerElems;
                }
            }
        },
        methods: {
            showTooltip: function(){
                _showTooltip(this);
            }
        }
    });
})();