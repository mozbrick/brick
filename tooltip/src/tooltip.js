(function(){
    var TIP_ORIENT_ARROW_DIR_MAP = {
        "above": "down",
        "below": "up",
        "onleft": "right",
        "onright": "left"
    };
    
    // a simple struct to store all information needed to add and remove
    // a particular event listener
    function CachedListener(elem, eventType, listenerFn){
        this.eventType = eventType;
        this.listenerFn = listenerFn;
        this.elem = elem;
        this.isAttached = false;
    }
    
    CachedListener.prototype.attachListener = function(){
        if(this.isAttached === false){
            this.elem.addEventListener(this.eventType, this.listenerFn);
            this.isAttached = true;
        }
    };
    
    CachedListener.prototype.removeListener = function(){
        if(this.isAttached === true){
            this.elem.removeEventListener(this.eventType, this.listenerFn);
            this.isAttached = false;
        }
    };
    
    // each trigger style is mapped to a function that returns a list of
    // CachedListeners that the tooltip would need to attach
    // NOTE: DO NOT ATTACH LISTENERS HERE, LET THE CALLER DO IT
    var TRIGGER_STYLE_GETLISTENERS = {
        "hover": function(tooltip, triggerElems){
            var createdListeners = [];
            var hoverOutTimer = null;
            var hideDelay = 200;
            var cancelTimerFn = function(){
                if(hoverOutTimer){
                    window.clearTimeout(hoverOutTimer);
                }
                hoverOutTimer = null;
            };
            
            var showTipTargetFn = mkSimulateMouseEnterLeaveFn(function(e){
                cancelTimerFn();
                // don't trigger show when coming from a tooltip element
                var fromElem = e.relatedTarget || e.toElement;
                if(!hasParentNode(fromElem, tooltip)){
                    _showTooltip(tooltip, e.currentTarget);
                    e.stopPropagation();
                }
            });
            var hideTipTargetFn = mkSimulateMouseEnterLeaveFn(function(e){
                cancelTimerFn();
                // don't get triggered when exiting to a tooltip element
                var toElem = e.relatedTarget || e.toElement;
                if(!hasParentNode(toElem, tooltip)){
                    // add delay so that we can interact with tooltip
                    hoverOutTimer = window.setTimeout(function(){
                        if(tooltip.xtag.currTriggerStyle === "hover")
                        {
                            _hideTooltip(tooltip);
                        }
                    }, hideDelay);
                    e.stopPropagation();
                }
            });
            
            var showTipTooltipFn = mkSimulateMouseEnterLeaveFn(function(e){
                cancelTimerFn();
                
                // don't trigger show when coming from the target element
                var fromElem = e.relatedTarget || e.toElement;
                var currTarget = tooltip.xtag.currTargetElem;
                // also don't trigger a reshow unless we are actually hidden
                if(currTarget && !hasParentNode(fromElem, currTarget) &&
                   !tooltip.hasAttribute("visible"))
                {
                    _showTooltip(tooltip, e.currentTarget);
                    e.stopPropagation();
                }
            });
            
            var hideTipTooltipFn = mkSimulateMouseEnterLeaveFn(function(e){
                cancelTimerFn();
                // don't get triggered when exiting to the target element
                var toElem = e.relatedTarget || e.toElement;
                var currTarget = tooltip.xtag.currTargetElem;
                if(currTarget && !hasParentNode(toElem, currTarget))
                {
                    // add delay so that we can interact with tooltip
                    hoverOutTimer = window.setTimeout(function(){
                        if(tooltip.xtag.currTriggerStyle === "hover")
                        {
                            _hideTooltip(tooltip);
                        }
                    }, hideDelay);
                    e.stopPropagation();
                }
            });
            
            // create and add the CachedListeners to the list to be returned
            triggerElems.forEach(function(triggerElem){
                var enterListener = new CachedListener(triggerElem, "mouseover",
                                                       showTipTargetFn);
                var exitListener = new CachedListener(triggerElem, "mouseout", 
                                                      hideTipTargetFn);
                createdListeners.push(enterListener);
                createdListeners.push(exitListener);
            });
            
            createdListeners.push(
                new CachedListener(tooltip, "mouseover", showTipTooltipFn)
            );
            createdListeners.push(
                new CachedListener(tooltip, "mouseout", hideTipTooltipFn)
            );
            
            return createdListeners;
        },
        "click": function(tooltip, triggerElems){
            var createdListeners = [];
            
            var targetClickFn = function(e){
                if(tooltip.hasAttribute("visible") && 
                   tooltip.xtag.currTargetElem === e.currentTarget)
                {
                    _hideTooltip(tooltip);
                }
                else{
                    _showTooltip(tooltip, e.currentTarget);
                }
                e.stopPropagation();
            };
            
            triggerElems.forEach(function(triggerElem){
                var targetListener = new CachedListener(triggerElem, "click", 
                                                        targetClickFn);
                createdListeners.push(targetListener);
            });
            
            createdListeners.push(
                new CachedListener(document.body, "click", function(e){
                                      _hideTooltip(tooltip);
                                   })
            );
            
            // stop propagation on clicking the tooltip so that we dont just
            // immediately close it due to the body listener
            createdListeners.push(
                new CachedListener(tooltip, "click", function(e){
                    e.stopPropagation();
                })
            );
            return createdListeners;
        }
    };
    
    
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
            if(eventType === "mouseover" || eventType === "mouseout"){
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
    
    // returns list of elements selected by the given selector in relation to
    // the tooltip
    function _selectorToElems(tooltip, selector){
        if(selector === "_previousSibling"){
            return (tooltip.previousElementSibling) ? 
                      [tooltip.previousElementSibling] : [];
        }
        else if(selector === "_nextSibling"){
            return (tooltip.nextElementSibling) ? 
                      [tooltip.nextElementSibling] : [];
        }
        else{
            var parent = (tooltip.parentNode) ? tooltip.parentNode : document;
            return xtag.query(parent, selector);
        }
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
    
    function overlaps(elemA, elemB){
        var _pointIsInRect = function(x, y, rect){
            return (rect.left <= x && x <= rect.right && 
                    rect.top <= y && y <= rect.bottom);
        };
        
        var absCoordsA = getPageOffset(elemA);
        var absCoordsB = getPageOffset(elemB);
        var rectA = {
            left: absCoordsA.left,
            top: absCoordsA.top,
            right: absCoordsA.left+elemA.offsetWidth,
            bottom: absCoordsA.top + elemA.offsetHeight
        };
        
        var rectB = {
            left: absCoordsB.left,
            top: absCoordsB.top,
            right: absCoordsB.left+elemB.offsetWidth,
            bottom: absCoordsB.top + elemB.offsetHeight
        };
        
        //check box A 
        if(_pointIsInRect(rectA.left, rectA.top, rectB) || 
           _pointIsInRect(rectA.right, rectA.top, rectB) || 
           _pointIsInRect(rectA.right, rectA.bottom, rectB) || 
           _pointIsInRect(rectA.left, rectA.bottom, rectB))
        {
            return true; 
        }
        
        //check box B 
        else if(_pointIsInRect(rectB.left, rectB.top, rectA) || 
           _pointIsInRect(rectB.right, rectB.top, rectA) || 
           _pointIsInRect(rectB.right, rectB.bottom, rectA) || 
           _pointIsInRect(rectB.left, rectB.bottom, rectA)) 
        {    
            return true; 
        }
        else{
            //check cross intersections
            var _isCrossIntersect = function(rectA, rectB){
                return (rectA.top <= rectB.top && 
                        rectB.bottom <= rectA.bottom &&
                        rectB.left <= rectA.left && 
                        rectA.right <= rectB.right);
            };
           
            return (_isCrossIntersect(rectA, rectB) || 
                    _isCrossIntersect(rectB, rectA)); 
        }
    }
    
    // see: http://stackoverflow.com/a/9793197 for base inspiration of calc
    function getRotationDims(width, height, degrees){
        var radians = degrees * (Math.PI / 180);
        
        var rotatedHeight = width * Math.sin(radians) + 
                            height * Math.cos(radians);
        var rotatedWidth = width * Math.cos(radians) + 
                           height * Math.sin(radians);
        
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
        // if not given a valid placement, recursively attempt valid placements
        // until getting something that doesn't overlap the target element
        if(!(orientation in TIP_ORIENT_ARROW_DIR_MAP)){
            var arrow = tooltip.xtag.arrowEl;
            for(var tmpOrient in TIP_ORIENT_ARROW_DIR_MAP){
                // ensure arrow is pointing in correct direction
                arrow.setAttribute("arrow-direction", 
                                   TIP_ORIENT_ARROW_DIR_MAP[tmpOrient]);
                
                // recursively attempt a valid positioning
                _positionTooltip(tooltip, targetElem, tmpOrient);
                                   
                // found a good position, so finalize and stop checking
                if(!overlaps(tooltip, targetElem)){
                    return;
                }
            }
            return;
        }
    
    
        var offsetContainer = (tooltip.offsetParent) ? 
                                    tooltip.offsetParent : tooltip.parentNode;
        
        var arrow = tooltip.xtag.arrowEl;
        tooltip.style.top = "";
        tooltip.style.left = "";
        arrow.style.top = "";
        arrow.style.left = "";
        
        // coordinates of the target element, relative to the page
        var targetPageOffset = getPageOffset(targetElem);
        
        // coordinates of the tooltip's container element, relative to the page
        var containerPageOffset = getPageOffset(offsetContainer);
        
        // coordinates of the target element,relative to the tooltip's container
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
        
        // TODO: needs more intelligent rotation angle calculation; currently
        // just assumes rotation is 45 degrees
        var arrowRotationDegs = 45;
        var arrowDims = getRotationDims(arrow.offsetWidth, arrow.offsetHeight, 
                                        arrowRotationDegs);                                
        var arrowWidth = arrowDims.width;
        var arrowHeight = arrowDims.height;
        
        // coords for if we need to either vertically or horizontally center the
        // tooltip on the target element;
        // coords are relative to the tooltip's container
        var centerAlignCoords = {
            "left": targetContainerOffset.left + 
                    (targetWidth - origTooltipWidth)/2,
            "top": targetContainerOffset.top + 
                   (targetHeight - origTooltipHeight)/2
        };
        
        // given the final top and left of the tooltip, this helper function
        // will return the top and left coordinates that would allow the tooltip
        // arrow to be horizontally/vertically centered on an element;
        // returned coordinates are relative to the tooltip element
        var _getAlignedArrowCoords = function(tooltipTop, tooltipLeft){
            return {
                "left": (targetWidth - arrowWidth)/2 + 
                        targetContainerOffset.left - tooltipLeft,
                "top":  (targetHeight - arrowHeight)/2 + 
                         targetContainerOffset.top - newTop
            };
        };
        
        /** messy calculations for aligning the tooltip and the arrow **/
        
        // on first pass, determine the coordinates of the tooltip, as well as 
        // its constraints
        var newTop, newLeft, maxTop, maxLeft;
        if(orientation === "above"){
            arrowHeight /= 2; // remember that the arrow is translated to overlap
            newTop =targetContainerOffset.top - origTooltipHeight - arrowHeight;
            newLeft = centerAlignCoords.left;
            maxTop = containerHeight - origTooltipHeight - arrowHeight;
            maxLeft = containerWidth - origTooltipWidth;
        }
        else if(orientation === "below"){
            arrowHeight /= 2; // remember that the arrow is translated to overlap
            newTop = targetContainerOffset.top + targetHeight + arrowHeight;
            newLeft = centerAlignCoords.left;
            maxTop = containerHeight - origTooltipHeight;
            maxLeft = containerWidth - origTooltipWidth;
        }
        else if(orientation === "onleft"){
            arrowWidth /= 2; // remember that the arrow is translated to overlap
            newTop = centerAlignCoords.top;
            newLeft =targetContainerOffset.left - origTooltipWidth - arrowWidth;
            maxTop = containerHeight - origTooltipHeight;
            maxLeft = containerWidth - origTooltipWidth - arrowWidth;
        }
        else if(orientation === "onright"){
            arrowWidth /= 2; // remember that the arrow is translated to overlap
            newTop = centerAlignCoords.top;
            newLeft = targetContainerOffset.left + targetWidth + arrowWidth;
            maxTop = containerHeight - origTooltipHeight;
            maxLeft = containerWidth - origTooltipWidth;
        }
        else{
            throw "invalid orientation " + orientation;
        }
        
        // actually constrain and position the tooltip
        newTop = constrainNum(newTop, 0, maxTop);
        newLeft = constrainNum(newLeft, 0, maxLeft);
        tooltip.style.top = newTop + "px";
        tooltip.style.left = newLeft + "px";
        
        // position the arrow in the tooltip to center on the target element
        var arrowCoords = _getAlignedArrowCoords(newTop, newLeft);
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
        var arrow = tooltip.xtag.arrowEl;
        var targetOrient = tooltip.orientation;
        _positionTooltip(tooltip, targetElem, targetOrient);
        
        tooltip.setAttribute("visible", true);
        tooltip.xtag.currTargetElem = targetElem;
        
        xtag.fireEvent(tooltip, "tooltipshown", {
            "targetElem": targetElem
        });
    }
    
    function _hideTooltip(tooltip){
        tooltip.removeAttribute("visible");
        tooltip.xtag.currTargetElem = null;
        
        
        xtag.fireEvent(tooltip, "tooltiphidden");
    }
    
    // unbinds cached listeners and binds new listeners for new trigger 
    // parameters; call this anytime the tooltip trigger changes
    function _updateTriggerListeners(tooltip, newTriggerElems, newTriggerStyle){
        if(newTriggerElems === undefined || newTriggerElems === null){
            newTriggerElems = tooltip.xtag.triggeringElems;
        }
        if(newTriggerStyle === undefined || newTriggerStyle === null){
            newTriggerStyle = tooltip.xtag.currTriggerStyle;
        }
        
        // remove all active cached listeners
        var cachedListeners = tooltip.xtag.cachedListeners;
        cachedListeners.forEach(function(cachedListener){
            cachedListener.removeListener();
        });
        tooltip.xtag.cachedListeners = [];
        
        // clear old trigger elem attributes
        var oldTriggerElems = tooltip.xtag.triggeringElems;
        oldTriggerElems.forEach(function(oldTriggerElem){
            oldTriggerElem.removeAttribute("x-tooltip-targeted");
        });
        
        // bind new element listeners, but only those needed for the
        // current trigger style
        newTriggerElems.forEach(function(newTriggerElem){
            if(!hasParentNode(newTriggerElem, tooltip)){
                newTriggerElem.setAttribute("x-tooltip-targeted", 
                                            newTriggerStyle);
            }
        });
        
        // get new event listeners that we'll need to attach
        var getListenersFn = TRIGGER_STYLE_GETLISTENERS[newTriggerStyle];
        var listeners = getListenersFn(tooltip, newTriggerElems);
        
        // actually attach the listener functions
        listeners.forEach(function(listener){
            listener.attachListener();
        });
        tooltip.xtag.cachedListeners = listeners;
    }
    
    xtag.register("x-tooltip", {
        lifecycle:{
            created: function(){
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
                
                
                // default trigger variables
                this.xtag.orientation = "auto";
                this.xtag.triggerSelector = "_previousSibling";
                this.xtag.triggeringElems = _selectorToElems(
                                                this, this.xtag.triggerSelector
                                            );
                this.xtag.currTriggerStyle = "hover";
                this.xtag.currTargetElem = null;
                this.xtag.cachedListeners = [];
                _updateTriggerListeners(this, this.xtag.triggeringElems, 
                                this.xtag.currTriggerStyle);
            }
        },
        events: {
        },
        accessors: {
            // sets the placement of the tooltip in relation to a target element
            "orientation":{
                attribute: {},
                get: function(){
                    return this.xtag.orientation;
                },
                // when orientation of tooltip is set, also set direction of 
                // arrow pointer
                set: function(newOrientation){
                    newOrientation = newOrientation.toLowerCase();
                    var arrow = this.querySelector(".tooltip-arrow");
                    
                    var newArrowDir = null;
                    if(newOrientation in TIP_ORIENT_ARROW_DIR_MAP){
                        newArrowDir = TIP_ORIENT_ARROW_DIR_MAP[newOrientation];
                        arrow.setAttribute("arrow-direction", newArrowDir);
                    }
                    else{
                        // when auto placing, we will determine arrow direction
                        // when shown
                        arrow.removeAttribute("arrow-direction");
                    }
                    
                    this.xtag.orientation = newOrientation;
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
                    if(!(newTriggerStyle in TRIGGER_STYLE_GETLISTENERS)){
                        throw "invalid trigger style " + newTriggerStyle;
                    }
                    _updateTriggerListeners(this, null, newTriggerStyle)
                    this.xtag.currTriggerStyle = newTriggerStyle;
                }
            },
            
            // selector must be in relation to parent node of the tooltip
            // ie: can only select tooltip's siblings or deeper in the DOM tree
            "trigger-selector": {
                attribute: {},
                get: function(){
                    return this.xtag.triggerSelector;
                },
                set: function(newSelector){
                    var tooltip = this;
                    
                    // filter out selected elements that are 
                    // themselves in the tooltip
                    var selectedElems = _selectorToElems(this, newSelector);
                    var newTriggerElems = [];
                    selectedElems.forEach(function(selectedElem){
                        if(!hasParentNode(selectedElem, tooltip)){
                            newTriggerElems.push(selectedElem);
                        }
                    });
                    
                    _updateTriggerListeners(tooltip, newTriggerElems)
                    this.xtag.triggeringElems = newTriggerElems;
                    this.xtag.triggerSelector = newSelector;
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
            // call this when the position of the tooltip needs to be 
            // recalculated; such as after updating the DOM of the contents
            refreshPosition: function(){
                if(this.xtag.currTargetElem){
                    _positionTooltip(this, this.xtag.currTargetElem,
                                     this.orientation);
                }
            }
        }
    });
})();