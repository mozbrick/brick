(function(){
    var TOOLTIP_ORIENT_ARROW_DIR_MAP = {
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
    // - acts normally for any non-mouseover/mouseleave events
    //
    // TL;DR edition: creates a function that doesn't fire a callback if the
    // event is simply triggered by moving between children of the same 
    // listening element in order to simulate the mouseenter/mouseleave events
    // in jQuery
    function mkSimulateMouseEnterLeaveFn(callback){
        return function(e){
            var eventType = e.type.toLowerCase();
            if(eventType === "mouseover" || eventType === "mouseleave"){
                var listeningElem = e.currentTarget;
                var relElem = e.relatedTarget || e.toElement;
                
                if(!hasParentNode(relElem, listeningElem)){
                    callback(e);
                }
            }
            // if not a event where we need to ignore hovers, don't change
            // how the callback gets called
            else{
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
        
        // TODO: more intelligent rotation angle calculation; currently
        // just assumes rotation is 45 degrees
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
        
        
        var getAlignedArrowCoords = function(tooltipTop, tooltipLeft){
            return {
                "left": (targetWidth - arrowWidth)/2 + 
                        targetContainerOffset.left - tooltipLeft,
                "top":  (targetHeight - arrowHeight)/2 + 
                         targetContainerOffset.top - newTop
            };
        };
        
        // messy calculations for aligning the tooltip and the arrow
        var newTop;
        var newLeft;
        var maxTop;
        var maxLeft;
        if(orientation === "above"){
            newTop = targetContainerOffset.top - origTooltipHeight - arrowHeight;
            newLeft = centerAlignCoords.left;
            maxTop = containerHeight - origTooltipHeight - arrowHeight;
            maxLeft = containerWidth - origTooltipWidth;
        }
        else if(orientation === "below"){
            newTop = targetContainerOffset.top + targetHeight + arrowHeight;
            newLeft = centerAlignCoords.left;
            maxTop = containerHeight - origTooltipHeight;
            maxLeft = containerWidth - origTooltipWidth;
        }
        else if(orientation === "onleft"){
            newTop = centerAlignCoords.top;
            newLeft = targetContainerOffset.left - origTooltipWidth - arrowWidth;
            maxTop = containerHeight - origTooltipHeight;
            maxLeft = containerWidth - origTooltipWidth - arrowWidth;
        }
        else if(orientation === "onright"){
            newTop = centerAlignCoords.top;
            newLeft = targetContainerOffset.left + targetWidth + arrowWidth;
            maxTop = containerHeight - origTooltipHeight;
            maxLeft = containerWidth - origTooltipWidth;
        }
        else{
            throw "invalid orientation " + orientation;
        }
        
        newTop = constrainNum(newTop, 0, maxTop);
        newLeft = constrainNum(newLeft, 0, maxLeft);
        tooltip.style.top = newTop + "px";
        tooltip.style.left = newLeft + "px";
        var arrowCoords = getAlignedArrowCoords(newTop, newLeft);
        if(orientation === "above" || orientation === "below"){
            arrow.style.left = constrainNum(
                                 arrowCoords.left, 0, 
                                 origTooltipWidth - arrowWidth
                               ) + "px";
        }
        else{
            arrow.style.top = constrainNum(
                                arrowCoords.top, 0, 
                                origTooltipHeight - arrowHeight
                              ) + "px";
        }
    }
    
    function _showTooltip(tooltip, targetElem){
        console.log("show called");
        var orient = tooltip.orientation;
        if(!(orient in TOOLTIP_ORIENT_ARROW_DIR_MAP)){
            // TODO: auto placement algorithm 
        }
        else{
            _positionTooltip(tooltip, targetElem, orient);
        }
        tooltip.setAttribute("visible", true);
    }
    
    function _hideTooltip(tooltip, targetElem){
        console.log("hide called");
        tooltip.removeAttribute("visible");
        tooltip.style.left = "";
        tooltip.style.top = "";
        
        var arrow = tooltip.xtag.arrowEl;
        arrow.style.left = "";
        arrow.style.right = "";
        arrow.style.left = "";
        arrow.style.bottom = "";
    }
    
    // because removing event listeners requires references to the same exact
    // functions that were initially assigned, we create the functions we will
    // be using for event listeners at tooltip creation and store them here
    //
    // format:
    //   <trigger style> :{
    //       <element type>: {
    //            <event type> : event listener callback function
    //       }
    //   }
    //
    // (trigger styles indicate how the user wants tooltips to be triggered.
    //  for example, by hovering over element or by clicking on event)
    // 
    // SPECIAL ELEMENT TYPES: 
    //      "_target" => any of the elements selected by tooltip.xtag.triggeringElems
    //      "_tooltip" => the tooltip element itself
    function _makeEventListenerData(tooltip){
        return {
            "hover": {
                "_target":{
                    "mouseover": mkSimulateMouseEnterLeaveFn(function(e){
                                    _showTooltip(tooltip, e.currentTarget);
                                    return false;
                                 }),
                    "mouseout": mkSimulateMouseEnterLeaveFn(function(e){
                                   _hideTooltip(tooltip, e.currentTarget);
                                    return false;
                                })
                }
            }
        };
    }
    
    // get the <eventType> : <listener callback functions> 
    // data map corresponding to the given trigger style and element type
    function _getElemTypeListeners(tooltip, currTriggerStyle, elemType){
        var eventListenerData = tooltip.xtag.eventListenerData;
        
        if(!(currTriggerStyle in eventListenerData)){
            throw "invalid trigger style " + currTriggerStyle;
        }
        
        var triggerStyleData = eventListenerData[currTriggerStyle];
        if(!(elemType in triggerStyleData)){
            console.log("no event listeners found for", elemType, 
                        "in the", currTriggerStyle, "style");
            return;
        }
        return triggerStyleData[elemType];
    }
    
    // remove any event listeners corresponding to the given trigger style 
    // and element type from the given listening element
    function _removeTriggerStyleListeners(tooltip, listeningElem, 
                                          currTriggerStyle, elemType){
        
        var targetEventListeners = _getElemTypeListeners(
                                        tooltip, currTriggerStyle, elemType
                                   );
                                   
        for(var eventType in targetEventListeners){
            console.log("unbound", eventType, "from", currTriggerStyle, "style from", listeningElem);
            listeningElem.removeEventListener(
                eventType, targetEventListeners[eventType]
            );
        }
    }                                    
    
    // attach any event listeners corresponding to the given trigger style 
    // and element type from the given listening element
    function _addTriggerStyleListeners(tooltip, listeningElem, 
                                       currTriggerStyle, elemType){
        var targetEventListeners = _getElemTypeListeners(
                                        tooltip, currTriggerStyle, elemType
                                   );
        for(var eventType in targetEventListeners){
            console.log("bound", eventType, "from", currTriggerStyle, "style to", listeningElem);
            listeningElem.addEventListener(
                eventType, targetEventListeners[eventType]
            );
        }
    }
    
    xtag.register("x-tooltip", {
        lifecycle:{
            created: function(){
                console.log("created");
                this.xtag.triggeringElems = [];
                this.xtag.currTriggerStyle = "hover";
                this.xtag.eventListenerData = _makeEventListenerData(this)
                
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
            // sets the placement of the tooltip in relation to a target element
            "orientation":{
                attribute: {},
                // when orientation of tooltip is set, also set direction of 
                // arrow pointer
                set: function(newOrientation){
                    newOrientation = newOrientation.toLowerCase();
                    var arrow = this.querySelector(".tooltip-arrow");
                    
                    var newArrowDir = null;
                    if(newOrientation in TOOLTIP_ORIENT_ARROW_DIR_MAP){
                        newArrowDir = TOOLTIP_ORIENT_ARROW_DIR_MAP[newOrientation];
                    }
                    
                    arrow.setAttribute("arrow-direction", newArrowDir);
                }
            },
            
            "visible":{
                attribute: {boolean: true},
                set: function(isVisible){}
            },
            
            "trigger-style": {
                attribute: {},
                get: function(){
                    return this.xtag.currTriggerStyle;
                },
                set: function(newTriggerStyle){
                    if(!(newTriggerStyle in this.xtag.eventListenerData)){
                        throw "attempted to set invalid trigger style " + newTriggerStyle;
                    }
                    this.xtag.currTriggerStyle = newTriggerStyle;
                }
            },
            
            // selector must be in relation to parent node of the tooltip
            // ie: can only select tooltip's siblings or deeper in the DOM tree
            "target-selector": {
                attribute: {},
                set: function(newSelector){
                    console.log("target selector changed to ", newSelector);
                    var eventListenerData = this.xtag.eventListenerData;
                    var tooltip = this;
                    var currTriggerStyle = this.xtag.currTriggerStyle;
                    
                    // unbind _all_ events from elements (including those not
                    // used by current trigger style, to ensure clean slate)
                    this.xtag.triggeringElems.forEach(function(oldTriggerElem){
                        if(hasParentNode(oldTriggerElem, tooltip)){
                            return;
                        }
                        for(var triggerStyle in eventListenerData){
                            _removeTriggerStyleListeners(tooltip, oldTriggerElem, 
                                                        triggerStyle, "_target");
                        }
                        
                        oldTriggerElem.removeAttribute("x-tooltip-targeted");
                    });
                
                    // bind new element listeners, but only those needed for the
                    // current trigger style
                    var newTriggerElems = _selectorToElems(this, newSelector);
                    newTriggerElems.forEach(function(newTriggerElem){
                        // don't give the tooltip itself the ability to 
                        // trigger itself
                        if(hasParentNode(newTriggerElem, tooltip)){
                            return;
                        }
                        _addTriggerStyleListeners(tooltip, newTriggerElem, 
                                                  currTriggerStyle, "_target");
                        
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