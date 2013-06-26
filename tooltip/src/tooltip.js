(function(){
    // a data map of the tooltip orientation type to the type of direction the
    // tooltip arrow should take as a result
    var TIP_ORIENT_ARROW_DIR_MAP = {
        "top": "down",
        "bottom": "up",
        "left": "right",
        "right": "left"
    };
    
    
    /** isValidOrientation: (string)
    *
    *   utility function to simply return if the given orientation is 
    *   one listed in the top data map
    **/
    function isValidOrientation(orient){
        return orient in TIP_ORIENT_ARROW_DIR_MAP;
    }
    
    
    /** CachedListener : (DOM, string, Function)
    * a simple struct to store all information needed to add and remove
    * a particular event listener
    *
    * used to track a single event listener so that it can easily be 
    * bound/unbound
    * 
    * constructor params:
    *   elem                    the DOM element the event listener should be
    *                           bound/unbound to
    *   eventType               the name of the event that we want to 
    *                           bind/unbind listeners for
    *   listenerFn              a callback function to bind/unbind for the
    *                           given event on the given element
    **/
    function CachedListener(elem, eventType, listenerFn){
        this.eventType = eventType;
        this.listenerFn = listenerFn;
        this.elem = elem;
        this._attachedFn = null;
    }
    
    
    /** CachedListener.attachListener
    *   
    *   binds the event listener as described by the struct
    **/
    CachedListener.prototype.attachListener = function(){
        if(!this._attachedFn){
            this._attachedFn = xtag.addEvent(this.elem, this.eventType, 
                                             this.listenerFn);
            console.log("added", this.eventType, this.elem);
        }
    };
    
    
    /** CachedListener.attachListener
    *   
    *   unbinds the event listener as described by the struct
    **/
    CachedListener.prototype.removeListener = function(){
        if(this._attachedFn){
            xtag.removeEvent(this.elem, this.eventType, this._attachedFn);
            console.log("removed", this.eventType, this.elem);
        }
    };
    
    
    /** PRESET_TRIGGER_STYLE_GETLISTENERS
     * 
     * A data map of trigger "styles" mapped to callback functions that return
     * lists of the CachedListeners that the tooltip would need to bind
     * to properly show/hide the tooltip
     *
     * NOTE: DO NOT ATTACH LISTENERS HERE, LET THE CALLER DO IT
    **/
    var PRESET_TRIGGER_STYLE_GETLISTENERS = {
        /* the "none" style provides no default event listener functionality;
         * this is useful if the user wishes to do their own custom triggerstyle
         */
        "none": function(tooltip, triggerElems){
            return [];
        },
        /* the "hover" style allows the tooltip to be shown upon hovering over
         * a targeted element. The tooltip is hidden upon hovering off the
         * target/tooltip
         */
        "hover": function(tooltip, triggerElems){
            var createdListeners = [];
            
            // need a small delay before hiding a tooltip on hovering off the 
            // target in order to give the user a chance to interact with the
            // tooltip before it is hidden
            var hoverOutTimer = null;
            var hideDelay = 200; 
            var cancelTimerFn = function(){
                if(hoverOutTimer){
                    window.clearTimeout(hoverOutTimer);
                }
                hoverOutTimer = null;
            };
            
            // callback function for when a target element is hovered over
            var showTipTargetFn = mkIgnoreSubchildrenFn(function(e){
                cancelTimerFn();
                // don't trigger show when coming from a tooltip element
                var fromElem = e.relatedTarget || e.toElement;
                if(!hasParentNode(fromElem, tooltip)){
                    _showTooltip(tooltip, e.currentTarget);
                    e.stopPropagation();
                }
            });
            
            // callback function for when a target element is hovered off
            var hideTipTargetFn = mkIgnoreSubchildrenFn(function(e){
                cancelTimerFn();
                // don't trigger hide when exiting to a tooltip element
                var toElem = e.relatedTarget || e.toElement;
                if(!hasParentNode(toElem, tooltip)){
                    // add delay before hide so that we can interact w/ tooltip
                    hoverOutTimer = window.setTimeout(function(){
                        if(tooltip.xtag.currTriggerStyle === "hover")
                        {
                            _hideTooltip(tooltip);
                        }
                    }, hideDelay);
                    e.stopPropagation();
                }
            });
            
            // callback function for when the tooltip itself is hovered over
            var showTipTooltipFn = mkIgnoreSubchildrenFn(function(e){
                cancelTimerFn();
                
                // don't trigger show when coming from the target element
                var fromElem = e.relatedTarget || e.toElement;
                var lastTarget = tooltip.xtag.lastTargetElem;
                // also don't trigger a reshow unless we are actually hidden
                // (ie: unless the last target is also the CURRENT target
                if(!tooltip.hasAttribute("visible") &&
                    lastTarget && !hasParentNode(fromElem, lastTarget))
                {
                    _showTooltip(tooltip, lastTarget);
                    e.stopPropagation();
                }
            });
            
            // callback function for when the tooltip itself is hovered off
            var hideTipTooltipFn = mkIgnoreSubchildrenFn(function(e){
                cancelTimerFn();
                // don't get triggered when exiting to the target element
                var toElem = e.relatedTarget || e.toElement;
                var lastTarget = tooltip.xtag.lastTargetElem;
                if(lastTarget && !hasParentNode(toElem, lastTarget))
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
            
            // create CachedListeners for each target element and add them
            // to the list to be returned
            triggerElems.forEach(function(triggerElem){
                var enterListener = new CachedListener(triggerElem, "mouseover",
                                                       showTipTargetFn);
                var exitListener = new CachedListener(triggerElem, "mouseout", 
                                                      hideTipTargetFn);
                createdListeners.push(enterListener);
                createdListeners.push(exitListener);
            });
            
            // also create/add the CachedListeners fo rthe tooltip itself
            createdListeners.push(
                new CachedListener(tooltip, "mouseover", showTipTooltipFn)
            );
            createdListeners.push(
                new CachedListener(tooltip, "mouseout", hideTipTooltipFn)
            );
            
            return createdListeners;
        }
    };
    
    
    // given an event type, create and return a list of CachedListeners where 
    // triggering such an event on a target elem toggles the tooltip visibility,
    // triggering the tooltip is ignored, and triggering the body 
    // closes the tooltip
    function mkGenericListeners(tooltip, triggerElems, eventName){
        var createdListeners = [];
            
        // create and add the visibility-toggling click callback on target
        // elements
        var targetClickFn = function(e){
            if(tooltip.hasAttribute("visible") && 
               tooltip.xtag.lastTargetElem === e.currentTarget)
            {
                _hideTooltip(tooltip);
            }
            else{
                _showTooltip(tooltip, e.currentTarget);
            }
            e.stopPropagation();
        };
        
        triggerElems.forEach(function(triggerElem){
            var targetListener = new CachedListener(triggerElem, eventName, 
                                                    targetClickFn);
            createdListeners.push(targetListener);
        });
        
        // create and add listener for when the user clicks outside the
        // tooltip to hide the tooltip
        createdListeners.push(
            new CachedListener(
                document.body, eventName, 
                function(e){
                  if(tooltip.hasAttribute("visible") && 
                     !tooltip.hasAttribute("ignore-outer-trigger"))
                  {
                    _hideTooltip(tooltip);
                  }
                }
            )
        );
        
        // stop propagation on clicking the tooltip so that we dont just
        // immediately close it due to the body listener
        createdListeners.push(
            new CachedListener(tooltip, eventName, function(e){
                e.stopPropagation();
            })
        );
        return createdListeners;
    }
    
    
    /** hasParentNode: (DOM, DOM) => Boolean
    * 
    *  utility function that determines if the given element actually has the 
    *  proposed parent element as a parent or ancestor node
    **/
    function hasParentNode(elem, parent){
        while(elem){
            if(elem === parent){
                return true;
            }
            elem = elem.parentNode;
        }
        return false;
    }
    
    
    /** mkIgnoreSubchildrenFn: Function => Function
     *
     * creates and returns a callback function for mouseover/mouseleave 
     * events where:
     * - for mouseover events, only fires callback when
     *   the mouse first enters the element that has the mouseover event 
     *   listener attached to it and ignores any mouseovers between children
     *   elements in this same continer element; essentially emulates jQuery's
     *   mouseenter polyfill
     * - for mouseout events, only fires callback when the mouse actually
     *   completely exits the element that has the mouseleave event 
     *   listener attached to it and ignores any mouseouts that exit to 
     *   somewhere that is still within the listening container element;
     *   emulates jQuery's mouseleave polyfill
     * - acts normally for any non-mouseover/mouseleave events
     *
     * TL;DR edition: creates a function that doesn't fire a callback if the
     * event is simply triggered by moving between children of the same 
     * element; this is similar to jQuery's mouseenter/mouseleave
     * implementations
     *
     * params:
     *      callback                    a callback function taking an event
     *                                  to be called when moving between
     *                                  two elements not both in the same
     *                                  listening element
     *      containerElem               (optional) Specify the container whose 
     *                                  children we wish to ignore.
     *                                  This is useful for event delegation, 
     *                                  where the listening element may not be
     *                                  the element we want to ignore childrenof
     **/
    function mkIgnoreSubchildrenFn(callback, containerElem){
        return function(e){
            if(!containerElem){
                containerElem = e.currentTarget;
            }
            var relElem = e.relatedTarget || e.toElement;
            
            if(relElem)
            {
                if(!hasParentNode(relElem, containerElem)){
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
    
    
    /** _selectorToElems: (x-tooltip, string) => DOM list
     *
     * returns list of DOM elements selected by the given selector string 
     * in relation to the tooltip
     *
     * If given "_previousSibling", returns the previous sibling of the tooltip
     * If given "_nextSibling", returns the next sibling of the tooltip
     * Otherwise, applies the selector as a CSS query selector on the document
     */
    function _selectorToElems(tooltip, selector){
        if(selector === "_previousSibling"){
            return (tooltip.previousElementSibling) ? 
                      [tooltip.previousElementSibling] : [];
        }
        else if(selector === "_nextSibling"){
            return (tooltip.nextElementSibling) ? 
                      [tooltip.nextElementSibling] : [];
        }
        // otherwise, apply as CSS selector string
        else{
            return xtag.query(document, selector);
        }
    }
    
    
    /** overlaps: (DOM, DOM) => Boolean
    *
    *  returns true if the two given elements' bounding boxes visually overlap
    **/
    function overlaps(elemA, elemB){
        var _pointIsInRect = function(x, y, rect){
            return (rect.left <= x && x <= rect.right && 
                    rect.top <= y && y <= rect.bottom);
        };
        
        var absCoordsA = elemA.getBoundingClientRect();
        var absCoordsB = elemB.getBoundingClientRect();
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
        
        // checks if any corner of one rect is contained in the other rect
        var _cornersOverlapBox = function(rectA, rectB){
            return (_pointIsInRect(rectA.left, rectA.top, rectB) || 
                    _pointIsInRect(rectA.right, rectA.top, rectB) || 
                    _pointIsInRect(rectA.right, rectA.bottom, rectB) || 
                    _pointIsInRect(rectA.left, rectA.bottom, rectB));
        };
       
        // checks for cross intersections
        var _isCrossIntersect = function(rectA, rectB){
            return (rectA.top <= rectB.top && 
                    rectB.bottom <= rectA.bottom &&
                    rectB.left <= rectA.left && 
                    rectA.right <= rectB.right);
        };
       
        return (_cornersOverlapBox(rectA, rectB) ||
                _cornersOverlapBox(rectB, rectA) ||
                _isCrossIntersect(rectA, rectB) || 
                _isCrossIntersect(rectB, rectA)); 
    }
    
    
    /** getRotationDims: (number, number, number) => {}
    *
    * returns the height and width of the given dimensions rotated by the
    * given number of degrees
    * see: http://stackoverflow.com/a/9793197 for base inspiration of calc
    *   
    **/
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
    
    
    /** constrainNum: (number, number, number) => number
    *   
    * simple utility function to constrain a given number to the given range
    **/
    function constrainNum(num, min, max){
        var output = num;
        output = (min !== undefined) ? Math.max(min, output) : output;
        output = (max !== undefined) ? Math.min(max, output) : output;
        return output;
    }    
    
    
    /** _positionTooltip: (x-tooltip, DOM, string)
     *
     * when called, attempts to reposition the tooltip so that it is centered
     * on and pointing to the target element with the correct orientation
     *
     * if given orientation is not a valid orientation type, this will attempt
     * to autoplace the tooltip in an orientation that doesn't overlap the 
     * targeted elements
     **/
    function _positionTooltip(tooltip, targetElem, orientation){
        var arrow = tooltip.xtag.arrowEl;
        // if not given a valid placement, recursively attempt valid placements
        // until getting something that doesn't overlap the target element
        if(!(isValidOrientation(orientation))){
            for(var tmpOrient in TIP_ORIENT_ARROW_DIR_MAP){
                // ensure arrow is pointing in correct direction
                arrow.setAttribute("arrow-direction", 
                                   TIP_ORIENT_ARROW_DIR_MAP[tmpOrient]);
                // recursively attempt a valid positioning
                _positionTooltip(tooltip, targetElem, tmpOrient);
                                   
                // found a good position, so finalize and stop checking
                if(!overlaps(tooltip, targetElem)){
                    // set the auto-orientation attribute so that CSS animations
                    // still apply even though orientation attribute is not
                    // valid
                    tooltip.setAttribute("auto-orientation", tmpOrient);
                    return;
                }
            }
            return;
        }
        
        var offsetContainer = (tooltip.offsetParent) ? 
                                    tooltip.offsetParent : tooltip.parentNode;
        
        tooltip.style.top = "";
        tooltip.style.left = "";
        arrow.style.top = "";
        arrow.style.left = "";
        
        // coordinates of the target element, relative to the page
        var targetPageOffset = targetElem.getBoundingClientRect();
        
        // coordinates of the tooltip's container element, relative to the page
        var containerPageOffset = offsetContainer.getBoundingClientRect();
        
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
        if(orientation === "top"){
            arrowHeight /= 2; // remember that the arrow is translated to 
                              // overlap the balloon
            newTop =targetContainerOffset.top - origTooltipHeight - arrowHeight;
            newLeft = centerAlignCoords.left;
            maxTop = containerHeight - origTooltipHeight - arrowHeight;
            maxLeft = containerWidth - origTooltipWidth;
        }
        else if(orientation === "bottom"){
            arrowHeight /= 2; //remember that the arrow is translated to overlap
            newTop = targetContainerOffset.top + targetHeight + arrowHeight;
            newLeft = centerAlignCoords.left;
            maxTop = containerHeight - origTooltipHeight;
            maxLeft = containerWidth - origTooltipWidth;
        }
        else if(orientation === "left"){
            arrowWidth /= 2; // remember that the arrow is translated to overlap
            newTop = centerAlignCoords.top;
            newLeft =targetContainerOffset.left - origTooltipWidth - arrowWidth;
            maxTop = containerHeight - origTooltipHeight;
            maxLeft = containerWidth - origTooltipWidth - arrowWidth;
        }
        else if(orientation === "right"){
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
        if(orientation === "top" || orientation === "bottom"){
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
        
        return;
    }
    
    
    /** _showTooltip: (x-tooltip, DOM)
     *
     * positions the tooltip on the triggering element (if given) and makes the
     * tooltip visible
     *
     * fires a 'tooltipshown' event
     **/
    function _showTooltip(tooltip, triggerElem){
        if(triggerElem === tooltip){
            console.log("The tooltip's target element is the tooltip itself!" +
                        " Is this intentional?");
        }
        var arrow = tooltip.xtag.arrowEl;
        var targetOrient = tooltip.orientation;
        
        // fire this when preparation for showing the tooltip is complete
        var _readyToShowFn = function(){
            tooltip.setAttribute("visible", true);
            
            xtag.fireEvent(tooltip, "tooltipshown", {
                "triggerElem": triggerElem
            });
        };
        
        if(triggerElem){
            // skip transition in order to completely position tooltip before
            // marking as visible and triggering the CSS transition
            xtag.skipTransition(tooltip, function(){
                _positionTooltip(tooltip, triggerElem, targetOrient);
                tooltip.xtag.lastTargetElem = triggerElem;
                
                return _readyToShowFn;
            }, this);
        }
        else{
            tooltip.style.top = "";
            tooltip.style.left = "";
            arrow.style.top = "";
            arrow.style.left = "";
            _readyToShowFn();
        }
    }
    
    
    /** _hideTooltip: (x-tooltip) 
     *
     * as expected, simply hides/cleans up the tooltip
     *
     * fires a 'tooltiphidden' event
     **/
    function _hideTooltip(tooltip){
        tooltip.removeAttribute("visible");
        // remove remnant attribute used for auto placement animations
        if(isValidOrientation(tooltip.orientation)){
            tooltip.removeAttribute("auto-orientation");
        }
        
        xtag.fireEvent(tooltip, "tooltiphidden");
    }
    
    
    /** _updateTriggerListeners: (x-tooltip, DOM list, string)
     *
     * unbinds existing cached listeners and binds new listeners for new trigger 
     * parameters; call this anytime the tooltip trigger changes
     * if newTriggerElems is not given, uses previously existing trigger elems
     * if newTriggerStyle is not given, uses the previously used trigger style
    **/
    function _updateTriggerListeners(tooltip, newTriggerElems, newTriggerStyle){
        if(newTriggerElems === undefined || newTriggerElems === null){
            newTriggerElems = tooltip.xtag.triggeringElems;
        }
        // if we are actually changing the triggering elements, but are losing
        // our last target elem, default to first one in the list
        else if(newTriggerElems.indexOf(tooltip.xtag.lastTargetElem) === -1){
            tooltip.xtag.lastTargetElem = (newTriggerElems.length > 0) ? 
                                           newTriggerElems[0] : null; 
            // reposition tooltip
            _positionTooltip(tooltip, tooltip.xtag.lastTargetElem, 
                             tooltip.orientation);
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
        var listeners;
        if(newTriggerStyle in PRESET_TRIGGER_STYLE_GETLISTENERS){
            var getListenersFn = PRESET_TRIGGER_STYLE_GETLISTENERS[newTriggerStyle];
            listeners = getListenersFn(tooltip, newTriggerElems);
        }
        else{
            listeners = mkGenericListeners(tooltip, newTriggerElems, newTriggerStyle);
        }
        
        // actually attach the listener functions
        listeners.forEach(function(listener){
            listener.attachListener();
        });
        tooltip.xtag.cachedListeners = listeners;
        
        // also hide the tooltip since the trigger has changed
        _hideTooltip(tooltip);
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
                this.xtag.targetSelector = "_previousSibling";
                this.xtag.triggeringElems = _selectorToElems(
                                                this, this.xtag.targetSelector
                                            );
                this.xtag.currTriggerStyle = "hover";
                // remember who the last element that triggered the tip was
                // (ie: who we should be pointing to if suddenly told to show
                //  outside of a trigger style)
                var triggeringElems = this.xtag.triggeringElems;
                this.xtag.lastTargetElem = (triggeringElems.length > 0) ? 
                                            triggeringElems[0] : null; 
                
                // remember what event listeners are still active
                this.xtag.cachedListeners = [];
                _updateTriggerListeners(this, this.xtag.triggeringElems, 
                                        this.xtag.currTriggerStyle);
            }
        },
        events: {
            // tooltipshown and tooltiphidden are fired manually
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
                    if(isValidOrientation(newOrientation)){
                        newArrowDir = TIP_ORIENT_ARROW_DIR_MAP[newOrientation];
                        arrow.setAttribute("arrow-direction", newArrowDir);
                        arrow.removeAttribute("auto-orientation");
                    }
                    else{
                        // when auto placing, we will determine arrow direction
                        // when shown
                        arrow.removeAttribute("arrow-direction");
                    }
                    
                    this.xtag.orientation = newOrientation;
                    
                    this.refreshPosition();
                }
            },
            
            // selects the style of tooltip trigger to use
            // can choose from presets or set to "none" in order to define
            // custom trigger
            "triggerStyle": {
                attribute: {name: "trigger-style"},
                get: function(){
                    return this.xtag.currTriggerStyle;
                },
                set: function(newTriggerStyle){
                    _updateTriggerListeners(this, null, newTriggerStyle);
                    this.xtag.currTriggerStyle = newTriggerStyle;
                }
            },
            
            // selector must be in relation to parent node of the tooltip
            // ie: can only select tooltip's siblings or deeper in the DOM tree
            "targetSelector": {
                attribute: {name: "target-selector"},
                get: function(){
                    return this.xtag.targetSelector;
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
                    
                    _updateTriggerListeners(tooltip, newTriggerElems);
                    this.xtag.triggeringElems = newTriggerElems;
                    this.xtag.targetSelector = newSelector;
                }
            },
            
            "ignoreOuterTrigger":{
                attribute: {
                    boolean: true, 
                    name: "ignore-outer-trigger"
                }
            },
            
            // the DOM element representing the content of the tooltip
            "content": {
                get: function(){
                    return this.xtag.contentEl;
                },
                // can use this to replace the DOM outright
                set: function(newContentElem){
                    var oldContent = this.xtag.contentEl;
                    
                    xtag.addClass(newContentElem, "tooltip-content");
                    
                    this.replaceChild(newContentElem, oldContent);
                    this.xtag.contentEl = newContentElem;
                    
                    this.refreshPosition();
                }
            },
            
            "presetTriggerStyles": {
                get: function(){
                    var output = [];
                    for(presetName in PRESET_TRIGGER_STYLE_GETLISTENERS){
                        output.push(presetName);
                    }
                    return output;
                }
            }
        },
        methods: {
            // called when the position of the tooltip needs to be manually
            // recalculated; such as after updating the DOM of the contents
            refreshPosition: function(){
                if(this.xtag.lastTargetElem){
                    _positionTooltip(this, this.xtag.lastTargetElem,
                                     this.orientation);
                }
            },
            
            // exactly as you'd expect; shows the tooltip
            show: function(){
                _showTooltip(this, this.xtag.lastTargetElem);
            },
            
            // exactly as you'd expect; hides the tooltip
            hide: function(){
                _hideTooltip(this);
            },
            
            // exactly as you'd expect; toggles between showing and hiding the
            // tooltip
            toggle: function(){
                if(this.hasAttribute("visible")){
                    this.hide();
                }
                else{
                    this.show();
                }
            }
        }
    });
})();