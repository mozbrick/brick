(function(){
    // a data map of the tooltip orientation type to the type of direction the
    // tooltip arrow should take as a result
    var TIP_ORIENT_ARROW_DIR_MAP = {
        "top": "down",
        "bottom": "up",
        "left": "right",
        "right": "left"
    };
    // the OuterTriggerManager managing outer-trigger listeners for dismissing
    //  tooltips. Shared with all tooltips
    var OUTER_TRIGGER_MANAGER;
    // a mapping of preset trigger styles to callback functions returning
    // CachedListener lists
    var PRESET_STYLE_LISTENERFNS;
    
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
        }
    };
    
    
    /** CachedListener.attachListener
    *   
    *   unbinds the event listener as described by the struct
    **/
    CachedListener.prototype.removeListener = function(){
        if(this._attachedFn){
            xtag.removeEvent(this.elem, this.eventType, this._attachedFn);
            this._attachedFn = null;
        }
    };
    
    
    /** OuterTriggerEventStruct: (string)
    * 
    *  an object maintaining a CachedListener for a single event type to handle
    *  dismissing tooltips when the event is triggered outside of it.
    *  Maintains a list of tooltips to which this listener applies
    *
    *  constructor params:
    *     eventType                 the literal name of the event to listen for
    *                               ie: "click", not "click:delegate(foo)"
    **/
    function OuterTriggerEventStruct(eventType){
        this._cachedListener = null;
        this._tooltips = [];
        
        var struct = this;
        // set up the function that will be attached to the body to handle
        // dismissal of tooltips
        var outerTriggerListener = function(e){
            struct._tooltips.forEach(function(tooltip){
                // check if the tooltip is even dismissable, and if not,
                // skip dismissing it
                if((!tooltip.hasAttribute("visible")) ||
                   tooltip.hasAttribute("ignore-outer-trigger"))
                {  
                    return;
                }
                // otherwise, check if we are clicking inside the tooltip,
                // and if so, also skip dismissal
                else if(hasParentNode(e.target, tooltip)){
                    return;
                }
                // otherwise, finally dismiss the tooltip
                else{
                    _hideTooltip(tooltip);
                }
            });
        };
        this._cachedListener = new CachedListener(document, eventType, 
                                                  outerTriggerListener);
        this._cachedListener.attachListener();
    }
    
    /** OuterTriggerEventStruct.destroy
    *  unbinds the maintained cached listener and removes internal references
    **/
    OuterTriggerEventStruct.prototype.destroy = function(){
        this._cachedListener.removeListener();
        this._cachedListener = null;
        this._tooltips = null;
    };
    
    /** OuterTriggerEventStruct.containsTooltip: (DOM) => Boolean
    *
    * determines if this struct is responsible for handling the given tooltip
    **/
    OuterTriggerEventStruct.prototype.containsTooltip = function(tooltip){
        return this._tooltips.indexOf(tooltip) !== -1;
    };
    
    /** OuterTriggerEventStruct.addTooltip: (DOM) 
    *
    * adds the given toolip to the list of tooltips this struct is 
    * responsible for
    **/
    OuterTriggerEventStruct.prototype.addTooltip = function(tooltip){
        if(!this.containsTooltip(tooltip)){
            this._tooltips.push(tooltip);
        }
    };
    
    /** OuterTriggerEventStruct.removeTooltip: (DOM) 
    *
    * removes the given tooltip from the list of tooltips this struct 
    * is responsible for
    **/
    OuterTriggerEventStruct.prototype.removeTooltip = function(tooltip){
        if(this.containsTooltip(tooltip)){
            this._tooltips.splice(this._tooltips.indexOf(tooltip), 1);
        }
    };
    
    /** OuterTriggerEventStruct.numTooltips
    *   property returning the number of tooltips this struct is currently
    *   maintaining
    **/
    Object.defineProperties(OuterTriggerEventStruct.prototype, {
        "numTooltips": {
            get: function(){
                return this._tooltips.length;
            }
        }
    });
    
    
    
    /** OuterTriggerManager
    *
    * manages a dictionary of event types mapped to OuterTriggerEventStruct objs
    **/
    function OuterTriggerManager(){
        this.eventStructDict = {};
    }
    
    
   /** OuterTriggerManager.registerTooltip : (string, DOM)
    *
    * adds a tooltip to the event dictionary and sets it to be handled by the
    * struct for the given type
    **/
    OuterTriggerManager.prototype.registerTooltip = function(eventType, tooltip){
        // if event already in dict, just make the existing struct responsible
        // for the tooltip
        if(eventType in this.eventStructDict){
            var eventStruct = this.eventStructDict[eventType];
            if(!eventStruct.containsTooltip(tooltip)){
                eventStruct.addTooltip(tooltip);
            }
        }
        // if event does not yet exist, set up new struct for it
        else{
            this.eventStructDict[eventType] = new OuterTriggerEventStruct(eventType);
            this.eventStructDict[eventType].addTooltip(tooltip);
        }
    };
    
    /** OuterTriggerManager.unregisterTooltip : (string, DOM)
    *
    * removes a tooltip from the event dictionary and unsets it from being 
    * handled by the struct for the given event type
    **/
    OuterTriggerManager.prototype.unregisterTooltip = function(eventType, tooltip){
        if(eventType in this.eventStructDict && 
           this.eventStructDict[eventType].containsTooltip(tooltip))
        {
            var eventStruct = this.eventStructDict[eventType];
            eventStruct.removeTooltip(tooltip);
            if(eventStruct.numTooltips === 0){
                eventStruct.destroy();
                delete(this.eventStructDict[eventType]);
            }
        }
    };
    
    // make this a globally defined variable to track information about all
    // tooltips, not just a single one
    OUTER_TRIGGER_MANAGER = new OuterTriggerManager();
    
    
    
    
    /** _mkPrevSiblingTargetListener: (DOM, string, function) => CachedListener
    * 
    * creates and returns a CachedListener representing a "delegated" event
    * listener on the body for the previous sibling of the tooltip
    *
    * fakes a delegated event, since there isn't a reliable single-shot
    * CSS selector for the previous sibling of a specific unnamed element
    *
    * callback will be called with a 'this' scope of the tooltip's 
    * previous sibling element
    *
    * params:
    *   tooltip                     the x-tooltip element we are working in
    *                               relation to
    *   eventName                   the raw name of the event to listen for
    *                               (ex: "click")
    *   callback                    the callback function to call when the
    *                               the tooltip's previous sibling is triggered;
    *                               will be called using said sibling as the
    *                               'this' scope
    **/
    function _mkPrevSiblingTargetListener(tooltip, eventName, callback){
        var filteredCallback = function(e){
            if(callback && hasParentNode(e.target, 
                                         tooltip.previousElementSibling))
            {
                // make sure to change the this binding to be that of the 
                // "delegated" previous sibling element
                callback.call(tooltip.previousElementSibling, e);
            }
        };
        
        // note that we attach to document.documentElement so that this
        // gets fired before any outer-click handlers (which are attached to
        // document)
        return new CachedListener(document.documentElement, eventName, 
                                  filteredCallback);
    }
    
    
    /** _mkNextSiblingTargetListener: (DOM, string, function) => CachedListener
    * 
    * creates and returns a CachedListener representing a "delegated" event
    * listener on the body for the next sibling of the tooltip
    *
    * fakes a delegated event, since there isn't a reliable single-shot
    * CSS selector for the next sibling of a specific unnamed element
    *
    * callback will be called with a 'this' scope of the tooltip's 
    * previous sibling element
    *
    * params:
    *   tooltip                     the x-tooltip element we are working in
    *                               relation to
    *   eventName                   the raw name of the event to listen for
    *                               (ex: "click")
    *   callback                    the callback function to call when the
    *                               the tooltip's next sibling is triggered;
    *                               will be called using said sibling as the
    *                               'this' scope
    **/
    function _mkNextSiblingTargetListener(tooltip, eventName, callback){
        var eventDelegateStr = eventName+":delegate(x-tooltip+*)";
        var filteredCallback = function(e){
            if(callback && this === tooltip.nextElementSibling){
                // make sure to change the this binding to be that of the 
                // "delegated" next sibling element
                callback.call(this, e);
            }
        };
        
        // note that we attach to document.documentElement so that this
        // gets fired before any outer-click handlers (which are attached to
        // document)
        return new CachedListener(document.documentElement, eventDelegateStr, 
                                  filteredCallback);
    }
    
    
    /** _getTargetDelegatedListener: (DOM, string, string, function) => 
     *                                  CachedListener
     *
     * given a callback function to call on elements selected by the given 
     * targetSelector, returns a single CachedListener representing the
     * listener for a delegated event that calls the given callback function
     *
     * params:
     *   tooltip                     the x-tooltip element we are working in
     *                               relation to
     *   targetSelector              the string used to select the elements
     *                               to delegate as targets; follows the same
     *                               rules as x-tooltip's targetSelector
     *                               accessor
     *   eventName                   the raw name of the event to listen for
     *                               (ex: "click")
     *   callback                    the callback function to call when a
     *                               target element is triggered;
     *                               will be called using said element as the
     *                               'this' scope
    **/
    function _getTargetDelegatedListener(tooltip, targetSelector, eventName, 
                                         targetCallback)
    {
        if(targetSelector === "_previousSibling"){
            return _mkPrevSiblingTargetListener(tooltip, eventName, 
                                               targetCallback);
        }
        else if(targetSelector === "_nextSibling"){
            return _mkNextSiblingTargetListener(tooltip, eventName, 
                                               targetCallback);
        }
        else{
            var delegateEventStr = eventName+":delegate("+targetSelector+")";
            
            // note that we attach to document.documentElement so that this
            // gets fired before any outer-click handlers (which are attached to
            // document)
            return new CachedListener(
                            document.documentElement, delegateEventStr, 
                            function(e){
                                var delegatedElem = this;
                                // filter out elements that are already
                                // part of the tooltip
                                if(!hasParentNode(delegatedElem, tooltip)){
                                    // remember to bind 'this' scope!
                                    targetCallback.call(delegatedElem, e);
                                }
                            }
                        );
        }
    }
    
    
    /** PRESET_STYLE_LISTENERFNS
     * 
     * A data map of trigger "styles" mapped to callback functions that return
     * lists of the CachedListeners that the tooltip would need to bind
     * to properly show/hide the tooltip
     *
     * NOTE: DO NOT ATTACH LISTENERS HERE, LET THE CALLER DO IT
    **/
    PRESET_STYLE_LISTENERFNS = {
        /* the "none" style provides no default event listener functionality;
         * this is useful if the user wishes to do their own custom triggerstyle
         */
        "none": function(tooltip, targetSelector){
            return [];
        },
        /* the "hover" style allows the tooltip to be shown upon hovering over
         * a targeted element. The tooltip is hidden upon hovering off the
         * target/tooltip
         */
        "hover": function(tooltip, targetSelector){
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
            
            /** set up callbacks for target elements **/
            
            // callback function for when a target element is hovered over
            var showTipTargetFn = mkIgnoreSubchildrenFn(function(e){
                cancelTimerFn();
                var delegatedElem = this;
                // don't trigger show when coming from a tooltip element
                var fromElem = e.relatedTarget || e.toElement;
                if(!hasParentNode(fromElem, tooltip)){
                    _showTooltip(tooltip, delegatedElem);
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
                        if(tooltip.triggerStyle === "hover")
                        {
                            _hideTooltip(tooltip);
                        }
                    }, hideDelay);
                }
            });
            
            //create CachedListeners for target elements
            var targetEnterListener = _getTargetDelegatedListener(
                                        tooltip, targetSelector, "tapenter", 
                                        showTipTargetFn
                                      );
            var targetExitListener = _getTargetDelegatedListener(
                                        tooltip, targetSelector, "tapleave", 
                                        hideTipTargetFn
                                      );
            createdListeners.push(targetEnterListener);
            createdListeners.push(targetExitListener);    
            
            /** set up callbacks for the tooltip **/
            
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
                        if(tooltip.triggerStyle === "hover")
                        {
                            _hideTooltip(tooltip);
                        }
                    }, hideDelay);
                    e.stopPropagation();
                }
            });
            
            // also create/add the CachedListeners fo rthe tooltip itself
            createdListeners.push(
                new CachedListener(tooltip, "tapenter", showTipTooltipFn)
            );
            createdListeners.push(
                new CachedListener(tooltip, "tapleave", hideTipTooltipFn)
            );
            
            return createdListeners;
        }
    };
    
    
    /** mkGenericListeners: (DOM, string, string) => list of CachedListener
    
     given an event type, create and return a list of CachedListeners that
     represents the user workflow where 
     triggering such an event on a target elem toggles the tooltip visibility
     
     (the handlers for dismissing the tooltip on clicking outside it are handled
      by the OUTER_TRIGGER_MANAGER)
    **/
    function mkGenericListeners(tooltip, targetSelector, eventName){
        var createdListeners = [];
            
        // create and add the visibility-toggling click callback on target
        // elements
        var targetTriggerFn = function(e){
            var delegatedElem = this;
            if(tooltip.hasAttribute("visible") && 
               delegatedElem === tooltip.xtag.lastTargetElem)
            {
                _hideTooltip(tooltip);
            }
            else{
                // note: while e.target is the literally clicked element, and
                // e.currentTarget is wherever the delegated event was bound,
                // this is the the element that actually matches the delegation
                // selector
                _showTooltip(tooltip, delegatedElem);
            }
        };
        
        var delegatedTargetListener = _getTargetDelegatedListener(
                                        tooltip, targetSelector, eventName, 
                                        targetTriggerFn
                                      );
        createdListeners.push(delegatedTargetListener);
        
        return createdListeners;
    }
    
    
    /** hasParentNode: (DOM, DOM) => Boolean
    * 
    *  utility function that determines if the given element actually has the 
    *  proposed parent element as a parent or ancestor node
    **/
    function hasParentNode(elem, parent){
        if(parent.contains){
            return parent.contains(elem);
        }
        else{
            while(elem){
                if(elem === parent){
                    return true;
                }
                elem = elem.parentNode;
            }
            return false;
        }
    }
    
    
    /** mkIgnoreSubchildrenFn: Function => Function
     *
     * creates and returns a callback function that ignores events triggered 
     * by crossing between children of the same listening node
     *
     * this affects events by:
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
     * params:
     *      callback                    a callback function taking an event
     *                                  to be called when moving between
     *                                  two elements not both in the same
     *                                  listening element
     *                                  IMPORTANT NOTE: the callback will
     *                                  be called with a "this" scope of its
     *                                  containing element
     **/
    function mkIgnoreSubchildrenFn(callback){
        return function(e){
            var containerElem = this;
            var relElem = e.relatedTarget || e.toElement;
            
            if(relElem)
            {
                if(!hasParentNode(relElem, containerElem)){
                    callback.call(this, e);
                }
            }
            // if not a event where we need to ignore subchildren, don't change
            // how the callback gets called
            else{
                callback.call(this, e);
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
        var elems = [];
        if(selector === "_previousSibling"){
            elems = (tooltip.previousElementSibling) ? 
                      [tooltip.previousElementSibling] : [];
        }
        else if(selector === "_nextSibling"){
            elems = (tooltip.nextElementSibling) ? 
                      [tooltip.nextElementSibling] : [];
        }
        // otherwise, apply as CSS selector string
        else{
            elems = xtag.query(document, selector);
        }
        
        // filter out elements that are part of the tooltip itself
        var i = 0;
        while(i < elems.length){
            var elem = elems[i];
            if(hasParentNode(elem, tooltip)){
                elems.splice(i, 1);
            }
            else{
                i++;
            }
        }
        return elems;
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
    function _positionTooltip(tooltip, targetElem, orientation, reattemptDepth){
        // ignore attempts to position when not yet in document
        if(!tooltip.parentNode){
            tooltip.left = "";
            tooltip.top = "";
            return;
        }
        reattemptDepth = (reattemptDepth === undefined) ? 0 : reattemptDepth;
        
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
                    /* set the auto-orientation attribute so that CSS animations
                     * still apply even though orientation attribute is not
                     * valid
                     */
                    tooltip.setAttribute("auto-orientation", tmpOrient);
                    return;
                }
            }
            // if we get to this point, we didn't find any good spots, 
            // just go with the last possible orientation
            tooltip.setAttribute("auto-orientation", tmpOrient);
            return;
        }
        
        var offsetContainer = (tooltip.offsetParent) ? 
                                tooltip.offsetParent : tooltip.parentNode;
        
        // only position if NOT currently recursing to get a more stable
        // position, or final size will never match up to initial size
        if(!reattemptDepth){
            tooltip.style.top = "";
            tooltip.style.left = "";
            arrow.style.top = "";
            arrow.style.left = "";
        }
        
        // coordinates of the target element, relative to the page
        var targetPageOffset = targetElem.getBoundingClientRect();
        
        // coordinates of the tooltip's container element, relative to the page
        var containerPageOffset = offsetContainer.getBoundingClientRect();
        
        // coordinates of the target element, relative to the tooltip's container
        var targetContainerOffset = {
            "top": targetPageOffset.top - containerPageOffset.top + offsetContainer.scrollTop,
            "left": targetPageOffset.left - containerPageOffset.left + offsetContainer.scrollLeft
        };
        
        var containerWidth = offsetContainer.scrollWidth;
        var containerHeight = offsetContainer.scrollHeight;
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
        
        // finally, constrain and position the tooltip
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
        
        // if the tooltip window changed size in its placement, recurse
        // once to try to get a more stable placement
        var recursionLimit = 1;
        if(reattemptDepth < recursionLimit &&
           (origTooltipWidth !== tooltip.offsetWidth || 
            origTooltipHeight !== tooltip.offsetHeight))
        {
            _positionTooltip(tooltip, targetElem, orientation, 
                             reattemptDepth+1);
        }
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
        // remove remnant attribute used for auto placement animations
        if(isValidOrientation(tooltip.orientation)){
            tooltip.removeAttribute("auto-orientation");
        }
        
        if(tooltip.hasAttribute("visible")){
            tooltip.removeAttribute("visible");
            xtag.fireEvent(tooltip, "tooltiphidden");
        }
    }
    
    function _destroyListeners(tooltip){
        var cachedListeners = tooltip.xtag.cachedListeners;
        cachedListeners.forEach(function(cachedListener){
            cachedListener.removeListener();
        });
        tooltip.xtag.cachedListeners = [];
        OUTER_TRIGGER_MANAGER.unregisterTooltip(tooltip.triggerStyle, tooltip);
    }
    
    /** _updateTriggerListeners: (x-tooltip, string, string)
     *
     * unbinds existing cached listeners and binds new listeners for new trigger 
     * parameters; call this anytime the tooltip trigger changes
     * if newTargetSelector is not given, uses previously existing selector
     * if newTriggerStyle is not given, uses the previously used trigger style
    **/
    function _updateTriggerListeners(tooltip, newTargetSelector, newTriggerStyle){
        // dont update listeners if tooltip is not yet actually in the document
        if(!tooltip.parentNode){
            return;
        }
    
        if(newTargetSelector === undefined || newTargetSelector === null){
            newTargetSelector = tooltip.targetSelector;
        }
        if(newTriggerStyle === undefined || newTriggerStyle === null){
            newTriggerStyle = tooltip.triggerStyle;
        }
        
        var newTriggerElems = _selectorToElems(tooltip, newTargetSelector);
        // if we are actually changing the triggering elements, but are losing
        // our last target elem, default to first one in the list
        if(newTriggerElems.indexOf(tooltip.xtag.lastTargetElem) === -1){
            tooltip.xtag.lastTargetElem = (newTriggerElems.length > 0) ? 
                                           newTriggerElems[0] : null; 
            // reposition tooltip
            _positionTooltip(tooltip, tooltip.xtag.lastTargetElem, 
                             tooltip.orientation);
        }
        
        // remove all active cached listeners
        _destroyListeners(tooltip);
        
        // get new event listeners that we'll need to attach
        var listeners;
        if(newTriggerStyle in PRESET_STYLE_LISTENERFNS){
            var getListenersFn = PRESET_STYLE_LISTENERFNS[newTriggerStyle];
            listeners = getListenersFn(tooltip, newTargetSelector);
        }
        else{
            listeners = mkGenericListeners(tooltip, newTargetSelector, newTriggerStyle);
            OUTER_TRIGGER_MANAGER.registerTooltip(newTriggerStyle, tooltip);
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
                this.xtag._orientation = "auto";
                this.xtag._targetSelector = "_previousSibling";
                this.xtag._triggerStyle = "hover";
                // remember who the last element that triggered the tip was
                // (ie: who we should be pointing to if suddenly told to show
                //  outside of a trigger style)
                var triggeringElems = _selectorToElems(
                                         this, this.xtag._targetSelector
                                      );
                this.xtag.lastTargetElem = (triggeringElems.length > 0) ? 
                                            triggeringElems[0] : null; 
                
                // remember what event listeners are still active
                this.xtag.cachedListeners = [];
            },
            inserted: function(){
                _updateTriggerListeners(this, this.xtag._targetSelector, 
                                        this.xtag._triggerStyle);
            },
            removed: function(){
                _destroyListeners(this);
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
                    return this.xtag._orientation;
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
                        this.removeAttribute("auto-orientation");
                    }
                    else{
                        // when auto placing, we will determine arrow direction
                        // when shown
                        arrow.removeAttribute("arrow-direction");
                    }
                    
                    this.xtag._orientation = newOrientation;
                    
                    this.refreshPosition();
                }
            },
            
            // selects the style of tooltip trigger to use
            // can choose from presets or set to "none" in order to define
            // custom trigger
            "triggerStyle": {
                attribute: {name: "trigger-style"},
                get: function(){
                    return this.xtag._triggerStyle;
                },
                set: function(newTriggerStyle){
                    _updateTriggerListeners(this, this.targetSelector, 
                                            newTriggerStyle);
                    this.xtag._triggerStyle = newTriggerStyle;
                }
            },
            
            // selector must be in relation to parent node of the tooltip
            // ie: can only select tooltip's siblings or deeper in the DOM tree
            "targetSelector": {
                attribute: {name: "target-selector"},
                get: function(){
                    return this.xtag._targetSelector;
                },
                set: function(newSelector){
                    // filter out selected elements that are 
                    // themselves in the tooltip
                    var newTriggerElems = _selectorToElems(this, newSelector);
                    
                    _updateTriggerListeners(this, newSelector, 
                                            this.triggerStyle);
                    this.xtag._targetSelector = newSelector;
                }
            },
            
            // if set, clicking/triggering events outside of the tooltip or
            // its targeted elements will not dismiss the tooltip
            "ignoreOuterTrigger":{
                attribute: {
                    boolean: true, 
                    name: "ignore-outer-trigger"
                }
            },
            
            // if set, pointer events will not be captured by the tooltip
            "ignoreTooltipPointerEvents":{
                attribute: {
                    boolean: true, 
                    name: "ignore-tooltip-pointer-events"
                }
            },
            
            // the DOM element representing the content of the tooltip
            "contentEl": {
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
            
            // return a list of the preset trigger style names
            "presetTriggerStyles": {
                get: function(){
                    var output = [];
                    for(var presetName in PRESET_STYLE_LISTENERFNS){
                        output.push(presetName);
                    }
                    return output;
                }
            },
            
            // return a list of elements currently selected by the tooltip's
            // selector
            "targetElems":{
                get: function(){
                    return _selectorToElems(this, this.targetSelector);
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