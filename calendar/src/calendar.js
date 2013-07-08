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

    // separator within a range between start date & end date
    var INNER_RANGE_SEP = "|"; 
    // separator between date ranges
    var OUTER_RANGE_SEP = ";";

    var DRAG_ADD = "add";
    var DRAG_REMOVE = "remove";

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

    // returns a list of selected dates/ranges
    // returns null if any parsing error
    function parseMultiDates(multiDateStr){
        // if necessary, split the input into a list of unparsed ranges
        var ranges;
        if(isArray(multiDateStr)){
            ranges = multiDateStr;
        }
        else if(typeof(multiDateStr) === "string"){
            ranges = multiDateStr.split(OUTER_RANGE_SEP);
        }
        else{
            return null;
        }

        // go through and replace each unparsed range with its parsed
        // version (either a singular Date object or a two-item list of
        // a start Date and an end Date)
        for(var i = 0; i < ranges.length; i++){
            var rangeStr = ranges[i];

            var components;
            if(rangeStr instanceof Date){
                continue;
            }
            else if(isArray(rangeStr)){
                components = rangeStr;
            }
            else{
                components = rangeStr.split(INNER_RANGE_SEP);
            }

            switch(components.length){
                // if only a single item, set the range to be a 
                // single Date object
                case 1:
                    var singleParsedDate = parseSingleDate(components[0]);
                    if(!singleParsedDate){
                        console.log("unable to parse date:", components[0]);
                        return null;
                    }
                    ranges[i] = singleParsedDate;
                    break;
                // if multiple items, set the range to be a 2-item list of 
                // a start Date and an end Date
                case 2:
                    var startStr = components[0];
                    var endStr = components[1];

                    var parsedStartDate = parseSingleDate(startStr);
                    if(!parsedStartDate){
                        console.log("unable to parse start", startStr, 
                                    "in range", rangeStr);
                        return null;
                    }
                    var parsedEndDate = parseSingleDate(endStr);
                    if(!parsedEndDate){
                        console.log("unable to parse end", endStr, 
                                    "in range", rangeStr);
                        return null;
                    }

                    if(parsedStartDate.valueOf() > parsedEndDate.valueOf()){
                        console.log("invalid range", rangeStr, "; start date is after end date");
                        return null;
                    }

                    ranges[i] = [parsedStartDate, parsedEndDate];
                    break;

                // if not given a date or a 2-item range, log a parsing error
                default:
                    console.log("unable to parse range:", rangeStr);
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
    // given selected date ranges
    function makeMonth(d, selected) {
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

          if (dateMatches(cDate, selected)) {
            addClass(day, 'sel');
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
            done = getMonth(cDate) > month || (getMonth(cDate) < month && getYear(cDate) > getYear(sDate));
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
        var self = this;
        data = data || {};
        self._span = data.span || 1;
        // initialize private vars
        self._viewDate = self._getSanitizedViewDate(data.view, data.selected);
        self._selectedRanges = self._getSanitizedSelectedRanges(data.selected, data.view);
        self.el = makeEl('div.calendar');

        self.render();
    }

    // given a view Date and a parsed selection range list, return the
    // Date to use as the view, depending on what information is given
    Calendar.prototype._getSanitizedViewDate = function(viewDate, selectedRanges){
        selectedRanges = (selectedRanges === undefined) ? this.selected : selectedRanges;

        // if given a valid viewDate, return it
        if(viewDate instanceof Date){
           return viewDate;
        }
        // otherwise, if given a valid selectedRanges, return the first date in
        // the range as the view date
        else if(isArray(selectedRanges) && selectedRanges.length > 0){
            var firstRange = selectedRanges[0];
            if(firstRange instanceof Date){
                return firstRange;
            }
            else{
                return firstRange[0];
            }
        }
        // if not given a valid viewDate or selectedRanges, return the current
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
            var prevRange = (collapsed.length > 0) ? collapsed[collapsed.length-1] : null;

            var currStart, currEnd;
            var prevStart, prevEnd;

            if(currRange instanceof Date){
                currStart = currEnd = currRange;
            }
            else{
                currStart = currRange[0];
                currEnd = currRange[1];
            }
            currRange = (dateMatches(currStart, currEnd)) ? currStart : [currStart, currEnd];

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
            if(dateMatches(currStart, [prevRange]) || dateMatches(prevDay(currStart), [prevRange])){
                var minStart = (prevStart.valueOf() < currStart.valueOf()) ? prevStart : currStart;
                var maxEnd = (prevEnd.valueOf() > currEnd.valueOf()) ? prevEnd : currEnd;

                var newRange = (dateMatches(minStart, maxEnd)) ? minStart : [minStart, maxEnd];
                collapsed[collapsed.length-1] = newRange;
            }
            // if we don't collapse, just add to list
            else{
                collapsed.push(currRange);
            }
        }

        return collapsed;
    }

    Calendar.prototype._getSanitizedSelectedRanges = function(selectedRanges, viewDate){
        viewDate = (viewDate === undefined) ? this.view : viewDate;

        var cleanRanges;
        if(selectedRanges instanceof Date){
            cleanRanges = [selectedRanges];
        }
        else if(isArray(selectedRanges)){
            cleanRanges = selectedRanges;
        }
        else if(viewDate){
            cleanRanges = [viewDate];
        }
        else{
            cleanRanges = [];
        }

        return _collapseRanges(cleanRanges);
    };

    Calendar.prototype.addDate = function(dateObj, append){
        if(dateObj instanceof Date){
            if(append){
                this.selected.push(dateObj);
                // trigger setter
                this.selected = this.selected;
            }
            else{
                this.selected = [dateObj];
            }
        }
    }

    Calendar.prototype.removeDate = function(dateObj){
        if(!(dateObj instanceof Date)){
            return;
        }

        var ranges = this.selected.slice(0);
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
                this.selected = _collapseRanges(ranges);
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
            appendChild(this.el, makeMonth(ref, this._selectedRanges));
            // get next month's date
            ref = relOffset(ref, 0, 1, 0);
        }
    };

    Object.defineProperties(Calendar.prototype, {
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

        "selected": {
            get: function(){
                return this._selectedRanges;
            },
            set: function(newSelectedRanges){
                this._selectedRanges = this._getSanitizedSelectedRanges(newSelectedRanges);
                this.render();
            }
        },

        "selectedString":{
            get: function(){
                // make copy so that we don't destroy internal representation
                var selectedRanges = this._selectedRanges.slice(0);

                for(var i = 0; i < selectedRanges.length; i++){
                    var range = selectedRanges[i];
                    if(range instanceof Date){
                        selectedRanges[i] = iso(range);
                    }
                    else{
                        selectedRanges[i] = iso(range[0]) + INNER_RANGE_SEP +
                                            iso(range[1]);
                    }
                }
                return selectedRanges.join(OUTER_RANGE_SEP);
            }
        }
    });


    xtag.register("x-calendar", {
        lifecycle: {
            created: function(){
                this.innerHTML = "";

                this.xtag.calObj = new Calendar({
                    span: this.getAttribute("span"),
                    view: parseSingleDate(this.getAttribute("view")),
                    selected: parseMultiDates(this.getAttribute("selected"))
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
            "tapstart:delegate(.day)": function(e){
                var xCalendar = e.currentTarget;
                var day = this;
                var rawDate = day.getAttribute("data-date");
                var dateObj = parseSingleDate(rawDate);

                if(xtag.hasClass(day, "sel")){
                    xCalendar.xtag.dragType = DRAG_REMOVE;
                    xCalendar.unselectDate(dateObj);
                }
                else{
                    xCalendar.xtag.dragType = DRAG_ADD;
                    xCalendar.selectDate(dateObj, true);
                }
            },
            "tapenter:delegate(.day)": function(e){
                var xCalendar = e.currentTarget;
                var rawDate = this.getAttribute("data-date");
                var dateObj = parseSingleDate(rawDate);
                if(xCalendar.xtag.dragType === DRAG_ADD){
                    xCalendar.selectDate(dateObj, true);
                }
                else if(xCalendar.xtag.dragType === DRAG_REMOVE){
                    xCalendar.unselectDate(dateObj);
                }
            },
            "tapend": function(e){
                var xCalendar = e.currentTarget;

                if(xCalendar.xtag.dragType === DRAG_ADD){
                    xtag.fireEvent(xCalendar, "dateselect");
                }
                else if(xCalendar.xtag.dragType === DRAG_REMOVE){
                    xtag.fireEvent(xCalendar, "dateremove");
                }
                xCalendar.xtag.dragType = null;
            }
        },
        accessors: {
            controls:{
                attribute: {boolean: true}
            },
            span:{
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
            selected: {
                attribute: {skip: true},
                get: function(){
                    return this.xtag.calObj.selected;
                },
                set: function(newDates){
                    var parsedDateRanges = parseMultiDates(newDates);
                    if(parsedDateRanges){
                        this.xtag.calObj.selected = parsedDateRanges;
                        this.setAttribute("selected", this.xtag.calObj.selectedString);
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
                this.selected = this.selected;
            },
            unselectDate: function(dateObj){
                this.xtag.calObj.removeDate(dateObj);
                // trigger setter
                this.selected = this.selected;
            }
        }
    });

})();