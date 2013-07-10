(function(){
    var LABELS = {
        prev: '<',
        next: '>',
        months: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                 'August', 'September', 'October', 'November', 'December']
    };
    var TODAY = new Date();
    TODAY.setUTCHours(0);
    TODAY.setUTCMinutes(0);
    TODAY.setUTCSeconds(0);
    TODAY.setUTCMilliseconds(0);

    /* define constants for parsing multi-date attributes */

    var DRAG_ADD = "add";
    var DRAG_REMOVE = "remove";

    var CHOSEN_CLASS = "chosen";

    //minifier-friendly strings
    var className = 'className';

    // dom helpers

    // minification wrapper for appendChild
    function appendChild(parent, child) {
        parent.appendChild(child);
    }

    // is valid date object?
    function isValidDateObj(d) {
        return !!(d.getTime) && !isNaN(d.getTime());
    }

    function isArray(a){
        if(a && a.isArray){
            return a.isArray();
        }
        else{
            return Object.prototype.toString.call(a) === "[object Array]";
        }
    }

    // Takes a string 'div.foo' and returns the Node <div class="foo">.
    function makeEl(s) {
        var a = s.split('.');
        var tag = a.shift();
        var el = document.createElement(tag);
        if (tag == 'a') {
          el.href = 'javascript:void(0);';
        }
        el[className] = a.join(' ');
        return el;
    }

    // places e1 below e2
    function attachTo(e1, e2) {
        e1.style.left = getLeft(e2) + 'px';
        e1.style.top = getTop(e2) + e2.offsetHeight + 'px';
    }   

    // Recursively determine offsetLeft.
    function getLeft(el) {
        if(el.getBoundingClientRect){
          return el.getBoundingClientRect().left;
        }
        else if (el.offsetParent) {
          return getLeft(el.offsetParent) + el.offsetLeft;
        } else {
          return el.offsetLeft;
        }
    }

    // Recursively determine offsetTop.
    function getTop(el) {
        if(el.getBoundingClientRect){
          return el.getBoundingClientRect().top;
        }
        else if (el.offsetParent) {
          return getTop(el.offsetParent) + el.offsetTop;
        } else {
          return el.offsetTop;
        }   
    }

    function addClass(el, c) {
        xtag.addClass(el, c);
    }

    function removeClass(el, c) {
        xtag.removeClass(el, c);
    }

    function hasClass(el, c) {
        return xtag.hasClass(el, c);
    }

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

    // returns a list of chosen dates/ranges
    // returns null if any parsing error
    function parseMultiDates(multiDateStr){
        // if necessary, split the input into a list of unparsed ranges
        var ranges;
        if(isArray(multiDateStr)){
            ranges = multiDateStr;
        }
        else if(typeof(multiDateStr) === "string" && multiDateStr.length > 0){
            // check if this is a JSON representing a range of dates
            try{
                ranges = JSON.parse(multiDateStr);
                if(!isArray(ranges)){
                    console.log("invalid list of ranges", multiDateStr);
                    return null;
                }
            }
            catch(err){
                // check for if this represents a single date
                var parsedSingle = parseSingleDate(multiDateStr);
                if(parsedSingle){
                    return [parsedSingle];
                }
                else{
                    console.log("unable to parse", multiDateStr, "as JSON or single date");
                    return null;
                }
            }
        }
        else{
            return null;
        }

        // go through and replace each unparsed range with its parsed
        // version (either a singular Date object or a two-item list of
        // a start Date and an end Date)
        for(var i = 0; i < ranges.length; i++){
            var range = ranges[i];

            var components;
            if(range instanceof Date){
                continue;
            }
            else if(typeof(range) === "string"){
                var parsedDate = parseSingleDate(range);
                if(!parsedDate){
                    console.log("unable to parse date", range);
                    return null;
                }
                ranges[i] = parsedDate;
            }
            else if(isArray(range)){
                var parsedStartDate = parseSingleDate(range[0]);

                if(!parsedStartDate){
                    console.log("unable to parse start date", range[0], "in range", range);
                    return null;
                }

                var parsedEndDate = parseSingleDate(range[1]);
                if(!parsedEndDate){
                    console.log("unable to parse end date", range[1], "in range", range);
                    return null;
                }

                if(parsedStartDate.valueOf() > parsedEndDate.valueOf()){
                    console.log("invalid range", range, ": start date is after end date");
                    return null;
                }
                ranges[i] = [parsedStartDate, parsedEndDate];
            }
            else{
                console.log("invalid range value: ", range);
                return null;
            }
        }
        return ranges;
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

    // Create a new date based on the provided date.
    function from(base, y, m, d) {
        if (y === undefined) y = getYear(base);
        if (m === undefined) m = getMonth(base);
        if (d === undefined) d = getDate(base);
        return new Date(y,m,d);
    }

    // get the date with the given offsets from the base date
    function relOffset(base, y, m, d) {
        return from(base,
                    getYear(base) + y,
                    getMonth(base) + m,
                    getDate(base) + d);
    }

    // Find the nearest preceding Sunday.
    function findSunday(d) {
        while(d.getUTCDay() > 0) {
          d = prevDay(d);
        }
        return d;
    }

    // Find the first of the date's month.
    function findFirst(d) {
        while(getDate(d) > 1) {
          d = prevDay(d);
        }
        return d;
    }

    // Return the next day.
    function nextDay(d) {
        return relOffset(d, 0, 0, 1);
    }

    // Return the previous day.
    function prevDay(d) {
        return relOffset(d, 0, 0, -1);
    }

    // Check whether Date `d` is in the list of Date/Date ranges in `matches`.
    function dateMatches(d, matches) {
        if (!matches) return;
        matches = (matches.length === undefined) ? [matches] : matches;
        var foundMatch = false;
        matches.forEach(function(match) {
          if (match.length == 2) {
            if (dateInRange(match[0], match[1], d)) {
              foundMatch = true;
            }
          } else {
            if (iso(match) == iso(d)) {
              foundMatch = true;
            }
          }
        });
        return foundMatch;
    }

    function dateInRange(start, end, d) {
        // convert to strings for easier comparison
        return iso(start) <= iso(d) && iso(d) <= iso(end);
    }

    function sortRanges(ranges){
        ranges.sort(function(rangeA, rangeB){
            var dateA = (rangeA instanceof Date) ? rangeA : rangeA[0];
            var dateB = (rangeB instanceof Date) ? rangeB : rangeB[0];
            return dateA.valueOf() - dateB.valueOf();
        });
    }

    // creates the html elements for a given date, highlighting the
    // given chosen date ranges
    function makeMonth(d, chosen) {
        if (!isValidDateObj(d)) throw 'Invalid view date!';
        var month = getMonth(d);
        var tdate = getDate(d);
        var sDate = findSunday(findFirst(d));

        var monthEl = makeEl('div.month');

        var label = makeEl('div.label');
        label.textContent = LABELS.months[month] + ' ' + getYear(d);

        appendChild(monthEl, label);

        var week = makeEl('div.week');

        var cDate = sDate;

        var done = false;

        while(!done) {
          var day = makeEl('span.day');
          day.setAttribute('data-date', iso(cDate));
          day.textContent = getDate(cDate);
          if (getMonth(cDate) != month) {
            addClass(day, 'badmonth');
          }

          if (dateMatches(cDate, chosen)) {
            addClass(day, CHOSEN_CLASS);
          }

          if(dateMatches(cDate, TODAY)){
            addClass(day, "today");
          }

          appendChild(week, day);
          cDate = nextDay(cDate);
          if (cDate.getUTCDay() < 1) {
            appendChild(monthEl, week);
            week = makeEl('div.week');
            // Are we finished drawing the month?
            // Checks month rollover and year rollover
            done = (getMonth(cDate) > month || 
                    (getMonth(cDate) < month && getYear(cDate) > getYear(sDate))
                   );
          }
        }

        return monthEl;
    }

    function makeControls() {
        var controls = makeEl('div.controls');
        var prev = makeEl('span.prev');
        var next = makeEl('span.next');
        prev.innerHTML = LABELS.prev;
        next.innerHTML = LABELS.next;
        appendChild(controls, prev);
        appendChild(controls, next);
        return controls;
    }

    function Calendar(data) {
        data = data || {};
        this._span = data.span || 1;
        this._multiple = data.multiple || false;
        // initialize private vars
        this._viewDate = this._getSanitizedViewDate(data.view, data.chosen);
        this._chosenRanges = this._getSanitizedChosenRanges(data.chosen, 
                                                                data.view);
        this.el = makeEl('div.calendar');

        this.render();
    }

    // given a view Date and a parsed selection range list, return the
    // Date to use as the view, depending on what information is given
    Calendar.prototype._getSanitizedViewDate = function(viewDate, 
                                                        chosenRanges)
    {
        chosenRanges = (chosenRanges === undefined) ? 
                            this.chosen : chosenRanges;

        // if given a valid viewDate, return it
        if(viewDate instanceof Date){
           return viewDate;
        }
        // otherwise if given a single date for chosenRanges, use it
        else if(chosenRanges instanceof Date){
            return chosenRanges;
        }
        // otherwise, if given a valid chosenRanges, return the first date in
        // the range as the view date
        else if(isArray(chosenRanges) && chosenRanges.length > 0){
            var firstRange = chosenRanges[0];
            if(firstRange instanceof Date){
                return firstRange;
            }
            else{
                return firstRange[0];
            }
        }
        // if not given a valid viewDate or chosenRanges, return the current
        // day as the view date
        else{
            return TODAY;
        }
    };

    function _collapseRanges(ranges){
        sortRanges(ranges);

        var collapsed = [];
        for(var i = 0; i < ranges.length; i++){
            var currRange = ranges[i];
            var prevRange = (collapsed.length > 0) ? 
                              collapsed[collapsed.length-1] : null;

            var currStart, currEnd;
            var prevStart, prevEnd;

            if(currRange instanceof Date){
                currStart = currEnd = currRange;
            }
            else{
                currStart = currRange[0];
                currEnd = currRange[1];
            }
            currRange = (dateMatches(currStart, currEnd)) ? 
                             currStart : [currStart, currEnd];

            if(prevRange instanceof Date){
                prevStart = prevEnd = prevRange;
            }
            else if(prevRange){
                prevStart = prevRange[0];
                prevEnd = prevRange[1];
            }
            else{
                collapsed.push(currRange);
                continue;
            }

            // if we should collapse range, merge with previous range
            if(dateMatches(currStart, [prevRange]) || 
               dateMatches(prevDay(currStart), [prevRange]))
            {
                var minStart = (prevStart.valueOf() < currStart.valueOf()) ? 
                                                          prevStart : currStart;
                var maxEnd = (prevEnd.valueOf() > currEnd.valueOf()) ? 
                                                          prevEnd : currEnd;

                var newRange = (dateMatches(minStart, maxEnd)) ? 
                                                minStart : [minStart, maxEnd];
                collapsed[collapsed.length-1] = newRange;
            }
            // if we don't collapse, just add to list
            else{
                collapsed.push(currRange);
            }
        }

        return collapsed;
    }

    Calendar.prototype._getSanitizedChosenRanges = function(chosenRanges, 
                                                              viewDate)
    {
        viewDate = (viewDate === undefined) ? this.view : viewDate;

        var cleanRanges;
        if(chosenRanges instanceof Date){
            cleanRanges = [chosenRanges];
        }
        else if(isArray(chosenRanges)){
            cleanRanges = chosenRanges;
        }
        else if(viewDate){
            cleanRanges = [viewDate];
        }
        else{
            cleanRanges = [];
        }

        var collapsedRanges = _collapseRanges(cleanRanges);
        if((!this.multiple) && collapsedRanges.length > 0){
            var firstRange = collapsedRanges[0];

            if(firstRange instanceof Date){
                return [firstRange];
            }
            else{
                return [firstRange[0]];
            }
        }
        else{
            return collapsedRanges;
        }
    };

    Calendar.prototype.addDate = function(dateObj, append){
        if(dateObj instanceof Date){
            if(append){
                this.chosen.push(dateObj);
                // trigger setter
                this.chosen = this.chosen;
            }
            else{
                this.chosen = [dateObj];
            }
        }
    }

    Calendar.prototype.removeDate = function(dateObj){
        if(!(dateObj instanceof Date)){
            return;
        }

        var ranges = this.chosen.slice(0);
        for(var i = 0; i < ranges.length; i++){
            var range = ranges[i];
            if(dateMatches(dateObj, [range])){
                ranges.splice(i, 1);

                if(isArray(range)){
                    var rangeStart = range[0];
                    var rangeEnd = range[1];
                    var prevDate = prevDay(dateObj);
                    var nextDate = nextDay(dateObj);

                    if(dateMatches(prevDate, [range])){
                        ranges.push([rangeStart, prevDate]);
                    }

                    if(dateMatches(nextDate, [range])){
                        ranges.push([nextDate, rangeEnd]);
                    }
                }
                this.chosen = _collapseRanges(ranges);
                break;
            }
        }
    }

    Calendar.prototype.render = function(){
        var span = this._span;
        this.el.innerHTML = "";
        // get first month of the span of months centered on the view
        var ref = relOffset(this._viewDate, 0, -Math.floor(span/2), 0);
        for (var i=0; i<span; i++) {
            appendChild(this.el, makeMonth(ref, this._chosenRanges));
            // get next month's date
            ref = relOffset(ref, 0, 1, 0);
        }
    };

    Object.defineProperties(Calendar.prototype, {
        "multiple": {
            get: function(){
                return this._multiple;
            },
            set: function(multi){
                this._multiple = multi;
                this.chosen = this._getSanitizedChosenRanges(this.chosen);
                this.render();
            }
        },
        "span":{
            get: function(){
                return this._span;
            },
            set: function(newSpan){
                this._span = newSpan;
                this.render();
            }
        },
        "view":{
            attribute: {},
            get: function(){
                return this._viewDate;
            },
            set: function(newViewDate){
                this._viewDate = this._getSanitizedViewDate(newViewDate);
                this.render();
            }
        },

        "chosen": {
            get: function(){
                return this._chosenRanges;
            },
            set: function(newChosenRanges){
                this._chosenRanges = 
                        this._getSanitizedChosenRanges(newChosenRanges);
                this.render();
            }
        },

        "chosenString":{
            get: function(){
                if(this.multiple){
                    var isoDates = this.chosen.slice(0);

                    for(var i=0; i < isoDates.length; i++){
                        var range = isoDates[i];
                        if(range instanceof Date){
                            isoDates[i] = iso(range);
                        }
                        else{
                            isoDates[i] = [iso(range[0]), iso(range[1])];
                        }
                    }
                    return JSON.stringify(isoDates);
                }
                else if(this.chosen.length > 0){
                    return iso(this.chosen[0]);
                }
                else{
                    return "";
                }
            }
        }
    });

    // added on the body to delegate dragends to all x-calendars
    xtag.addEvent(document, "tapend", function(e){
        var xCalendars = xtag.query(document, "x-calendar");
        xCalendars.forEach(function(xCalendar){
            xCalendar.xtag.dragType = null;
            xCalendar.removeAttribute("active");
        });
    })

    xtag.register("x-calendar", {
        lifecycle: {
            created: function(){
                this.innerHTML = "";

                var multiple = this.hasAttribute("multiple");
                var chosenRange = this.getAttribute("chosen");
                this.xtag.calObj = new Calendar({
                    span: this.getAttribute("span"),
                    view: parseSingleDate(this.getAttribute("view")),
                    chosen: parseMultiDates(chosenRange),
                    multiple: multiple
                });

                appendChild(this, this.xtag.calObj.el);
                // append controls AFTER calendar to use natural stack order 
                // instead of needing explicit z-index
                appendChild(this, makeControls());

                this.xtag.dragType = null;
            },
            inserted: function(){
                this.render();
            }
        },
        events: {
            "tap:delegate(.next)": function(e){
                var xCalendar = e.currentTarget;
                xCalendar.nextMonth();

                xtag.fireEvent(xCalendar, "nextmonth");
            },
            "tap:delegate(.prev)": function(e){
                var xCalendar = e.currentTarget;
                xCalendar.prevMonth();

                xtag.fireEvent(xCalendar, "prevmonth");
            },
            // start drag
            "tapstart:delegate(.day)": function(e){
                var xCalendar = e.currentTarget;
                var day = this;
                var rawDate = day.getAttribute("data-date");
                var dateObj = parseSingleDate(rawDate);

                if(xtag.hasClass(day, CHOSEN_CLASS)){
                    xCalendar.xtag.dragType = DRAG_REMOVE;
                    xtag.fireEvent(xCalendar, "datetoggleoff", {date: dateObj});
                }
                else{
                    xCalendar.xtag.dragType = DRAG_ADD;
                    xtag.fireEvent(xCalendar, "datetoggleon", {date: dateObj});
                }

                xCalendar.setAttribute("active", true);
            },

            // drag move
            "tapenter:delegate(.day)": function(e){
                var xCalendar = e.currentTarget;
                var day = this;
                var rawDate = day.getAttribute("data-date");
                var dateObj = parseSingleDate(rawDate);
                // trigger a selection if we enter a nonchosen day while in
                // addition mode
                if(xCalendar.xtag.dragType === DRAG_ADD && 
                   !(xtag.hasClass(day, CHOSEN_CLASS)))
                {
                    xtag.fireEvent(xCalendar, "datetoggleon", {date: dateObj});
                }
                // trigger a remove if we enter a chosen day while in
                // removal mode
                else if(xCalendar.xtag.dragType === DRAG_REMOVE && 
                        xtag.hasClass(day, CHOSEN_CLASS))
                {
                    xtag.fireEvent(xCalendar, "datetoggleoff", {date: dateObj});
                }
            },

            "datetoggleon": function(e){
                var xCalendar = this;

                xCalendar.selectDate(e.date, xCalendar.multiple);
            },

            "datetoggleoff": function(e){
                var xCalendar = this;

                xCalendar.unselectDate(e.date);
            }

        },
        accessors: {
            controls: {
                attribute: {boolean: true},
                set: function(){}
            },
            multiple: {
                attribute: {boolean: true},
                get: function(){
                    return this.xtag.calObj.multiple;
                },
                set: function(multi){
                    this.xtag.calObj.multiple = multi;
                    this.chosen = this.chosen;
                }
            },
            span: {
                attribute: {},
                get: function(){
                    return this.xtag.calObj.span;
                },
                set: function(newCalSpan){
                    this.xtag.calObj.span = newCalSpan;
                }
            },
            view: {
                attribute: {},
                get: function(){
                    return this.xtag.calObj.view;
                },
                set: function(newView){
                    var parsedDate = parseSingleDate(newView);
                    if(parsedDate){
                        this.xtag.calObj.view = parsedDate;
                    }
                }
            },
            chosen: {
                attribute: {skip: true},
                get: function(){
                    var chosenRanges = this.xtag.calObj.chosen;
                    // return a single date if multiple selection not allowed
                    if(!this.multiple){
                        if(chosenRanges.length > 0){
                            var firstRange = chosenRanges[0];
                            if(firstRange instanceof Date){
                                return firstRange;
                            }
                            else{
                                return firstRange[0];
                            }
                        }
                        else{
                            return null;
                        }
                    }
                    // otherwise return the entire selection list
                    else{
                        return this.xtag.calObj.chosen;
                    }
                },
                set: function(newDates){
                    var parsedDateRanges = (this.multiple) ? parseMultiDates(newDates) : parseSingleDate(newDates);
                    if(parsedDateRanges){
                        this.xtag.calObj.chosen = parsedDateRanges;
                    }
                    
                    if(this.xtag.calObj.chosenString){
                        // override attribute with auto-generated string
                        this.setAttribute("chosen", 
                                          this.xtag.calObj.chosenString);
                    }
                    else{
                        this.removeAttribute("chosen");
                    }
                }
            }
        },
        methods: { 
            render: function(){
                this.xtag.calObj.render();
            },
            // Go back one month.
            prevMonth: function(){
                var calObj = this.xtag.calObj;
                calObj.view = relOffset(calObj.view, 0, -1, 0);
            },
            // Advance one month forward.
            nextMonth: function(){
                var calObj = this.xtag.calObj;
                calObj.view = relOffset(calObj.view, 0, 1, 0);
            },
            selectDate: function(newDateObj, append){
                this.xtag.calObj.addDate(newDateObj, append);
                // trigger setter
                this.chosen = this.chosen;
            },
            unselectDate: function(dateObj){
                this.xtag.calObj.removeDate(dateObj);
                // trigger setter
                this.chosen = this.chosen;
            }
        }
    });

})();