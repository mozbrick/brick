(function(){
    var ENTER_KEYCODE = 13;

    // Date utils

    /** isValidDateObj: (*) => Boolean

    simply checks if the given parameter is a valid date object
    **/
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

    /** _validateDatepicker: DOM element => Boolean

    checks the value of the datepicker and toggles the datepicker's "invalid"
    attribute depending on if the value is a valid parsable date string or not

    also returns true if the date passes validation and false otherwise
    **/
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


    /** _updateDatepicker: (DOM element, boolean)

    based on the value of the datepicker's input elements, update the value
    attribute/property of the datepicker itself

    if sendParsed is true, we preparse the value before assigning to
    value, otherwise, send the original value
    - (ie: if this is true, update the text value of the inputs with the
           parsed version as well)
    **/
    function _updateDatepicker(datepicker, sendParsed){
        var rawVal = (datepicker.polyfill) ? 
                            datepicker.xtag.polyfillInput.value : 
                            datepicker.xtag.dateInput.value;
        var parsedDate = parseSingleDate(rawVal);

        datepicker.value = (sendParsed && parsedDate) ? parsedDate : rawVal;
    }

    // pass this a callback function to execute
    // if the submit value of the datepicker is changed by the callback,
    // fire the change event on the datepicker
    // if alsoWatchRawVal is true, will also trigger a change event if the 
    // .value changes, not just if the .submitValue changes
    function _watchForChange(datepicker, callback, alsoWatchRawVal){
        var oldVal = datepicker.submitValue;
        var oldRawVal = datepicker.value;
        callback();
        var newVal = datepicker.submitValue;
        var newRawVal = datepicker.value;

        if(oldVal !== newVal || (alsoWatchRawVal && oldRawVal !== newRawVal)) 
        {
            xtag.fireEvent(datepicker, "change");
        }
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

                // initialize polyfill with detected support
                this.polyfill = (this.hasAttribute("polyfill") || 
                                 this.xtag.dateInput.type.toLowerCase() 
                                    !== "date");
            }
        },
        events: {
            // handle calendar UI input
            "datetoggleon:delegate(x-calendar)": function(e){
                var xCal = this;
                var datepicker = e.currentTarget;
                if((!e.detail) || (!e.detail.date)){
                    return;
                }

                var selectedDate = parseSingleDate(e.detail.date);

                _watchForChange(datepicker, function(){
                    datepicker.value = (selectedDate) ? iso(selectedDate) : "";
                    xtag.fireEvent(datepicker, "input");
                });
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

                datepicker.removeAttribute("focused");

                // send parsed version to ensure that text of input matches
                _watchForChange(datepicker, function(){
                    _updateDatepicker(datepicker, true);
                }, true);
            },

            // force readonly state as soon as touch event is detected
            // to prevent mobile keyboard from popping up from now on
            "touchstart:delegate(.x-datepicker-polyfill-input)": function(e){
                this.setAttribute("readonly", true);
            },

            "tapstart:delegate(x-calendar)": function(e){
                e.preventDefault(); // prevent blurring of polyfill input
            },

            "keypress:delegate(.x-datepicker-polyfill-input)": function(e){
                var keyCode = e.keyCode;
                if(keyCode === ENTER_KEYCODE){
                     // send parsed version to ensure that text of input matches
                     _watchForChange(e.currentTarget, function(){
                        _updateDatepicker(e.currentTarget, true);
                    }, true);
                }
            },

            // handle UI changes to the native date input
            "input:delegate(.x-datepicker-input)": function(e){
                _watchForChange(e.currentTarget, function(){
                    // send parsed version to ensure that value of native
                    // input matches
                     _updateDatepicker(e.currentTarget, true);

                    // redirect event target
                    e.stopPropagation();
                    xtag.fireEvent(e.currentTarget, "input");
                });
            },

            // handles UI changes to the polyfill input
            "input:delegate(.x-datepicker-polyfill-input)": function(e){
                // _DONT_ send parsed verison when using polyfill in order to 
                // prevent the input from constantly overriding the user's
                // text as they are typing
                _watchForChange(e.currentTarget, function(){
                    _updateDatepicker(e.currentTarget, false);
                    // redirect event target
                    e.stopPropagation();
                    xtag.fireEvent(e.currentTarget, "input");
                });
            },

            // simply redirect change event target if native
            "change:delegate(.x-datepicker-input)": function(e){
                e.stopPropagation();
                xtag.fireEvent(e.currentTarget, "change");
            },

            "change:delegate(.x-datepicker-polyfill-input)": function(e){
                // change event is different for text input, 
                // so prevent from bubbling
                e.stopPropagation();

                // _DONT_ send parsed verison when using polyfill in order to 
                // prevent the input from constantly overriding the user's
                // text as they are typing
                _watchForChange(e.currentTarget, function(){
                    _updateDatepicker(e.currentTarget, false);
                });
            }
        },
        accessors: {
            "name": {
                attribute: {selector: ".x-datepicker-input"},
                set: function(newName){
                    if(newName === null || newName === undefined){
                        this.xtag.dateInput.removeAttribute("name");
                    }
                    else{
                        this.xtag.dateInput.setAttribute("name", newName);
                    }
                }
            },

            // returns the value that should be submitted to a form
            // note: even if no name attribute is present, still return what 
            // should be submitted for cases of dynamic submission
            "submitValue":{
                get: function(){
                    return this.xtag.dateInput.value;
                }
            },

            // handles the currently displayed value of the datepicker
            "value": {
                attribute: {
                    skip: true
                },
                get: function(){
                    return (this.polyfill) ? this.xtag.polyfillInput.value :
                                             this.xtag.dateInput.value;
                },
                // if given null/undefined, deletes the value;
                // always saves either the date in ISO-format or empty 
                // if the input date is invalid to the dateinput 
                // (this is what actually gets submitted);
                // if given a value different than the user-input-box value, 
                // updates the input's value to the parsed ISO date, otherwise 
                // leaves it alone (this is what the user sees)
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
                        
                        // only override input's text value if given something 
                        // different, in order to prevent having us override
                        // text as the user types
                        if(polyfillInput){
                            if(rawDateVal !== polyfillInput.value){
                                polyfillInput.value = finalVal;
                                this.setAttribute("value", finalVal);
                            }
                            // otherwise, match the value attribute to whats
                            // displayed
                            else{
                                this.setAttribute("value", rawDateVal);
                            }
                        } 
                        else{
                            this.setAttribute("value", finalVal);
                        }

                        // make sure the date input (ie: what actually 
                        // would submit in a form) either contains a valid date
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
                            // note that we don't reset calendar view, as we
                            // may want to choose from where we left off
                        }
                    }
                    // update the "invalid" class of the datepicker
                    _validateDatepicker(this);
                }
            },

            // handles whether to display as a polyfill or not
            // note: in polyfill mode, we essentially keep the original 
            // input, but as a hidden input that receives parsed dates only.
            // In order to allow user-input, we show a second text input
            // (which is nameless to prevent form submission) that is tied to 
            // a calendar UI element
            "polyfill": {
                attribute: {boolean: true},
                set: function(isPolyfill){
                    var dateInput = this.xtag.dateInput;
                    // turn on polyfill elements (creating them if they 
                    // aren't initialized yet)
                    if(isPolyfill){
                        // hide the "true" submitted input from UI view
                        dateInput.setAttribute("type", "hidden");
                        dateInput.setAttribute("readonly", true);

                        // create the "fake" input to act as a middleman 
                        // between user input and the parsed-date-only input
                        if(!this.xtag.polyfillInput){
                            var polyfillInput = document.createElement("input");
                            xtag.addClass(polyfillInput, 
                                          "x-datepicker-polyfill-input");
                            polyfillInput.setAttribute("type", "text");
                            polyfillInput.setAttribute("placeholder", 
                                                        "YYYY-MM-DD");
                            polyfillInput.value = this.xtag.dateInput.value;

                            this.xtag.polyfillInput = polyfillInput;

                            this.appendChild(polyfillInput);
                        }
                        this.xtag.polyfillInput.removeAttribute("disabled");

                        // creates the calendar UI element to associate with
                        // the datepicker
                        if(!this.xtag.polyfillUI){
                            var polyfillUI=document.createElement("x-calendar");
                            xtag.addClass(polyfillUI, 
                                          "x-datepicker-polyfill-ui");
                            polyfillUI.chosen = this.value;
                            polyfillUI.view = this.xtag.dateInput.value;
                            polyfillUI.controls = true;
                            this.xtag.polyfillUI = polyfillUI;
                            this.appendChild(polyfillUI);
                        }
                    }
                    // turn off polyfill elements (but don't remove them)
                    else{
                        dateInput.setAttribute("type", "date");
                        dateInput.removeAttribute("readonly");

                        if(this.xtag.polyfillInput){
                            this.xtag.polyfillInput.setAttribute("disabled", 
                                                                 true);
                        }
                    }
                }
            }
        },
        methods: {
            editLabels: function(newLabelData){
                if(this.xtag.polyfillUI && this.xtag.polyfillUI.labels){
                    this.xtag.polyfillUI.labels = newLabelData;
                }
            }
        }
    });

})();