(function(){
    var ENTER_KEYCODE = 13;

    // Date utils

    // is valid date object?
    function isValidDateObj(d) {
        return (d instanceof Date) && !!(d.getTime) && !isNaN(d.getTime());
    }

    function getYear(d) {
        return d.getUTCFullYear();
    }
    function getMonth(d) {
        return d.getUTCMonth();
    }
    function getDate(d) {
        return d.getUTCDate();
    }

    /** pad: (Number, Number) => String
    
    Pads a number with preceding zeros to be padSize digits long

    If given a number with more than padSize digits, truncates the leftmost
    digits to get to a padSize length
    **/
    function pad(n, padSize) {
        var str = n.toString();
        var padZeros = (new Array(padSize)).join('0');
        return (padZeros + str).substr(-padSize);
    }

    /** iso: Date => String 

    returns the ISO format representation of a date ("YYYY-MM-DD")
    **/
    function iso(d) {
        return [pad(getYear(d), 4),
                pad(getMonth(d)+1, 2),
                pad(getDate(d), 2)].join('-');
    }

    /** fromIso: String => Date/null

    Given a string, attempts to parse out a date in YYYY-MM-DD format

    If successful, returns the corresponding Date object, otherwise return null
    **/
    var ISO_DATE_REGEX = /(\d{4})[^\d]?(\d{2})[^\d]?(\d{2})/;
    function fromIso(s){
        if (isValidDateObj(s)) return s;
        var d = ISO_DATE_REGEX.exec(s);
        if (d) {
          return new Date(d[1],d[2]-1,d[3]);
        }
        else{
            return null;
        }
    }

    /** parseSingleDate: String => Date/null

    attempts to parse out the given string as a Date

    If successful, returns the corresponding Date object, otherwise return null

    Valid input formats include any format with a YYYY-MM-DD format or 
    is parseable by Date.parse
    **/
    function parseSingleDate(dateStr){
        if(isValidDateObj(dateStr)) return dateStr;

        // cross-browser check for ISO format that is not 
        // supported by Date.parse without implicit time zone
        var isoParsed = fromIso(dateStr);
        if(isoParsed){
            return isoParsed;
        }
        else{
            var parsedMs = Date.parse(dateStr);
            if(!isNaN(parsedMs)){
                return new Date(parsedMs);
            }
            return null;
        }
    }

    function _validateDatepicker(datepicker){
        var input = (datepicker.polyfill) ? 
                      datepicker.xtag.polyfillInput : datepicker.xtag.dateInput;
        var inputDate = parseSingleDate(input.value);
        if(inputDate)
        {
            datepicker.removeAttribute("invalid");
        }
        else{
            datepicker.setAttribute("invalid", true);
        }
        return !!inputDate;
    }

    // if sendParsed is true, we send the preparsed version, otherwise,
    // send the original value
    function _updateDatepicker(datepicker, sendParsed){
        var origVal = (datepicker.polyfill) ? 
                            datepicker.xtag.polyfillInput.value : 
                            datepicker.xtag.dateInput.value;
        var parsedDate = parseSingleDate(origVal);

        datepicker.value = (sendParsed && parsedDate) ? parsedDate : origVal;
    }


    xtag.register("x-datepicker", {
        lifecycle: {
            created: function(){
                this.innerHTML = "";
                this.xtag.dateInput = document.createElement("input");
                this.xtag.dateInput.setAttribute("type", "date");
                xtag.addClass(this.xtag.dateInput, "x-datepicker-input");
                this.appendChild(this.xtag.dateInput);

                this.xtag.polyfillInput = null;
                this.xtag.polyfillUI = null;

                this.polyfill = (this.hasAttribute("polyfill") || 
                                 this.xtag.dateInput.type.toLowerCase() !== "date");
            },
            inserted: function(){
            }
        },
        events: {
            "datetoggleon:delegate(x-calendar)": function(e){
                var xCal = this;
                var datepicker = e.currentTarget;
                if((!e.detail) || (!e.detail.date)){
                    return;
                }

                var selectedDate = parseSingleDate(e.detail.date);

                datepicker.value = (selectedDate) ? iso(selectedDate) : "";

                xtag.fireEvent(datepicker.xtag.polyfillInput, "input");
            },

            "datetoggleoff:delegate(x-calendar)": function(e){
                var datepicker = e.currentTarget;
                datepicker.value = null;
            },

            "focus": function(e){
                var datepicker = e.currentTarget;
                datepicker.setAttribute("focused", true);
            },

            "blur:delegate(.x-datepicker-input)": function(e){
                e.currentTarget.removeAttribute("focused");
            },

            "blur:delegate(.x-datepicker-polyfill-input)": function(e){
                var datepicker = e.currentTarget;

                _updateDatepicker(datepicker, true);
                datepicker.removeAttribute("focused");
            },

            "tapstart:delegate(x-calendar)": function(e){
                e.preventDefault(); // prevent blurring of polyfill input
            },

            "keypress:delegate(.x-datepicker-polyfill-input)": function(e){
                var keyCode = e.key || e.keyCode;
                if(keyCode === ENTER_KEYCODE){
                    _updateDatepicker(e.currentTarget, true);
                }
            },

            "input:delegate(.x-datepicker-input)": function(e){
                _updateDatepicker(e.currentTarget, true);
            },

            "input:delegate(.x-datepicker-polyfill-input)": function(e){
                _updateDatepicker(e.currentTarget, false);
            }
        },
        accessors: {
            "name": {
                attribute: {selector: ".x-datepicker-input"}
            },
            "submitValue":{
                get: function(){
                    return this.xtag.dateInput.value;
                }
            },

            "value": {
                attribute: {
                    skip: true
                },
                get: function(){
                    return (this.polyfill) ? this.xtag.polyfillInput.value :
                                             this.xtag.dateInput.value;
                },
                set: function(rawDateVal){
                    var parsedDate = parseSingleDate(rawDateVal);
                    var isoStr = (parsedDate) ? iso(parsedDate) : null;
                    var dateInput = this.xtag.dateInput;
                    var polyfillInput = this.xtag.polyfillInput;
                    var polyfillUI = this.xtag.polyfillUI;

                    // if prompted to remove value
                    if(rawDateVal === null || rawDateVal === undefined){
                        this.removeAttribute("value");
                        dateInput.value = "";
                        if(polyfillInput){
                            polyfillInput.value = "";
                        }

                        if(polyfillUI){
                            polyfillUI.chosen = null;
                            // note that we don't reset calendar's view, 
                            // we may want to choose where we left off
                        }
                    }
                    else{
                        var finalVal = (isoStr) ? isoStr : rawDateVal;
                        
                        this.setAttribute("value", finalVal);
                        // only override text value if given something 
                        // different, in order to prevent having us override
                        // text as the user types
                        if(polyfillInput && rawDateVal !== polyfillInput.value){
                            polyfillInput.value = finalVal;
                        }

                        // make sure the date input (ie: what actually 
                        //  submits in a form) either contains a valid date
                        // or is blanked; also make sure calendar displays
                        // a valid date
                        if(isoStr){
                            dateInput.value = isoStr;
                            if(polyfillUI){
                                polyfillUI.chosen = parsedDate;
                                polyfillUI.view = parsedDate;
                            }
                        }
                        else{
                            dateInput.value = "";
                            if(polyfillUI){
                                polyfillUI.chosen = null;
                            }
                            // don't reset calendar view, we may want to choose
                            // from where we left off
                        }
                    }

                    _validateDatepicker(this);
                }
            },

            "polyfill": {
                attribute: {boolean: true},
                set: function(isPolyfill){
                    var dateInput = this.xtag.dateInput;
                    if(isPolyfill){
                        dateInput.setAttribute("type", "hidden");
                        dateInput.setAttribute("readonly", true);

                        if(!this.xtag.polyfillInput){
                            var polyfillInput = document.createElement("input");
                            xtag.addClass(polyfillInput, "x-datepicker-polyfill-input");
                            polyfillInput.setAttribute("type", "text");
                            polyfillInput.setAttribute("placeholder", "YYYY-MM-DD");
                            polyfillInput.value = this.xtag.dateInput.value;

                            this.xtag.polyfillInput = polyfillInput;

                            this.appendChild(polyfillInput);
                        }
                        this.xtag.polyfillInput.removeAttribute("disabled");

                        if(!this.xtag.polyfillUI){
                            // TODO: make this also use x-reel when implemented
                            var polyfillUI = document.createElement("x-calendar");
                            xtag.addClass(polyfillUI, "x-datepicker-polyfill-ui");
                            polyfillUI.chosen = this.value;
                            polyfillUI.view = this.xtag.dateInput.value;
                            polyfillUI.controls = true;
                            this.xtag.polyfillUI = polyfillUI;
                            this.appendChild(polyfillUI);
                        }
                    }
                    else{
                        dateInput.setAttribute("type", "date");
                        dateInput.removeAttribute("readonly");

                        if(this.xtag.polyfillInput){
                            this.xtag.polyfillInput.setAttribute("disabled", true);
                        }
                    }

                }
            }
        },
        methods: { 
        }
    });

})();