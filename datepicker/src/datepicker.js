(function(){
    var ENTER_KEYCODE = 13;

    // Date utils

    function getYear(d) {
        return d.getUTCFullYear();
    }
    function getMonth(d) {
        return d.getUTCMonth();
    }
    function getDate(d) {
        return d.getUTCDate();
    }

    // Pad a single digit with preceding zeros to be 2 digits long
    function pad2(n) {
        var str = n.toString();
        return ('0' + str).substr(-2);
    }

    // ISO Date formatting (YYYY-MM-DD)
    function iso(d) {
        return [getYear(d),
                pad2(getMonth(d)+1),
                pad2(getDate(d))].join('-');
    }

    // parse for YYYY-MM-DD format
    var isoDateRegex = /(\d{4})[^\d]?(\d{2})[^\d]?(\d{2})/;
    function fromIso(s){
        if (s instanceof Date) return s;
        var d = isoDateRegex.exec(s);
        if (d) {
          return new Date(d[1],d[2]-1,d[3]);
        }
    }

    // returns actual date if parsable, otherwise null
    function parseSingleDate(dateStr){
        if(dateStr instanceof Date) return dateStr;

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
        var polyfillInput = datepicker.xtag.polyfillInput;
        if(!polyfillInput){
            datepicker.removeAttribute("invalid");
            return;
        }

        var rawVal = polyfillInput.value;
        var inputDate = parseSingleDate(rawVal);
        if(inputDate)
        {
            console.log("ajfldsa")
            datepicker.removeAttribute("invalid");
        }
        else{
            console.log("whowhowoho")
            datepicker.setAttribute("invalid", true);
        }

        return !!inputDate;
    }

    function _updateDatepicker(datepicker){
        if(!datepicker.xtag.polyfillInput) return;

        var origVal = datepicker.xtag.polyfillInput.value;
        if(_validateDatepicker(datepicker)){
            datepicker.value = parseSingleDate(origVal);
        }
        else{
            datepicker.value = null;
            datepicker.xtag.polyfillInput.value = origVal;
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

                if(this.hasAttribute("polyfill") || 
                   this.xtag.dateInput.type.toLowerCase() !== "date")
                {
                    this.setAttribute("polyfill", true);
                }
                else{
                    this.removeAttribute("polyfill");
                }
            },
            inserted: function(){
            }
        },
        events: {
            "datetoggleon:delegate(x-calendar)": function(e){
                var xCal = this;
                var datepicker = e.currentTarget;

                var selectedDate = parseSingleDate(e.date);
                if(selectedDate){
                    datepicker.value = iso(selectedDate);
                }
                else{
                    datepicker.value = "";
                }
            },

            "datetoggleoff:delegate(x-calendar)": function(e){
                var datepicker = e.currentTarget;
                datepicker.value = null; // workaround until skip:true works
            },

            "blur:delegate(.x-datepicker-polyfill-input)": function(e){
                _updateDatepicker(e.currentTarget);
            },

            "keyup:delegate(.x-datepicker-polyfill-input)": function(e){
                var keyCode = e.key || e.keyCode;
                if(keyCode === ENTER_KEYCODE){
                    _updateDatepicker(e.currentTarget);
                }
            },

            "input:delegate(.x-datepicker-polyfill-input)": function(e){
                _validateDatepicker(e.currentTarget);
            }
        },
        accessors: {
            "name": {
                attribute: {selector: ".x-datepicker-input"}
            },
            "value": {
                attribute: {
                    skip: true
                },
                get: function(){
                    return this.xtag.dateInput.value;
                },
                set: function(dateVal){
                    var parsedDate = parseSingleDate(dateVal);
                    if(parsedDate){
                        var isoStr = iso(parsedDate);
                        this.setAttribute("value", isoStr);

                        this.xtag.dateInput.setAttribute("value", isoStr);
                        this.xtag.dateInput.value = isoStr;

                        if(this.xtag.polyfillInput){
                            this.xtag.polyfillInput.setAttribute("value", isoStr);
                            this.xtag.polyfillInput.value = isoStr;
                        }

                        if(this.xtag.polyfillUI){
                            this.xtag.polyfillUI.chosen = parsedDate;
                            this.xtag.polyfillUI.view = parsedDate;
                        }
                    }
                    else{
                        this.removeAttribute("value");
                        this.xtag.dateInput.removeAttribute("value");
                        this.xtag.dateInput.value = "";

                        if(this.xtag.polyfillInput){
                            this.xtag.polyfillInput.removeAttribute("value");
                            this.xtag.polyfillInput.value = "";
                        }

                        if(this.xtag.polyfillUI){
                            this.xtag.polyfillUI.chosen = null;
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
                            polyfillInput.setAttribute("type", "text");
                            xtag.addClass(polyfillInput, "x-datepicker-polyfill-input");
                            polyfillInput.setAttribute("value", this.value);
                            polyfillInput.setAttribute("placeholder", "YYYY-MM-DD");
                            polyfillInput.value = this.value;

                            this.xtag.polyfillInput = polyfillInput;

                            this.appendChild(polyfillInput);
                        }
                        this.xtag.polyfillInput.removeAttribute("disabled");

                        if(!this.xtag.polyfillUI){
                            // TODO: make this also use x-reel when implemented
                            var polyfillUI = document.createElement("x-calendar");
                            polyfillUI.chosen = this.value;
                            polyfillUI.view = this.value;
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