(function(){
    var tooltipOrientToArrowDirMap = {
        "onleft": "right",
        "onright": "left",
        "below": "up",
        "above": "down"
    };

    function _selectorToElems(tooltip, selector){
        if(selector === "_previousSibling"){
            return (tooltip.previousElementSibling) ? [tooltip.previousElementSibling] : [];
        }
        else if(selector === "_nextSibling"){
            return (tooltip.nextElementSibling) ? [tooltip.nextElementSibling] : [];
        }
        else{
            var parent = (tooltip.parentNode) ? tooltip.parentNode : document;
            return xtag.query(parent, selector);
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
            var relElem = e.relatedTarget || e.toElement;
            
            if(!hasParentNode(relElem, listeningElem)){
                callback(e);
            }
        };
    }
    
    function getPageOffset(elem){
        var left = 0;
        var top = 0;
        
        while(elem.offsetParent){
            left += elem.offsetLeft;
            top += elem.offsetTop;
            
            elem = elem.offsetParent;
        }
        
        return {
            "left": left,
            "top": top
        };
    }
    
    // see: http://stackoverflow.com/a/9793197 for inspiration
    function getRotationDims(width, height, degrees){
        var radians = degrees * (Math.PI / 180);
        
        var rotatedHeight = width * Math.sin(radians) + height * Math.cos(radians);
        var rotatedWidth = width * Math.cos(radians) + height * Math.sin(radians);
        
        return {
            "height": rotatedHeight,
            "width": rotatedWidth
        };
    }
    
    function constrainNum(num, min, max){
        var output = num;
        output = (min !== undefined) ? Math.max(min, output) : output;
        output = (max !== undefined) ? Math.min(max, output) : output;
        return output;
    }    
    
    function _positionTooltip(tooltip, targetElem, orientation){
        var offsetContainer = (tooltip.offsetParent) ? 
                                    tooltip.offsetParent : tooltip.parentNode;
        
        var arrow = tooltip.xtag.arrowEl;
        tooltip.style.top = "";
        tooltip.style.left = "";
        arrow.style.top = "";
        arrow.style.left = "";
        
        var targetPageOffset = getPageOffset(targetElem);
        var containerPageOffset = getPageOffset(offsetContainer);
        
        var targetContainerOffset = {
            "top": targetPageOffset.top - containerPageOffset.top,
            "left": targetPageOffset.left - containerPageOffset.left
        };
        
        var containerWidth = offsetContainer.offsetWidth;
        var containerHeight = offsetContainer.offsetHeight;
        var targetWidth = targetElem.offsetWidth;
        var targetHeight = targetElem.offsetHeight;
        var origTooltipWidth = tooltip.offsetWidth;
        var origTooltipHeight = tooltip.offsetHeight;
        
        // TODO: more intelligent rotation angle calculation
        var arrowRotationDegs = 45;
        var arrowDims = getRotationDims(arrow.offsetWidth, arrow.offsetHeight, 
                                        arrowRotationDegs);
        var arrowWidth = arrowDims.width;
        var arrowHeight = arrowDims.height;
        
        // coords for if we need to either vertically or horizontally center
        var centerAlignCoords = {
            "left": targetContainerOffset.left + (targetWidth - origTooltipWidth)/2,
            "top": targetContainerOffset.top + (targetHeight - origTooltipHeight)/2
        };
        
        // eugh, gotta clean these calculations up later
        var newTop;
        var newLeft;
        if(orientation === "above"){
            newTop = targetContainerOffset.top - origTooltipHeight - arrowHeight;
            newLeft = centerAlignCoords.left;
            
            newTop = constrainNum(newTop, 0, containerHeight - origTooltipHeight - arrowHeight);
            newLeft = constrainNum(newLeft, 0, containerWidth - origTooltipWidth);
            
            tooltip.style.top = newTop + "px";
            tooltip.style.left = newLeft + "px";
            arrow.style.left = (targetWidth-arrowWidth)/2 + 
                                targetContainerOffset.left - newLeft + "px";
        }
        else if(orientation === "below"){
            newTop = targetContainerOffset.top + targetHeight + arrowHeight;
            newLeft = centerAlignCoords.left;
            
            newTop = constrainNum(newTop, 0, containerHeight - origTooltipHeight);
            newLeft = constrainNum(newLeft, 0, containerWidth - origTooltipWidth);
            
            tooltip.style.top = newTop + "px";
            tooltip.style.left = newLeft + "px";
            arrow.style.left = (targetWidth-arrowWidth)/2 + targetContainerOffset.left - newLeft + "px";
        }
        else if(orientation === "onleft"){
            newTop = centerAlignCoords.top;
            newLeft = targetContainerOffset.left - origTooltipWidth - arrowWidth;
            
            newTop = constrainNum(newTop, 0, containerHeight - origTooltipHeight);
            newLeft = constrainNum(newLeft, 0, containerWidth - origTooltipWidth - arrowWidth);
            
            tooltip.style.top = newTop + "px";
            tooltip.style.left = newLeft + "px";
            arrow.style.top = (targetHeight-arrowHeight)/2 + targetContainerOffset.top - newTop + "px";
        }
        else if(orientation === "onright"){
            newTop = centerAlignCoords.top;
            newLeft = targetContainerOffset.left + targetWidth + arrowWidth;
        
            newTop = constrainNum(newTop, 0, containerHeight - origTooltipHeight);
            newLeft = constrainNum(newLeft, 0, containerWidth - origTooltipWidth);
        
            tooltip.style.top = newTop + "px";
            tooltip.style.left = newLeft + "px";
            arrow.style.top = (targetHeight-arrowHeight)/2 + targetContainerOffset.top - newTop + "px";
        }
        else{
            throw "invalid orientation " + orientation;
        }
    }
    
    function _showTooltip(tooltip, targetElem){
        var orient = tooltip.orientation;
        if(!(orient in tooltipOrientToArrowDirMap)){
            // TODO: auto placement algorithm 
        }
        else{
            _positionTooltip(tooltip, targetElem, orient);
        }
        tooltip.setAttribute("visible", true);
    }
    
    function _hideTooltip(tooltip, targetElem){
        tooltip.removeAttribute("visible");
        tooltip.style.left = "";
        tooltip.style.top = "";
        
        var arrow = tooltip.xtag.arrowEl;
        arrow.style.left = "";
        arrow.style.right = "";
        arrow.style.left = "";
        arrow.style.bottom = "";
    }
    
    xtag.register("x-tooltip", {
        lifecycle:{
            created: function(){
                console.log("created");
                this.xtag.triggeringElems = [];
                
                var tooltip = this;
                this.xtag.targetShowTipFn = makeIgnoreBetweenChildrenFn(function(e){
                    _showTooltip(tooltip, e.currentTarget);
                    return false;
                });
                
                this.xtag.targetHideTipFn = makeIgnoreBetweenChildrenFn(function(e){
                    _hideTooltip(tooltip, e.currentTarget);
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
                    
                    var newArrowDir = null;
                    if(newOrientation in tooltipOrientToArrowDirMap){
                        newArrowDir = tooltipOrientToArrowDirMap[newOrientation];
                    }
                    
                    arrow.setAttribute("arrow-direction", newArrowDir);
                }
            },
            
            "visible":{
                attribute: {boolean: true},
                set: function(isVisible){}
            },
        
            // selector must be in relation to parent node of the tooltip
            // ie: can only select tooltip's siblings or deeper in the DOM tree
            "target-selector": {
                attribute: {},
                set: function(newSelector){
                    console.log("selector setter called");
                    var showFn = this.xtag.targetShowTipFn;
                    var hideFn = this.xtag.targetHideTipFn;
                    
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
            },
            
            // the DOM element representing the content of the tooltip
            "content": {
                get: function(){
                    return this.xtag.contentEl;
                },
                set: function(newContentElem){
                    var oldContent = this.xtag.contentEl;
                    
                    xtag.addClass(newContentElem, "tooltip-content");
                    
                    this.replaceChild(newContentElem, oldContent);
                    this.xtag.contentEl = newContentElem;
                }
            }
        },
        methods: {
        }
    });
})();