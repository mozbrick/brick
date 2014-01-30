(function() {
    var TIP_ORIENT_ARROW_DIR_MAP = {
        top: "down",
        bottom: "up",
        left: "right",
        right: "left"
    };
    var OUTER_TRIGGER_MANAGER;
    var PRESET_STYLE_LISTENERFNS;
    var PREV_SIB_SELECTOR = "_previousSibling";
    var NEXT_SIB_SELECTOR = "_nextSibling";
    var ARROW_DIR_ATTR = "arrow-direction";
    var AUTO_ORIENT_ATTR = "_auto-orientation";
    function isValidOrientation(orient) {
        return orient in TIP_ORIENT_ARROW_DIR_MAP;
    }
    function getWindowViewport() {
        var docElem = document.documentElement;
        var rect = {
            left: docElem.scrollLeft || document.body.scrollLeft || 0,
            top: docElem.scrollTop || document.body.scrollTop || 0,
            width: docElem.clientWidth,
            height: docElem.clientHeight
        };
        rect.right = rect.left + rect.width;
        rect.bottom = rect.top + rect.height;
        return rect;
    }
    function getRect(el) {
        var rect = el.getBoundingClientRect();
        var viewport = getWindowViewport();
        var docScrollLeft = viewport.left;
        var docScrollTop = viewport.top;
        return {
            left: rect.left + docScrollLeft,
            right: rect.right + docScrollLeft,
            top: rect.top + docScrollTop,
            bottom: rect.bottom + docScrollTop,
            width: rect.width,
            height: rect.height
        };
    }
    function getScale(el, rect) {
        rect = rect !== undefined ? rect : getRect(el);
        return {
            x: el.offsetWidth ? rect.width / el.offsetWidth : 1,
            y: el.offsetHeight ? rect.height / el.offsetHeight : 1
        };
    }
    function getRectIntersection(rectA, rectB) {
        if (rectA.right < rectB.left || rectB.right < rectA.left || rectA.bottom < rectB.top || rectB.bottom < rectA.top) {
            return null;
        }
        var intersection = {
            left: Math.max(rectA.left, rectB.left),
            top: Math.max(rectA.top, rectB.top),
            right: Math.min(rectA.right, rectB.right),
            bottom: Math.min(rectA.bottom, rectB.bottom)
        };
        intersection.width = intersection.right - intersection.left;
        intersection.height = intersection.bottom - intersection.top;
        if (intersection.width < 0 || intersection.height < 0) {
            return null;
        }
        return intersection;
    }
    function CachedListener(elem, eventType, listenerFn) {
        this.eventType = eventType;
        this.listenerFn = listenerFn;
        this.elem = elem;
        this._attachedFn = null;
    }
    CachedListener.prototype.attachListener = function() {
        if (!this._attachedFn) {
            this._attachedFn = xtag.addEvent(this.elem, this.eventType, this.listenerFn);
        }
    };
    CachedListener.prototype.removeListener = function() {
        if (this._attachedFn) {
            xtag.removeEvent(this.elem, this.eventType, this._attachedFn);
            this._attachedFn = null;
        }
    };
    function OuterTriggerEventStruct(eventType) {
        this._cachedListener = null;
        this._tooltips = [];
        var struct = this;
        var outerTriggerListener = function(e) {
            struct._tooltips.forEach(function(tooltip) {
                if (!tooltip.xtag._skipOuterClick && tooltip.hasAttribute("visible") && !tooltip.ignoreOuterTrigger && !hasParentNode(e.target, tooltip)) {
                    _hideTooltip(tooltip);
                }
                tooltip.xtag._skipOuterClick = false;
            });
        };
        var cachedListener = this._cachedListener = new CachedListener(document, eventType, outerTriggerListener);
        cachedListener.attachListener();
    }
    OuterTriggerEventStruct.prototype.destroy = function() {
        this._cachedListener.removeListener();
        this._cachedListener = null;
        this._tooltips = null;
    };
    OuterTriggerEventStruct.prototype.containsTooltip = function(tooltip) {
        return this._tooltips.indexOf(tooltip) !== -1;
    };
    OuterTriggerEventStruct.prototype.addTooltip = function(tooltip) {
        if (!this.containsTooltip(tooltip)) {
            this._tooltips.push(tooltip);
        }
    };
    OuterTriggerEventStruct.prototype.removeTooltip = function(tooltip) {
        if (this.containsTooltip(tooltip)) {
            this._tooltips.splice(this._tooltips.indexOf(tooltip), 1);
        }
    };
    Object.defineProperties(OuterTriggerEventStruct.prototype, {
        numTooltips: {
            get: function() {
                return this._tooltips.length;
            }
        }
    });
    function OuterTriggerManager() {
        this.eventStructDict = {};
    }
    OuterTriggerManager.prototype.registerTooltip = function(eventType, tooltip) {
        if (eventType in this.eventStructDict) {
            var eventStruct = this.eventStructDict[eventType];
            if (!eventStruct.containsTooltip(tooltip)) {
                eventStruct.addTooltip(tooltip);
            }
        } else {
            this.eventStructDict[eventType] = new OuterTriggerEventStruct(eventType);
            this.eventStructDict[eventType].addTooltip(tooltip);
        }
    };
    OuterTriggerManager.prototype.unregisterTooltip = function(eventType, tooltip) {
        if (eventType in this.eventStructDict && this.eventStructDict[eventType].containsTooltip(tooltip)) {
            var eventStruct = this.eventStructDict[eventType];
            eventStruct.removeTooltip(tooltip);
            if (eventStruct.numTooltips === 0) {
                eventStruct.destroy();
                delete this.eventStructDict[eventType];
            }
        }
    };
    OUTER_TRIGGER_MANAGER = new OuterTriggerManager();
    function _mkPrevSiblingTargetListener(tooltip, eventName, callback) {
        var filteredCallback = function(e) {
            if (callback && hasParentNode(e.target, tooltip.previousElementSibling)) {
                callback.call(tooltip.previousElementSibling, e);
            }
        };
        return new CachedListener(document.documentElement, eventName, filteredCallback);
    }
    function _mkNextSiblingTargetListener(tooltip, eventName, callback) {
        var eventDelegateStr = eventName + ":delegate(x-tooltip+*)";
        var filteredCallback = function(e) {
            if (callback && this === tooltip.nextElementSibling) {
                callback.call(this, e);
            }
        };
        return new CachedListener(document.documentElement, eventDelegateStr, filteredCallback);
    }
    function _getTargetDelegatedListener(tooltip, targetSelector, eventName, targetCallback) {
        if (targetSelector === PREV_SIB_SELECTOR) {
            return _mkPrevSiblingTargetListener(tooltip, eventName, targetCallback);
        } else if (targetSelector === NEXT_SIB_SELECTOR) {
            return _mkNextSiblingTargetListener(tooltip, eventName, targetCallback);
        } else {
            var delegateEventStr = eventName + ":delegate(" + targetSelector + ")";
            return new CachedListener(document.documentElement, delegateEventStr, function(e) {
                var delegatedElem = this;
                if (!hasParentNode(delegatedElem, tooltip)) {
                    targetCallback.call(delegatedElem, e);
                }
            });
        }
    }
    PRESET_STYLE_LISTENERFNS = {
        custom: function() {
            return [];
        },
        hover: function(tooltip, targetSelector) {
            var createdListeners = [];
            var hoverOutTimer = null;
            var hideDelay = 200;
            var cancelTimerFn = function() {
                if (hoverOutTimer) {
                    window.clearTimeout(hoverOutTimer);
                }
                hoverOutTimer = null;
            };
            var showTipTargetFn = mkIgnoreSubchildrenFn(function(e) {
                cancelTimerFn();
                var delegatedElem = this;
                var fromElem = e.relatedTarget || e.toElement;
                if (!hasParentNode(fromElem, tooltip)) {
                    _showTooltip(tooltip, delegatedElem);
                }
            });
            var hideTipTargetFn = mkIgnoreSubchildrenFn(function(e) {
                cancelTimerFn();
                var toElem = e.relatedTarget || e.toElement;
                if (!hasParentNode(toElem, tooltip)) {
                    hoverOutTimer = window.setTimeout(function() {
                        if (tooltip.triggerStyle === "hover") {
                            _hideTooltip(tooltip);
                        }
                    }, hideDelay);
                }
            });
            var targetEnterListener = _getTargetDelegatedListener(tooltip, targetSelector, "enter", showTipTargetFn);
            var targetExitListener = _getTargetDelegatedListener(tooltip, targetSelector, "leave", hideTipTargetFn);
            createdListeners.push(targetEnterListener);
            createdListeners.push(targetExitListener);
            var showTipTooltipFn = mkIgnoreSubchildrenFn(function(e) {
                cancelTimerFn();
                var fromElem = e.relatedTarget || e.toElement;
                var lastTarget = tooltip.xtag.lastTargetElem;
                if (!tooltip.hasAttribute("visible") && lastTarget && !hasParentNode(fromElem, lastTarget)) {
                    _showTooltip(tooltip, lastTarget);
                }
            });
            var hideTipTooltipFn = mkIgnoreSubchildrenFn(function(e) {
                cancelTimerFn();
                var toElem = e.relatedTarget || e.toElement;
                var lastTarget = tooltip.xtag.lastTargetElem;
                if (lastTarget && !hasParentNode(toElem, lastTarget)) {
                    hoverOutTimer = window.setTimeout(function() {
                        if (tooltip.triggerStyle === "hover") {
                            _hideTooltip(tooltip);
                        }
                    }, hideDelay);
                }
            });
            createdListeners.push(new CachedListener(tooltip, "enter", showTipTooltipFn));
            createdListeners.push(new CachedListener(tooltip, "leave", hideTipTooltipFn));
            return createdListeners;
        }
    };
    function mkGenericListeners(tooltip, targetSelector, eventName) {
        var createdListeners = [];
        var targetTriggerFn = function() {
            var delegatedElem = this;
            tooltip.xtag._skipOuterClick = true;
            if (tooltip.hasAttribute("visible")) {
                if (delegatedElem === tooltip.xtag.lastTargetElem) {
                    _hideTooltip(tooltip);
                } else {
                    _showTooltip(tooltip, delegatedElem);
                }
            } else {
                _showTooltip(tooltip, delegatedElem);
            }
        };
        var delegatedTargetListener = _getTargetDelegatedListener(tooltip, targetSelector, eventName, targetTriggerFn);
        createdListeners.push(delegatedTargetListener);
        return createdListeners;
    }
    function searchAncestors(elem, conditionFn) {
        while (elem) {
            if (conditionFn(elem)) {
                return elem;
            }
            elem = elem.parentNode;
        }
        return null;
    }
    function hasParentNode(elem, parent) {
        if (parent.contains) {
            return parent.contains(elem);
        } else {
            var condition = function(el) {
                return el === parent;
            };
            return !!searchAncestors(elem, condition);
        }
    }
    function mkIgnoreSubchildrenFn(callback) {
        return function(e) {
            var containerElem = this;
            var relElem = e.relatedTarget || e.toElement;
            if (relElem) {
                if (!hasParentNode(relElem, containerElem)) {
                    callback.call(this, e);
                }
            } else {
                callback.call(this, e);
            }
        };
    }
    function _selectorToElems(tooltip, selector) {
        var elems = [];
        if (selector === PREV_SIB_SELECTOR) {
            elems = tooltip.previousElementSibling ? [ tooltip.previousElementSibling ] : [];
        } else if (selector === NEXT_SIB_SELECTOR) {
            elems = tooltip.nextElementSibling ? [ tooltip.nextElementSibling ] : [];
        } else {
            elems = xtag.query(document, selector);
        }
        var i = 0;
        while (i < elems.length) {
            var elem = elems[i];
            if (hasParentNode(elem, tooltip)) {
                elems.splice(i, 1);
            } else {
                i++;
            }
        }
        return elems;
    }
    function overlaps(elemA, elemB) {
        var _pointIsInRect = function(x, y, rect) {
            return rect.left <= x && x <= rect.right && rect.top <= y && y <= rect.bottom;
        };
        var rectA = getRect(elemA);
        var rectB = getRect(elemB);
        var _cornersOverlapBox = function(rectA, rectB) {
            return _pointIsInRect(rectA.left, rectA.top, rectB) || _pointIsInRect(rectA.right, rectA.top, rectB) || _pointIsInRect(rectA.right, rectA.bottom, rectB) || _pointIsInRect(rectA.left, rectA.bottom, rectB);
        };
        var _isCrossIntersect = function(rectA, rectB) {
            return rectA.top <= rectB.top && rectB.bottom <= rectA.bottom && rectB.left <= rectA.left && rectA.right <= rectB.right;
        };
        return _cornersOverlapBox(rectA, rectB) || _cornersOverlapBox(rectB, rectA) || _isCrossIntersect(rectA, rectB) || _isCrossIntersect(rectB, rectA);
    }
    function getRotationDims(width, height, degrees) {
        var radians = degrees * (Math.PI / 180);
        var rotatedHeight = width * Math.sin(radians) + height * Math.cos(radians);
        var rotatedWidth = width * Math.cos(radians) + height * Math.sin(radians);
        return {
            height: rotatedHeight,
            width: rotatedWidth
        };
    }
    function constrainNum(num, min, max) {
        var output = num;
        output = min !== undefined && min !== null ? Math.max(min, output) : output;
        output = max !== undefined && max !== null ? Math.min(max, output) : output;
        return output;
    }
    function _coordsRelToNewContext(x, y, oldContext, newContext, contextScale) {
        var viewportX, viewportY;
        if (oldContext === window) {
            viewportX = x;
            viewportY = y;
        } else {
            var oldContextRect = getRect(oldContext);
            viewportX = x - oldContextRect.left;
            viewportY = y - oldContextRect.top;
        }
        var newContextRect = getRect(newContext);
        contextScale = contextScale ? contextScale : getScale(newContext, newContextRect);
        var borderTop = newContext.clientTop * contextScale.y;
        var borderLeft = newContext.clientLeft * contextScale.x;
        var scrollTop = newContext.scrollTop * contextScale.y;
        var scrollLeft = newContext.scrollLeft * contextScale.x;
        var translatedCoords = {
            left: viewportX - newContextRect.left - borderLeft,
            top: viewportY - newContextRect.top - borderTop
        };
        if (!hasParentNode(document.body, newContext) && hasParentNode(newContext, document.body)) {
            translatedCoords.top += scrollTop;
            translatedCoords.left += scrollLeft;
        }
        return translatedCoords;
    }
    function _getTooltipConstraints(tooltip, contextRect) {
        if (!contextRect) {
            contextRect = getRect(tooltip.offsetParent || tooltip.parentNode);
        }
        var viewport = getWindowViewport();
        var bounds = viewport;
        if (!tooltip.allowOverflow) {
            bounds = getRectIntersection(viewport, contextRect);
            if (!bounds) {
                bounds = contextRect;
            }
        }
        return bounds;
    }
    function _pickBestTooltipOrient(tooltip, validPositionDataList) {
        if (validPositionDataList.length === 0) {
            return null;
        }
        var bounds = _getTooltipConstraints(tooltip);
        var minX = bounds.left;
        var minY = bounds.top;
        var maxX = bounds.right;
        var maxY = bounds.bottom;
        var inContextData = [];
        var notInContextData = [];
        for (var i = 0; i < validPositionDataList.length; i++) {
            var data = validPositionDataList[i];
            var rect = data.rect;
            if (rect.left < minX || rect.top < minY || rect.right > maxX || rect.bottom > maxY) {
                notInContextData.push(data);
            } else {
                inContextData.push(data);
            }
        }
        var filterDataList = inContextData.length > 0 ? inContextData : notInContextData;
        return filterDataList[0].orient;
    }
    function _forceDisplay(elem) {
        elem.setAttribute("_force-display", true);
    }
    function _unforceDisplay(elem) {
        elem.removeAttribute("_force-display");
    }
    function _autoPositionTooltip(tooltip, targetElem) {
        tooltip.removeAttribute(AUTO_ORIENT_ATTR);
        var arrow = tooltip.xtag.arrowEl, positionRect = null;
        var validOrientDataList = [];
        for (var tmpOrient in TIP_ORIENT_ARROW_DIR_MAP) {
            arrow.setAttribute(ARROW_DIR_ATTR, TIP_ORIENT_ARROW_DIR_MAP[tmpOrient]);
            positionRect = _positionTooltip(tooltip, targetElem, tmpOrient);
            if (!positionRect) {
                continue;
            }
            _forceDisplay(tooltip);
            if (!overlaps(tooltip, targetElem)) {
                validOrientDataList.push({
                    orient: tmpOrient,
                    rect: positionRect
                });
            }
            _unforceDisplay(tooltip);
        }
        var bestOrient = _pickBestTooltipOrient(tooltip, validOrientDataList);
        if (!bestOrient) {
            bestOrient = "top";
        }
        tooltip.setAttribute(AUTO_ORIENT_ATTR, bestOrient);
        arrow.setAttribute(ARROW_DIR_ATTR, TIP_ORIENT_ARROW_DIR_MAP[bestOrient]);
        if (isValidOrientation(bestOrient) && bestOrient !== tmpOrient) {
            return _positionTooltip(tooltip, targetElem, bestOrient);
        } else {
            return positionRect;
        }
    }
    function _positionTooltip(tooltip, targetElem, orientation, reattemptDepth) {
        if (!tooltip.parentNode) {
            tooltip.left = "";
            tooltip.top = "";
            return null;
        }
        reattemptDepth = reattemptDepth === undefined ? 0 : reattemptDepth;
        var arrow = tooltip.xtag.arrowEl;
        if (!isValidOrientation(orientation)) {
            return _autoPositionTooltip(tooltip, targetElem);
        }
        var tipContext = tooltip.offsetParent ? tooltip.offsetParent : tooltip.parentNode;
        if (!reattemptDepth) {
            tooltip.style.top = "";
            tooltip.style.left = "";
            arrow.style.top = "";
            arrow.style.left = "";
        }
        _forceDisplay(tooltip);
        var viewport = getWindowViewport();
        var contextRect = getRect(tipContext);
        var contextScale = getScale(tipContext, contextRect);
        var contextViewWidth = tipContext.clientWidth * contextScale.x;
        var contextViewHeight = tipContext.clientHeight * contextScale.y;
        var targetRect = getRect(targetElem);
        var targetWidth = targetRect.width;
        var targetHeight = targetRect.height;
        var tooltipRect = getRect(tooltip);
        var tooltipScale = getScale(tooltip, tooltipRect);
        var origTooltipWidth = tooltipRect.width;
        var origTooltipHeight = tooltipRect.height;
        var renderedTooltipWidth = tooltipRect.width;
        var renderedTooltipHeight = tooltipRect.height;
        var tipPlacementOffsetX = (renderedTooltipWidth - origTooltipWidth) / 2;
        var tipPlacementOffsetY = (renderedTooltipHeight - origTooltipHeight) / 2;
        var arrowWidth = arrow.offsetWidth * tooltipScale.x;
        var arrowHeight = arrow.offsetHeight * tooltipScale.y;
        var arrowRotationDegs = 45;
        var arrowDims = getRotationDims(arrowWidth, arrowHeight, arrowRotationDegs);
        arrowWidth = arrowDims.width;
        arrowHeight = arrowDims.height;
        if (orientation === "top" || orientation === "bottom") {
            arrowHeight /= 2;
        } else {
            arrowWidth /= 2;
        }
        var bounds = _getTooltipConstraints(tooltip, contextRect);
        var minRawLeft = bounds.left;
        var minRawTop = bounds.top;
        var maxRawLeft = bounds.right - origTooltipWidth;
        var maxRawTop = bounds.bottom - origTooltipHeight;
        var idealTipCenterAlignCoords = {
            left: targetRect.left + (targetWidth - origTooltipWidth) / 2,
            top: targetRect.top + (targetHeight - origTooltipHeight) / 2
        };
        var idealRawLeft = idealTipCenterAlignCoords.left;
        var idealRawTop = idealTipCenterAlignCoords.top;
        if (orientation === "top") {
            idealRawTop = targetRect.top - renderedTooltipHeight - arrowHeight;
            maxRawTop -= arrowHeight;
        } else if (orientation === "bottom") {
            idealRawTop = targetRect.top + targetHeight + arrowHeight;
            maxRawTop -= arrowHeight;
        } else if (orientation === "left") {
            idealRawLeft = targetRect.left - renderedTooltipWidth - arrowWidth;
            maxRawLeft -= arrowWidth;
        } else if (orientation === "right") {
            idealRawLeft = targetRect.left + targetWidth + arrowWidth;
            maxRawLeft -= arrowWidth;
        } else {
            throw "invalid orientation " + orientation;
        }
        var rawLeft = constrainNum(idealRawLeft, minRawLeft, maxRawLeft);
        var rawTop = constrainNum(idealRawTop, minRawTop, maxRawTop);
        rawLeft += tipPlacementOffsetX;
        rawTop += tipPlacementOffsetY;
        var _isFixed = function(el) {
            if (!window.getComputedStyle || el === document || el === document.documentElement) {
                return false;
            }
            var styles;
            try {
                styles = window.getComputedStyle(el);
            } catch (e) {
                return false;
            }
            return styles && styles.position === "fixed";
        };
        var newLeft;
        var newTop;
        var fixedAncestor = searchAncestors(targetElem, _isFixed);
        if (fixedAncestor && !hasParentNode(tooltip, fixedAncestor)) {
            newLeft = rawLeft - viewport.left;
            newTop = rawTop - viewport.top;
            tooltip.setAttribute("_target-fixed", true);
        } else {
            var relativeCoords = _coordsRelToNewContext(rawLeft, rawTop, window, tipContext, contextScale);
            newLeft = relativeCoords.left;
            newTop = relativeCoords.top;
            tooltip.removeAttribute("_target-fixed");
        }
        tooltip.style.top = newTop + "px";
        tooltip.style.left = newLeft + "px";
        var maxVal;
        var arrowParentSize;
        var arrowStyleProp;
        var rawArrowCenter;
        var tipTargetDiff;
        if (orientation === "top" || orientation === "bottom") {
            rawArrowCenter = (targetWidth - arrowWidth) / 2;
            tipTargetDiff = targetRect.left - rawLeft;
            maxVal = origTooltipWidth - arrowWidth;
            arrowParentSize = origTooltipWidth;
            arrowStyleProp = "left";
        } else {
            rawArrowCenter = (targetHeight - arrowHeight) / 2;
            tipTargetDiff = targetRect.top - rawTop;
            maxVal = origTooltipHeight - arrowHeight;
            arrowParentSize = origTooltipHeight;
            arrowStyleProp = "top";
        }
        var arrowVal = constrainNum(rawArrowCenter + tipTargetDiff, 0, maxVal);
        var arrowFrac = arrowParentSize ? arrowVal / arrowParentSize : 0;
        arrow.style[arrowStyleProp] = arrowFrac * 100 + "%";
        var newTooltipWidth = tooltip.offsetWidth * tooltipScale.x;
        var newTooltipHeight = tooltip.offsetHeight * tooltipScale.y;
        var newContextViewWidth = tipContext.clientWidth * contextScale.x;
        var newContextViewHeight = tipContext.clientHeight * contextScale.y;
        _unforceDisplay(tooltip);
        var recursionLimit = 2;
        if (reattemptDepth < recursionLimit && (origTooltipWidth !== newTooltipWidth || origTooltipHeight !== newTooltipHeight || contextViewWidth !== newContextViewWidth || contextViewHeight !== newContextViewHeight)) {
            return _positionTooltip(tooltip, targetElem, orientation, reattemptDepth + 1);
        } else {
            return {
                left: rawLeft,
                top: rawTop,
                width: newTooltipWidth,
                height: newTooltipHeight,
                right: rawLeft + newTooltipWidth,
                bottom: rawTop + newTooltipHeight
            };
        }
    }
    function _showTooltip(tooltip, triggerElem) {
        if (triggerElem === tooltip) {
            console.warn("The tooltip's target element is the tooltip itself!" + " Is this intentional?");
        }
        var arrow = tooltip.xtag.arrowEl;
        if (!arrow.parentNode) {
            console.warn("The inner component DOM of the tooltip " + "appears to be missing. Make sure to edit tooltip" + " contents through the .contentEl property instead of" + "directly on the x-tooltip to avoid " + "clobbering the component's internals.");
        }
        var targetOrient = tooltip.orientation;
        var _readyToShowFn = function() {
            _unforceDisplay(tooltip);
            tooltip.setAttribute("visible", true);
            xtag.fireEvent(tooltip, "tooltipshown", {
                triggerElem: triggerElem
            });
        };
        if (triggerElem) {
            tooltip.xtag.lastTargetElem = triggerElem;
            xtag.skipTransition(tooltip, function() {
                _positionTooltip(tooltip, triggerElem, targetOrient);
                _forceDisplay(tooltip);
                return _readyToShowFn;
            });
        } else {
            tooltip.style.top = "";
            tooltip.style.left = "";
            arrow.style.top = "";
            arrow.style.left = "";
            _readyToShowFn();
        }
    }
    function _hideTooltip(tooltip) {
        if (isValidOrientation(tooltip.orientation)) {
            tooltip.removeAttribute(AUTO_ORIENT_ATTR);
        }
        if (tooltip.hasAttribute("visible")) {
            _forceDisplay(tooltip);
            tooltip.xtag._hideTransitionFlag = true;
            tooltip.removeAttribute("visible");
        }
    }
    function _destroyListeners(tooltip) {
        var cachedListeners = tooltip.xtag.cachedListeners;
        cachedListeners.forEach(function(cachedListener) {
            cachedListener.removeListener();
        });
        tooltip.xtag.cachedListeners = [];
        OUTER_TRIGGER_MANAGER.unregisterTooltip(tooltip.triggerStyle, tooltip);
    }
    function _updateTriggerListeners(tooltip, newTargetSelector, newTriggerStyle) {
        if (!tooltip.parentNode) {
            return;
        }
        if (newTargetSelector === undefined || newTargetSelector === null) {
            newTargetSelector = tooltip.targetSelector;
        }
        if (newTriggerStyle === undefined || newTriggerStyle === null) {
            newTriggerStyle = tooltip.triggerStyle;
        }
        var newTriggerElems = _selectorToElems(tooltip, newTargetSelector);
        if (newTriggerElems.indexOf(tooltip.xtag.lastTargetElem) === -1) {
            tooltip.xtag.lastTargetElem = newTriggerElems.length > 0 ? newTriggerElems[0] : null;
            _positionTooltip(tooltip, tooltip.xtag.lastTargetElem, tooltip.orientation);
        }
        _destroyListeners(tooltip);
        var listeners;
        if (newTriggerStyle in PRESET_STYLE_LISTENERFNS) {
            var getListenersFn = PRESET_STYLE_LISTENERFNS[newTriggerStyle];
            listeners = getListenersFn(tooltip, newTargetSelector);
        } else {
            listeners = mkGenericListeners(tooltip, newTargetSelector, newTriggerStyle);
            OUTER_TRIGGER_MANAGER.registerTooltip(newTriggerStyle, tooltip);
        }
        listeners.forEach(function(listener) {
            listener.attachListener();
        });
        tooltip.xtag.cachedListeners = listeners;
        _hideTooltip(tooltip);
    }
    xtag.register("x-tooltip", {
        lifecycle: {
            created: function() {
                var self = this;
                self.xtag.contentEl = document.createElement("div");
                self.xtag.arrowEl = document.createElement("span");
                xtag.addClass(self.xtag.contentEl, "tooltip-content");
                xtag.addClass(self.xtag.arrowEl, "tooltip-arrow");
                self.xtag.contentEl.innerHTML = self.innerHTML;
                self.innerHTML = "";
                self.appendChild(self.xtag.contentEl);
                self.appendChild(self.xtag.arrowEl);
                self.xtag._orientation = "auto";
                self.xtag._targetSelector = PREV_SIB_SELECTOR;
                self.xtag._triggerStyle = "click";
                var triggeringElems = _selectorToElems(self, self.xtag._targetSelector);
                self.xtag.lastTargetElem = triggeringElems.length > 0 ? triggeringElems[0] : null;
                self.xtag.cachedListeners = [];
                self.xtag._hideTransitionFlag = false;
                self.xtag._skipOuterClick = false;
            },
            inserted: function() {
                _updateTriggerListeners(this, this.xtag._targetSelector, this.xtag._triggerStyle);
            },
            removed: function() {
                _destroyListeners(this);
            }
        },
        events: {
            transitionend: function(e) {
                var tooltip = e.currentTarget;
                if (tooltip.xtag._hideTransitionFlag && !tooltip.hasAttribute("visible")) {
                    tooltip.xtag._hideTransitionFlag = false;
                    xtag.fireEvent(tooltip, "tooltiphidden");
                }
                _unforceDisplay(tooltip);
            }
        },
        accessors: {
            orientation: {
                attribute: {},
                get: function() {
                    return this.xtag._orientation;
                },
                set: function(newOrientation) {
                    newOrientation = newOrientation.toLowerCase();
                    var arrow = this.querySelector(".tooltip-arrow");
                    var newArrowDir = null;
                    if (isValidOrientation(newOrientation)) {
                        newArrowDir = TIP_ORIENT_ARROW_DIR_MAP[newOrientation];
                        arrow.setAttribute(ARROW_DIR_ATTR, newArrowDir);
                        this.removeAttribute(AUTO_ORIENT_ATTR);
                    } else {
                        arrow.removeAttribute(ARROW_DIR_ATTR);
                    }
                    this.xtag._orientation = newOrientation;
                    this.refreshPosition();
                }
            },
            triggerStyle: {
                attribute: {
                    name: "trigger-style"
                },
                get: function() {
                    return this.xtag._triggerStyle;
                },
                set: function(newTriggerStyle) {
                    _updateTriggerListeners(this, this.targetSelector, newTriggerStyle);
                    this.xtag._triggerStyle = newTriggerStyle;
                }
            },
            targetSelector: {
                attribute: {
                    name: "target-selector"
                },
                get: function() {
                    return this.xtag._targetSelector;
                },
                set: function(newSelector) {
                    _updateTriggerListeners(this, newSelector, this.triggerStyle);
                    this.xtag._targetSelector = newSelector;
                }
            },
            ignoreOuterTrigger: {
                attribute: {
                    "boolean": true,
                    name: "ignore-outer-trigger"
                }
            },
            ignoreTooltipPointerEvents: {
                attribute: {
                    "boolean": true,
                    name: "ignore-tooltip-pointer-events"
                }
            },
            allowOverflow: {
                attribute: {
                    "boolean": true,
                    name: "allow-overflow"
                },
                set: function() {
                    this.refreshPosition();
                }
            },
            contentEl: {
                get: function() {
                    return this.xtag.contentEl;
                },
                set: function(newContentElem) {
                    var oldContent = this.xtag.contentEl;
                    xtag.addClass(newContentElem, "tooltip-content");
                    this.replaceChild(newContentElem, oldContent);
                    this.xtag.contentEl = newContentElem;
                    this.refreshPosition();
                }
            },
            presetTriggerStyles: {
                get: function() {
                    var output = [];
                    for (var presetName in PRESET_STYLE_LISTENERFNS) {
                        output.push(presetName);
                    }
                    return output;
                }
            },
            targetElems: {
                get: function() {
                    return _selectorToElems(this, this.targetSelector);
                }
            }
        },
        methods: {
            refreshPosition: function() {
                if (this.xtag.lastTargetElem) {
                    _positionTooltip(this, this.xtag.lastTargetElem, this.orientation);
                }
            },
            show: function() {
                _showTooltip(this, this.xtag.lastTargetElem);
            },
            hide: function() {
                _hideTooltip(this);
            },
            toggle: function() {
                if (this.hasAttribute("visible")) {
                    this.hide();
                } else {
                    this.show();
                }
            }
        }
    });
})();