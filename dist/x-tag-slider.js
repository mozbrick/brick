(function() {
    var KEYCODES = {
        33: "PAGE_UP",
        34: "PAGE_DOWN",
        35: "END",
        36: "HOME",
        37: "LEFT_ARROW",
        38: "UP_ARROW",
        39: "RIGHT_ARROW",
        40: "DOWN_ARROW"
    };
    var LEFT_MOUSE_BTN = 0;
    function isNum(num) {
        return !isNaN(parseFloat(num));
    }
    function hasNumAttr(elem, attrName) {
        return elem.hasAttribute(attrName) && isNum(elem.getAttribute(attrName));
    }
    function roundToStep(rawRangeVal, step, rangeMin, roundFn) {
        roundFn = roundFn ? roundFn : Math.round;
        rangeMin = isNum(rangeMin) ? rangeMin : 0;
        if (!isNum(rawRangeVal)) {
            throw "invalid value " + rawRangeVal;
        }
        if (!isNum(step) || +step <= 0) {
            throw "invalid step " + step;
        }
        return roundFn((rawRangeVal - rangeMin) / step) * step + rangeMin;
    }
    function constrainToSteppedRange(value, min, max, step) {
        if (value < min) {
            return min;
        } else if (value > max) {
            return Math.max(min, roundToStep(max, step, min, Math.floor));
        } else {
            return value;
        }
    }
    function getDefaultVal(min, max, step) {
        var roundedVal = roundToStep((max - min) / 2 + min, step, min);
        return constrainToSteppedRange(roundedVal, min, max, step);
    }
    function _rawValToFraction(slider, value) {
        var min = slider.min;
        var max = slider.max;
        return (value - min) / (max - min);
    }
    function _fractionToRawVal(slider, fraction) {
        var min = slider.min;
        var max = slider.max;
        return (max - min) * fraction + min;
    }
    function _fractionToCorrectedVal(slider, sliderFraction) {
        sliderFraction = Math.min(Math.max(0, sliderFraction), 1);
        var rawVal = _fractionToRawVal(slider, sliderFraction);
        var roundedVal = roundToStep(rawVal, slider.step, slider.min);
        return constrainToSteppedRange(roundedVal, slider.min, slider.max, slider.step);
    }
    function _positionThumb(slider, value) {
        var thumb = slider.xtag.sliderThumb;
        if (!thumb) {
            return;
        }
        var sliderRect = slider.getBoundingClientRect();
        var thumbRect = thumb.getBoundingClientRect();
        var fraction = _rawValToFraction(slider, value);
        var vertical = slider.vertical;
        var sliderWidth = sliderRect[vertical ? "height" : "width"];
        var thumbWidth = thumbRect[vertical ? "height" : "width"];
        var availableWidth = Math.max(sliderWidth - thumbWidth, 0);
        var newThumbX = availableWidth * fraction;
        var finalPercentage = newThumbX / sliderWidth;
        thumb.style[vertical ? "left" : "top"] = 0;
        thumb.style[vertical ? "top" : "left"] = finalPercentage * 100 + "%";
        slider.xtag.sliderProgress.style[vertical ? "height" : "width"] = fraction * 100 + "%";
    }
    function _redraw(slider) {
        _positionThumb(slider, slider.value);
    }
    function _onMouseInput(slider, pageX, pageY) {
        var inputEl = slider.xtag.rangeInputEl;
        var inputOffsets = inputEl.getBoundingClientRect();
        var thumbWidth = slider.xtag.sliderThumb.getBoundingClientRect().width;
        var inputClickX = pageX - inputOffsets.left - thumbWidth / 2;
        var divideby = inputOffsets.width - thumbWidth / 2;
        if (slider.vertical) {
            divideby = inputOffsets.height;
            inputClickX = pageY - inputOffsets.top;
        }
        slider.value = _fractionToCorrectedVal(slider, inputClickX / divideby);
        xtag.fireEvent(slider, "input");
        _redraw(slider);
    }
    function _onDragStart(slider, pageX, pageY) {
        slider.xtag.dragInitVal = slider.value;
        _onMouseInput(slider, pageX, pageY);
        var callbacks = slider.xtag.callbackFns;
        var _addBodyListener = function(event, listener) {
            document.body.addEventListener(event, listener);
        };
        _addBodyListener("mousemove", callbacks.onMouseDragMove);
        _addBodyListener("touchmove", callbacks.onTouchDragMove);
        _addBodyListener("mouseup", callbacks.onDragEnd);
        _addBodyListener("touchend", callbacks.onDragEnd);
        var thumb = slider.xtag.sliderThumb;
        if (thumb) {
            thumb.setAttribute("active", true);
        }
    }
    function _onDragMove(slider, pageX, pageY) {
        _onMouseInput(slider, pageX, pageY);
    }
    function _makeCallbackFns(slider) {
        return {
            onMouseDragStart: function(e) {
                if (e.button !== LEFT_MOUSE_BTN) {
                    return;
                }
                _onDragStart(slider, e.pageX, e.pageY);
                e.preventDefault();
            },
            onTouchDragStart: function(e) {
                var touches = e.targetTouches;
                if (touches.length !== 1) {
                    return;
                }
                _onDragStart(slider, touches[0].pageX, touches[0].pageY);
                e.preventDefault();
            },
            onMouseDragMove: function(e) {
                _onDragMove(slider, e.pageX, e.pageY);
                e.preventDefault();
            },
            onTouchDragMove: function(e) {
                var touches = e.targetTouches;
                if (touches.length !== 1) {
                    return;
                }
                _onDragMove(slider, touches[0].pageX, touches[0].pageY);
                e.preventDefault();
            },
            onDragEnd: function(e) {
                var callbacks = slider.xtag.callbackFns;
                var _removeBodyListener = function(event, listener) {
                    document.body.removeEventListener(event, listener);
                };
                _removeBodyListener("mousemove", callbacks.onMouseDragMove);
                _removeBodyListener("touchmove", callbacks.onTouchDragMove);
                _removeBodyListener("mouseup", callbacks.onDragEnd);
                _removeBodyListener("touchend", callbacks.onDragEnd);
                var thumb = slider.xtag.sliderThumb;
                if (thumb) {
                    thumb.removeAttribute("active");
                }
                if (slider.value !== slider.xtag.dragInitVal) {
                    xtag.fireEvent(slider, "change");
                }
                slider.xtag.dragInitVal = null;
                e.preventDefault();
            },
            onKeyDown: function(e) {
                var keyCode = e.keyCode;
                if (keyCode in KEYCODES) {
                    var oldVal = this.value;
                    var min = this.min;
                    var max = this.max;
                    var step = this.step;
                    var rangeSize = Math.max(0, max - min);
                    var largeStep = Math.max(rangeSize / 10, step);
                    switch (KEYCODES[keyCode]) {
                      case "LEFT_ARROW":
                      case "DOWN_ARROW":
                        this.value = Math.max(oldVal - step, min);
                        break;

                      case "RIGHT_ARROW":
                      case "UP_ARROW":
                        this.value = Math.min(oldVal + step, max);
                        break;

                      case "HOME":
                        this.value = min;
                        break;

                      case "END":
                        this.value = max;
                        break;

                      case "PAGE_DOWN":
                        this.value = Math.max(oldVal - largeStep, min);
                        break;

                      case "PAGE_UP":
                        this.value = Math.min(oldVal + largeStep, max);
                        break;

                      default:
                        break;
                    }
                    if (this.value !== oldVal) {
                        xtag.fireEvent(this, "change");
                    }
                    e.preventDefault();
                }
            }
        };
    }
    xtag.register("x-slider", {
        lifecycle: {
            created: function() {
                var self = this;
                self.xtag.callbackFns = _makeCallbackFns(self);
                self.xtag.dragInitVal = null;
                var input = document.createElement("input");
                xtag.addClass(input, "input");
                input.setAttribute("type", "range");
                var initMax = hasNumAttr(self, "max") ? +self.getAttribute("max") : 100;
                var initMin = hasNumAttr(self, "min") ? +self.getAttribute("min") : 0;
                var initStep = hasNumAttr(self, "step") ? +self.getAttribute("step") : 1;
                initStep = initStep > 0 ? initStep : 1;
                var initVal = hasNumAttr(self, "value") ? +self.getAttribute("value") : getDefaultVal(initMin, initMax, initStep);
                input.setAttribute("max", initMax);
                input.setAttribute("min", initMin);
                input.setAttribute("step", initStep);
                input.setAttribute("value", initVal);
                self.xtag.rangeInputEl = input;
                self.appendChild(self.xtag.rangeInputEl);
                var sliderTrack = document.createElement("div");
                xtag.addClass(sliderTrack, "slider-track");
                this.xtag.sliderTrack = sliderTrack;
                this.appendChild(sliderTrack);
                var sliderProgress = document.createElement("div");
                xtag.addClass(sliderProgress, "slider-progress");
                this.xtag.sliderProgress = sliderProgress;
                sliderTrack.appendChild(sliderProgress);
                var sliderThumb = document.createElement("span");
                xtag.addClass(sliderThumb, "slider-thumb");
                this.xtag.sliderThumb = sliderThumb;
                this.appendChild(sliderThumb);
                if (input.type !== "range" || self.hasAttribute("polyfill")) {
                    self.setAttribute("polyfill", true);
                } else {
                    self.removeAttribute("polyfill");
                }
                this.addEventListener("mousedown", self.xtag.callbackFns.onMouseDragStart);
                this.addEventListener("touchstart", self.xtag.callbackFns.onTouchDragStart);
                this.addEventListener("keydown", self.xtag.callbackFns.onKeyDown);
                self.setAttribute("value", initVal);
            },
            inserted: function() {
                var self = this;
                xtag.requestFrame(function() {
                    xtag.requestFrame(function() {
                        _redraw(self);
                    });
                });
            },
            attributeChanged: function(property) {
                if (property == "min" || property == "max" || property == "step") {
                    _redraw(this);
                }
            }
        },
        events: {
            "change:delegate(input[type=range])": function(e) {
                e.stopPropagation();
                xtag.fireEvent(e.currentTarget, "change");
            },
            "input:delegate(input[type=range])": function(e) {
                e.stopPropagation();
                xtag.fireEvent(e.currentTarget, "input");
            },
            "focus:delegate(input[type=range])": function(e) {
                var slider = e.currentTarget;
                xtag.fireEvent(slider, "focus", {}, {
                    bubbles: false
                });
            },
            "blur:delegate(input[type=range])": function(e) {
                var slider = e.currentTarget;
                xtag.fireEvent(slider, "blur", {}, {
                    bubbles: false
                });
            }
        },
        accessors: {
            polyfill: {
                attribute: {
                    "boolean": true
                },
                set: function(isPolyfill) {
                    var callbackFns = this.xtag.callbackFns;
                    if (isPolyfill) {
                        this.setAttribute("tabindex", 0);
                        this.xtag.rangeInputEl.setAttribute("tabindex", -1);
                        this.xtag.rangeInputEl.setAttribute("readonly", true);
                        _redraw(this);
                    } else {
                        this.removeAttribute("tabindex");
                        this.xtag.rangeInputEl.removeAttribute("tabindex");
                        this.xtag.rangeInputEl.removeAttribute("readonly");
                    }
                }
            },
            vertical: {
                attribute: {
                    "boolean": true
                },
                set: function() {
                    _redraw(this);
                }
            },
            max: {
                attribute: {
                    selector: "input[type=range]"
                },
                get: function() {
                    return +this.xtag.rangeInputEl.getAttribute("max");
                }
            },
            min: {
                attribute: {
                    selector: "input[type=range]"
                },
                get: function() {
                    return +this.xtag.rangeInputEl.getAttribute("min");
                }
            },
            step: {
                attribute: {
                    selector: "input[type=range]"
                },
                get: function() {
                    return +this.xtag.rangeInputEl.getAttribute("step");
                }
            },
            name: {
                attribute: {
                    selector: "input[type=range]"
                },
                set: function(newName) {
                    var input = this.xtag.rangeInputEl;
                    if (newName === null || newName === undefined) {
                        input.removeAttribute("name");
                    } else {
                        input.setAttribute("name", newName);
                    }
                }
            },
            value: {
                attribute: {
                    selector: "input[type=range]"
                },
                get: function() {
                    return +this.xtag.rangeInputEl.value;
                },
                set: function(rawVal) {
                    if (!isNum(rawVal)) {
                        rawVal = getDefaultVal(this.min, this.max, this.step);
                    }
                    rawVal = +rawVal;
                    var min = this.min;
                    var max = this.max;
                    var step = this.step;
                    var roundedVal = roundToStep(rawVal, step, min);
                    var finalVal = constrainToSteppedRange(roundedVal, min, max, step);
                    this.xtag.rangeInputEl.value = finalVal;
                    _redraw(this);
                }
            },
            inputElem: {
                get: function() {
                    return this.xtag.rangeInputEl;
                }
            }
        },
        methods: {}
    });
})();