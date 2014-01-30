(function() {
    var LEFT_MOUSE_BTN = 0;
    var GET_DEFAULT_LABELS = function() {
        return {
            prev: "←",
            next: "→",
            months: [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
            weekdays: [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ]
        };
    };
    function normalize(localDate) {
        var normalizedDate = new Date(localDate.valueOf());
        normalizedDate.setHours(0);
        normalizedDate.setMinutes(0);
        normalizedDate.setSeconds(0);
        normalizedDate.setMilliseconds(0);
        return normalizedDate;
    }
    var TODAY = normalize(new Date());
    var DRAG_ADD = "add";
    var DRAG_REMOVE = "remove";
    var CHOSEN_CLASS = "chosen";
    var className = "className";
    function appendChild(parent, child) {
        parent.appendChild(child);
    }
    function parseIntDec(num) {
        return parseInt(num, 10);
    }
    function isWeekdayNum(dayNum) {
        var dayInt = parseIntDec(dayNum);
        return dayInt === dayNum && !isNaN(dayInt) && dayInt >= 0 && dayInt <= 6;
    }
    function isValidDateObj(d) {
        return d instanceof Date && !!d.getTime && !isNaN(d.getTime());
    }
    function isArray(a) {
        if (a && a.isArray) {
            return a.isArray();
        } else {
            return Object.prototype.toString.call(a) === "[object Array]";
        }
    }
    function makeEl(s) {
        var a = s.split(".");
        var tag = a.shift();
        var el = document.createElement(tag);
        el[className] = a.join(" ");
        return el;
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
    function addClass(el, c) {
        xtag.addClass(el, c);
    }
    function removeClass(el, c) {
        xtag.removeClass(el, c);
    }
    function hasClass(el, c) {
        return xtag.hasClass(el, c);
    }
    function getYear(d) {
        return d.getFullYear();
    }
    function getMonth(d) {
        return d.getMonth();
    }
    function getDate(d) {
        return d.getDate();
    }
    function getDay(d) {
        return d.getDay();
    }
    function pad(n, padSize) {
        var str = n.toString();
        var padZeros = new Array(padSize).join("0");
        return (padZeros + str).substr(-padSize);
    }
    function iso(d) {
        return [ pad(getYear(d), 4), pad(getMonth(d) + 1, 2), pad(getDate(d), 2) ].join("-");
    }
    var ISO_DATE_REGEX = /(\d{4})[^\d]?(\d{2})[^\d]?(\d{2})/;
    function fromIso(s) {
        if (isValidDateObj(s)) {
            return s;
        }
        var d = ISO_DATE_REGEX.exec(s);
        if (d) {
            return normalize(new Date(d[1], d[2] - 1, d[3]));
        } else {
            return null;
        }
    }
    function parseSingleDate(dateStr) {
        if (isValidDateObj(dateStr)) {
            return dateStr;
        }
        var isoParsed = fromIso(dateStr);
        if (isoParsed) {
            return isoParsed;
        } else {
            var parsedMs = Date.parse(dateStr);
            if (!isNaN(parsedMs)) {
                return normalize(new Date(parsedMs));
            }
            return null;
        }
    }
    function parseMultiDates(multiDateStr) {
        var ranges;
        if (isArray(multiDateStr)) {
            ranges = multiDateStr.slice(0);
        } else if (isValidDateObj(multiDateStr)) {
            return [ multiDateStr ];
        } else if (typeof multiDateStr === "string" && multiDateStr.length > 0) {
            try {
                ranges = JSON.parse(multiDateStr);
                if (!isArray(ranges)) {
                    return null;
                }
            } catch (err) {
                var parsedSingle = parseSingleDate(multiDateStr);
                if (parsedSingle) {
                    return [ parsedSingle ];
                } else {
                    return null;
                }
            }
        } else {
            return null;
        }
        for (var i = 0; i < ranges.length; i++) {
            var range = ranges[i];
            if (isValidDateObj(range)) {
                continue;
            } else if (typeof range === "string") {
                var parsedDate = parseSingleDate(range);
                if (!parsedDate) {
                    return null;
                }
                ranges[i] = parsedDate;
            } else if (isArray(range) && range.length === 2) {
                var parsedStartDate = parseSingleDate(range[0]);
                if (!parsedStartDate) {
                    return null;
                }
                var parsedEndDate = parseSingleDate(range[1]);
                if (!parsedEndDate) {
                    return null;
                }
                if (parsedStartDate.valueOf() > parsedEndDate.valueOf()) {
                    return null;
                }
                ranges[i] = [ parsedStartDate, parsedEndDate ];
            } else {
                return null;
            }
        }
        return ranges;
    }
    function from(base, y, m, d) {
        if (y === undefined) {
            y = getYear(base);
        }
        if (m === undefined) {
            m = getMonth(base);
        }
        if (d === undefined) {
            d = getDate(base);
        }
        return normalize(new Date(y, m, d));
    }
    function daysInMonth(month, year) {
        if (!year) {
            year = new Date().getFullYear();
        }
        return new Date(year, month + 1, 0).getDate();
    }
    function relOffset(base, y, m, d) {
        return from(base, getYear(base) + y, getMonth(base) + m, getDate(base) + d);
    }
    function nextMonth(d) {
        var date = d.getDate();
        var daysInNextMonth = daysInMonth(d.getMonth() + 1, d.getFullYear());
        if (date > daysInNextMonth) {
            date = daysInNextMonth;
        }
        return new Date(d.getFullYear(), d.getMonth() + 1, date);
    }
    function prevMonth(d) {
        var date = d.getDate();
        var daysInPrevMonth = daysInMonth(d.getMonth() - 1, d.getFullYear());
        if (date > daysInPrevMonth) {
            date = daysInPrevMonth;
        }
        return new Date(d.getFullYear(), d.getMonth() - 1, date);
    }
    function findWeekStart(d, firstWeekday) {
        firstWeekday = parseIntDec(firstWeekday);
        if (!isWeekdayNum(firstWeekday)) {
            firstWeekday = 0;
        }
        for (var step = 0; step < 7; step++) {
            if (getDay(d) === firstWeekday) {
                return d;
            } else {
                d = prevDay(d);
            }
        }
        throw "unable to find week start";
    }
    function findWeekEnd(d, lastWeekDay) {
        lastWeekDay = parseIntDec(lastWeekDay);
        if (!isWeekdayNum(lastWeekDay)) {
            lastWeekDay = 6;
        }
        for (var step = 0; step < 7; step++) {
            if (getDay(d) === lastWeekDay) {
                return d;
            } else {
                d = nextDay(d);
            }
        }
        throw "unable to find week end";
    }
    function findFirst(d) {
        d = new Date(d.valueOf());
        d.setDate(1);
        return normalize(d);
    }
    function findLast(d) {
        return prevDay(relOffset(d, 0, 1, 0));
    }
    function nextDay(d) {
        return relOffset(d, 0, 0, 1);
    }
    function prevDay(d) {
        return relOffset(d, 0, 0, -1);
    }
    function dateMatches(d, matches) {
        if (!matches) {
            return;
        }
        matches = matches.length === undefined ? [ matches ] : matches;
        var foundMatch = false;
        matches.forEach(function(match) {
            if (match.length === 2) {
                if (dateInRange(match[0], match[1], d)) {
                    foundMatch = true;
                }
            } else {
                if (iso(match) === iso(d)) {
                    foundMatch = true;
                }
            }
        });
        return foundMatch;
    }
    function dateInRange(start, end, d) {
        return iso(start) <= iso(d) && iso(d) <= iso(end);
    }
    function sortRanges(ranges) {
        ranges.sort(function(rangeA, rangeB) {
            var dateA = isValidDateObj(rangeA) ? rangeA : rangeA[0];
            var dateB = isValidDateObj(rangeB) ? rangeB : rangeB[0];
            return dateA.valueOf() - dateB.valueOf();
        });
    }
    function makeControls(labelData) {
        var controls = makeEl("div.controls");
        var prev = makeEl("span.prev");
        var next = makeEl("span.next");
        prev.innerHTML = labelData.prev;
        next.innerHTML = labelData.next;
        appendChild(controls, prev);
        appendChild(controls, next);
        return controls;
    }
    function Calendar(data) {
        var self = this;
        data = data || {};
        self._span = data.span || 1;
        self._multiple = data.multiple || false;
        self._viewDate = self._sanitizeViewDate(data.view, data.chosen);
        self._chosenRanges = self._sanitizeChosenRanges(data.chosen, data.view);
        self._firstWeekdayNum = data.firstWeekdayNum || 0;
        self._el = makeEl("div.calendar");
        self._labels = GET_DEFAULT_LABELS();
        self._customRenderFn = null;
        self._renderRecursionFlag = false;
        self.render(true);
    }
    var CALENDAR_PROTOTYPE = Calendar.prototype;
    CALENDAR_PROTOTYPE.makeMonth = function(d) {
        if (!isValidDateObj(d)) {
            throw "Invalid view date!";
        }
        var firstWeekday = this.firstWeekdayNum;
        var chosen = this.chosen;
        var labels = this.labels;
        var month = getMonth(d);
        var sDate = findWeekStart(findFirst(d), firstWeekday);
        var monthEl = makeEl("div.month");
        var monthLabel = makeEl("div.month-label");
        monthLabel.textContent = labels.months[month] + " " + getYear(d);
        appendChild(monthEl, monthLabel);
        var weekdayLabels = makeEl("div.weekday-labels");
        for (var step = 0; step < 7; step++) {
            var weekdayNum = (firstWeekday + step) % 7;
            var weekdayLabel = makeEl("span.weekday-label");
            weekdayLabel.textContent = labels.weekdays[weekdayNum];
            appendChild(weekdayLabels, weekdayLabel);
        }
        appendChild(monthEl, weekdayLabels);
        var week = makeEl("div.week");
        var cDate = sDate;
        var maxDays = 7 * 6;
        for (step = 0; step < maxDays; step++) {
            var day = makeEl("span.day");
            day.setAttribute("data-date", iso(cDate));
            day.textContent = getDate(cDate);
            if (getMonth(cDate) !== month) {
                addClass(day, "badmonth");
            }
            if (dateMatches(cDate, chosen)) {
                addClass(day, CHOSEN_CLASS);
            }
            if (dateMatches(cDate, TODAY)) {
                addClass(day, "today");
            }
            appendChild(week, day);
            cDate = nextDay(cDate);
            if ((step + 1) % 7 === 0) {
                appendChild(monthEl, week);
                week = makeEl("div.week");
                var done = getMonth(cDate) > month || getMonth(cDate) < month && getYear(cDate) > getYear(sDate);
                if (done) {
                    break;
                }
            }
        }
        return monthEl;
    };
    CALENDAR_PROTOTYPE._sanitizeViewDate = function(viewDate, chosenRanges) {
        chosenRanges = chosenRanges === undefined ? this.chosen : chosenRanges;
        var saneDate;
        if (isValidDateObj(viewDate)) {
            saneDate = viewDate;
        } else if (isValidDateObj(chosenRanges)) {
            saneDate = chosenRanges;
        } else if (isArray(chosenRanges) && chosenRanges.length > 0) {
            var firstRange = chosenRanges[0];
            if (isValidDateObj(firstRange)) {
                saneDate = firstRange;
            } else {
                saneDate = firstRange[0];
            }
        } else {
            saneDate = TODAY;
        }
        return saneDate;
    };
    function _collapseRanges(ranges) {
        ranges = ranges.slice(0);
        sortRanges(ranges);
        var collapsed = [];
        for (var i = 0; i < ranges.length; i++) {
            var currRange = ranges[i];
            var prevRange = collapsed.length > 0 ? collapsed[collapsed.length - 1] : null;
            var currStart, currEnd;
            var prevStart, prevEnd;
            if (isValidDateObj(currRange)) {
                currStart = currEnd = currRange;
            } else {
                currStart = currRange[0];
                currEnd = currRange[1];
            }
            currRange = dateMatches(currStart, currEnd) ? currStart : [ currStart, currEnd ];
            if (isValidDateObj(prevRange)) {
                prevStart = prevEnd = prevRange;
            } else if (prevRange) {
                prevStart = prevRange[0];
                prevEnd = prevRange[1];
            } else {
                collapsed.push(currRange);
                continue;
            }
            if (dateMatches(currStart, [ prevRange ]) || dateMatches(prevDay(currStart), [ prevRange ])) {
                var minStart = prevStart.valueOf() < currStart.valueOf() ? prevStart : currStart;
                var maxEnd = prevEnd.valueOf() > currEnd.valueOf() ? prevEnd : currEnd;
                var newRange = dateMatches(minStart, maxEnd) ? minStart : [ minStart, maxEnd ];
                collapsed[collapsed.length - 1] = newRange;
            } else {
                collapsed.push(currRange);
            }
        }
        return collapsed;
    }
    CALENDAR_PROTOTYPE._sanitizeChosenRanges = function(chosenRanges, viewDate) {
        viewDate = viewDate === undefined ? this.view : viewDate;
        var cleanRanges;
        if (isValidDateObj(chosenRanges)) {
            cleanRanges = [ chosenRanges ];
        } else if (isArray(chosenRanges)) {
            cleanRanges = chosenRanges;
        } else if (chosenRanges === null || chosenRanges === undefined || !viewDate) {
            cleanRanges = [];
        } else {
            cleanRanges = [ viewDate ];
        }
        var collapsedRanges = _collapseRanges(cleanRanges);
        if (!this.multiple && collapsedRanges.length > 0) {
            var firstRange = collapsedRanges[0];
            if (isValidDateObj(firstRange)) {
                return [ firstRange ];
            } else {
                return [ firstRange[0] ];
            }
        } else {
            return collapsedRanges;
        }
    };
    CALENDAR_PROTOTYPE.addDate = function(dateObj, append) {
        if (isValidDateObj(dateObj)) {
            if (append) {
                this.chosen.push(dateObj);
                this.chosen = this.chosen;
            } else {
                this.chosen = [ dateObj ];
            }
        }
    };
    CALENDAR_PROTOTYPE.removeDate = function(dateObj) {
        if (!isValidDateObj(dateObj)) {
            return;
        }
        var ranges = this.chosen.slice(0);
        for (var i = 0; i < ranges.length; i++) {
            var range = ranges[i];
            if (dateMatches(dateObj, [ range ])) {
                ranges.splice(i, 1);
                if (isArray(range)) {
                    var rangeStart = range[0];
                    var rangeEnd = range[1];
                    var prevDate = prevDay(dateObj);
                    var nextDate = nextDay(dateObj);
                    if (dateMatches(prevDate, [ range ])) {
                        ranges.push([ rangeStart, prevDate ]);
                    }
                    if (dateMatches(nextDate, [ range ])) {
                        ranges.push([ nextDate, rangeEnd ]);
                    }
                }
                this.chosen = _collapseRanges(ranges);
                break;
            }
        }
    };
    CALENDAR_PROTOTYPE.hasChosenDate = function(dateObj) {
        return dateMatches(dateObj, this._chosenRanges);
    };
    CALENDAR_PROTOTYPE.hasVisibleDate = function(dateObj, excludeBadMonths) {
        var startDate = excludeBadMonths ? this.firstVisibleMonth : this.firstVisibleDate;
        var endDate = excludeBadMonths ? findLast(this.lastVisibleMonth) : this.lastVisibleDate;
        return dateMatches(dateObj, [ [ startDate, endDate ] ]);
    };
    CALENDAR_PROTOTYPE.render = function(preserveNodes) {
        var span = this._span;
        var i;
        if (!preserveNodes) {
            this.el.innerHTML = "";
            var ref = this.firstVisibleMonth;
            for (i = 0; i < span; i++) {
                appendChild(this.el, this.makeMonth(ref));
                ref = relOffset(ref, 0, 1, 0);
            }
        } else {
            var days = xtag.query(this.el, ".day");
            var day;
            for (i = 0; i < days.length; i++) {
                day = days[i];
                if (!day.hasAttribute("data-date")) {
                    continue;
                }
                var dateIso = day.getAttribute("data-date");
                var parsedDate = fromIso(dateIso);
                if (!parsedDate) {
                    continue;
                } else {
                    if (dateMatches(parsedDate, this._chosenRanges)) {
                        addClass(day, CHOSEN_CLASS);
                    } else {
                        removeClass(day, CHOSEN_CLASS);
                    }
                    if (dateMatches(parsedDate, [ TODAY ])) {
                        addClass(day, "today");
                    } else {
                        removeClass(day, "today");
                    }
                }
            }
        }
        this._callCustomRenderer();
    };
    CALENDAR_PROTOTYPE._callCustomRenderer = function() {
        if (!this._customRenderFn) {
            return;
        }
        if (this._renderRecursionFlag) {
            throw "Error: customRenderFn causes recursive loop of " + "rendering calendar; make sure your custom rendering " + "function doesn't modify attributes of the x-calendar that " + "would require a re-render!";
        }
        var days = xtag.query(this.el, ".day");
        for (var i = 0; i < days.length; i++) {
            var day = days[i];
            var dateIso = day.getAttribute("data-date");
            var parsedDate = fromIso(dateIso);
            this._renderRecursionFlag = true;
            this._customRenderFn(day, parsedDate ? parsedDate : null, dateIso);
            this._renderRecursionFlag = false;
        }
    };
    Object.defineProperties(CALENDAR_PROTOTYPE, {
        el: {
            get: function() {
                return this._el;
            }
        },
        multiple: {
            get: function() {
                return this._multiple;
            },
            set: function(multi) {
                this._multiple = multi;
                this.chosen = this._sanitizeChosenRanges(this.chosen);
                this.render(true);
            }
        },
        span: {
            get: function() {
                return this._span;
            },
            set: function(newSpan) {
                var parsedSpan = parseIntDec(newSpan);
                if (!isNaN(parsedSpan) && parsedSpan >= 0) {
                    this._span = parsedSpan;
                } else {
                    this._span = 0;
                }
                this.render(false);
            }
        },
        view: {
            attribute: {},
            get: function() {
                return this._viewDate;
            },
            set: function(rawViewDate) {
                var newViewDate = this._sanitizeViewDate(rawViewDate);
                var oldViewDate = this._viewDate;
                this._viewDate = newViewDate;
                this.render(getMonth(oldViewDate) === getMonth(newViewDate) && getYear(oldViewDate) === getYear(newViewDate));
            }
        },
        chosen: {
            get: function() {
                return this._chosenRanges;
            },
            set: function(newChosenRanges) {
                this._chosenRanges = this._sanitizeChosenRanges(newChosenRanges);
                this.render(true);
            }
        },
        firstWeekdayNum: {
            get: function() {
                return this._firstWeekdayNum;
            },
            set: function(weekdayNum) {
                weekdayNum = parseIntDec(weekdayNum);
                if (!isWeekdayNum(weekdayNum)) {
                    weekdayNum = 0;
                }
                this._firstWeekdayNum = weekdayNum;
                this.render(false);
            }
        },
        lastWeekdayNum: {
            get: function() {
                return (this._firstWeekdayNum + 6) % 7;
            }
        },
        customRenderFn: {
            get: function() {
                return this._customRenderFn;
            },
            set: function(newRenderFn) {
                this._customRenderFn = newRenderFn;
                this.render(true);
            }
        },
        chosenString: {
            get: function() {
                if (this.multiple) {
                    var isoDates = this.chosen.slice(0);
                    for (var i = 0; i < isoDates.length; i++) {
                        var range = isoDates[i];
                        if (isValidDateObj(range)) {
                            isoDates[i] = iso(range);
                        } else {
                            isoDates[i] = [ iso(range[0]), iso(range[1]) ];
                        }
                    }
                    return JSON.stringify(isoDates);
                } else if (this.chosen.length > 0) {
                    return iso(this.chosen[0]);
                } else {
                    return "";
                }
            }
        },
        firstVisibleMonth: {
            get: function() {
                return findFirst(this.view);
            }
        },
        lastVisibleMonth: {
            get: function() {
                return relOffset(this.firstVisibleMonth, 0, Math.max(0, this.span - 1), 0);
            }
        },
        firstVisibleDate: {
            get: function() {
                return findWeekStart(this.firstVisibleMonth, this.firstWeekdayNum);
            }
        },
        lastVisibleDate: {
            get: function() {
                return findWeekEnd(findLast(this.lastVisibleMonth), this.lastWeekdayNum);
            }
        },
        labels: {
            get: function() {
                return this._labels;
            },
            set: function(newLabelData) {
                var oldLabelData = this.labels;
                for (var labelType in oldLabelData) {
                    if (!(labelType in newLabelData)) {
                        continue;
                    }
                    var oldLabel = this._labels[labelType];
                    var newLabel = newLabelData[labelType];
                    if (isArray(oldLabel)) {
                        if (isArray(newLabel) && oldLabel.length === newLabel.length) {
                            newLabel = newLabel.slice(0);
                            for (var i = 0; i < newLabel.length; i++) {
                                newLabel[i] = newLabel[i].toString ? newLabel[i].toString() : String(newLabel[i]);
                            }
                        } else {
                            throw "invalid label given for '" + labelType + "': expected array of " + oldLabel.length + " labels, got " + JSON.stringify(newLabel);
                        }
                    } else {
                        newLabel = String(newLabel);
                    }
                    oldLabelData[labelType] = newLabel;
                }
                this.render(false);
            }
        }
    });
    function _onDragStart(xCalendar, day) {
        var isoDate = day.getAttribute("data-date");
        var dateObj = parseSingleDate(isoDate);
        var toggleEventName;
        if (hasClass(day, CHOSEN_CLASS)) {
            xCalendar.xtag.dragType = DRAG_REMOVE;
            toggleEventName = "datetoggleoff";
        } else {
            xCalendar.xtag.dragType = DRAG_ADD;
            toggleEventName = "datetoggleon";
        }
        xCalendar.xtag.dragStartEl = day;
        xCalendar.xtag.dragAllowTap = true;
        if (!xCalendar.noToggle) {
            xtag.fireEvent(xCalendar, toggleEventName, {
                detail: {
                    date: dateObj,
                    iso: isoDate
                }
            });
        }
        xCalendar.setAttribute("active", true);
        day.setAttribute("active", true);
    }
    function _onDragMove(xCalendar, day) {
        var isoDate = day.getAttribute("data-date");
        var dateObj = parseSingleDate(isoDate);
        if (day !== xCalendar.xtag.dragStartEl) {
            xCalendar.xtag.dragAllowTap = false;
        }
        if (!xCalendar.noToggle) {
            if (xCalendar.xtag.dragType === DRAG_ADD && !hasClass(day, CHOSEN_CLASS)) {
                xtag.fireEvent(xCalendar, "datetoggleon", {
                    detail: {
                        date: dateObj,
                        iso: isoDate
                    }
                });
            } else if (xCalendar.xtag.dragType === DRAG_REMOVE && hasClass(day, CHOSEN_CLASS)) {
                xtag.fireEvent(xCalendar, "datetoggleoff", {
                    detail: {
                        date: dateObj,
                        iso: isoDate
                    }
                });
            }
        }
        if (xCalendar.xtag.dragType) {
            day.setAttribute("active", true);
        }
    }
    function _onDragEnd() {
        var xCalendars = xtag.query(document, "x-calendar");
        for (var i = 0; i < xCalendars.length; i++) {
            var xCalendar = xCalendars[i];
            xCalendar.xtag.dragType = null;
            xCalendar.xtag.dragStartEl = null;
            xCalendar.xtag.dragAllowTap = false;
            xCalendar.removeAttribute("active");
        }
        var days = xtag.query(document, "x-calendar .day[active]");
        for (var j = 0; j < days.length; j++) {
            days[j].removeAttribute("active");
        }
    }
    function _pointIsInRect(x, y, rect) {
        return rect.left <= x && x <= rect.right && rect.top <= y && y <= rect.bottom;
    }
    var DOC_MOUSEUP_LISTENER = null;
    var DOC_TOUCHEND_LISTENER = null;
    xtag.register("x-calendar", {
        lifecycle: {
            created: function() {
                this.innerHTML = "";
                var chosenRange = this.getAttribute("chosen");
                this.xtag.calObj = new Calendar({
                    span: this.getAttribute("span"),
                    view: parseSingleDate(this.getAttribute("view")),
                    chosen: parseMultiDates(chosenRange),
                    multiple: this.hasAttribute("multiple"),
                    firstWeekdayNum: this.getAttribute("first-weekday-num")
                });
                appendChild(this, this.xtag.calObj.el);
                this.xtag.calControls = null;
                this.xtag.dragType = null;
                this.xtag.dragStartEl = null;
                this.xtag.dragAllowTap = false;
            },
            inserted: function() {
                if (!DOC_MOUSEUP_LISTENER) {
                    DOC_MOUSEUP_LISTENER = xtag.addEvent(document, "mouseup", _onDragEnd);
                }
                if (!DOC_TOUCHEND_LISTENER) {
                    DOC_TOUCHEND_LISTENER = xtag.addEvent(document, "touchend", _onDragEnd);
                }
                this.render(false);
            },
            removed: function() {
                if (xtag.query(document, "x-calendar").length === 0) {
                    if (DOC_MOUSEUP_LISTENER) {
                        xtag.removeEvent(document, "mouseup", DOC_MOUSEUP_LISTENER);
                        DOC_MOUSEUP_LISTENER = null;
                    }
                    if (DOC_TOUCHEND_LISTENER) {
                        xtag.removeEvent(document, "touchend", DOC_TOUCHEND_LISTENER);
                        DOC_TOUCHEND_LISTENER = null;
                    }
                }
            }
        },
        events: {
            "tap:delegate(.next)": function(e) {
                var xCalendar = e.currentTarget;
                xCalendar.nextMonth();
                xtag.fireEvent(xCalendar, "nextmonth");
            },
            "tap:delegate(.prev)": function(e) {
                var xCalendar = e.currentTarget;
                xCalendar.prevMonth();
                xtag.fireEvent(xCalendar, "prevmonth");
            },
            "tapstart:delegate(.day)": function(e) {
                if (!e.touches && e.button && e.button !== LEFT_MOUSE_BTN) {
                    return;
                }
                e.preventDefault();
                if (e.baseEvent) {
                    e.baseEvent.preventDefault();
                }
                _onDragStart(e.currentTarget, this);
            },
            touchmove: function(e) {
                if (!(e.touches && e.touches.length > 0)) {
                    return;
                }
                var xCalendar = e.currentTarget;
                if (!xCalendar.xtag.dragType) {
                    return;
                }
                var touch = e.touches[0];
                var days = xtag.query(xCalendar, ".day");
                for (var i = 0; i < days.length; i++) {
                    var day = days[i];
                    if (_pointIsInRect(touch.pageX, touch.pageY, getRect(day))) {
                        _onDragMove(xCalendar, day);
                    } else {
                        day.removeAttribute("active");
                    }
                }
            },
            "mouseover:delegate(.day)": function(e) {
                var xCalendar = e.currentTarget;
                var day = this;
                _onDragMove(xCalendar, day);
            },
            "mouseout:delegate(.day)": function() {
                var day = this;
                day.removeAttribute("active");
            },
            "tapend:delegate(.day)": function(e) {
                var xCalendar = e.currentTarget;
                if (!xCalendar.xtag.dragAllowTap) {
                    return;
                }
                var day = this;
                var isoDate = day.getAttribute("data-date");
                var dateObj = parseSingleDate(isoDate);
                xtag.fireEvent(xCalendar, "datetap", {
                    detail: {
                        date: dateObj,
                        iso: isoDate
                    }
                });
            },
            datetoggleon: function(e) {
                var xCalendar = this;
                xCalendar.toggleDateOn(e.detail.date, xCalendar.multiple);
            },
            datetoggleoff: function(e) {
                var xCalendar = this;
                xCalendar.toggleDateOff(e.detail.date);
            }
        },
        accessors: {
            controls: {
                attribute: {
                    "boolean": true
                },
                set: function(hasControls) {
                    if (hasControls && !this.xtag.calControls) {
                        this.xtag.calControls = makeControls(this.xtag.calObj.labels);
                        appendChild(this, this.xtag.calControls);
                    }
                }
            },
            multiple: {
                attribute: {
                    "boolean": true
                },
                get: function() {
                    return this.xtag.calObj.multiple;
                },
                set: function(multi) {
                    this.xtag.calObj.multiple = multi;
                    this.chosen = this.chosen;
                }
            },
            span: {
                attribute: {},
                get: function() {
                    return this.xtag.calObj.span;
                },
                set: function(newCalSpan) {
                    this.xtag.calObj.span = newCalSpan;
                }
            },
            view: {
                attribute: {},
                get: function() {
                    return this.xtag.calObj.view;
                },
                set: function(newView) {
                    var parsedDate = parseSingleDate(newView);
                    if (parsedDate) {
                        this.xtag.calObj.view = parsedDate;
                    }
                }
            },
            chosen: {
                attribute: {
                    skip: true
                },
                get: function() {
                    var chosenRanges = this.xtag.calObj.chosen;
                    if (!this.multiple) {
                        if (chosenRanges.length > 0) {
                            var firstRange = chosenRanges[0];
                            if (isValidDateObj(firstRange)) {
                                return firstRange;
                            } else {
                                return firstRange[0];
                            }
                        } else {
                            return null;
                        }
                    } else {
                        return this.xtag.calObj.chosen;
                    }
                },
                set: function(newDates) {
                    var parsedDateRanges = this.multiple ? parseMultiDates(newDates) : parseSingleDate(newDates);
                    if (parsedDateRanges) {
                        this.xtag.calObj.chosen = parsedDateRanges;
                    } else {
                        this.xtag.calObj.chosen = null;
                    }
                    if (this.xtag.calObj.chosenString) {
                        this.setAttribute("chosen", this.xtag.calObj.chosenString);
                    } else {
                        this.removeAttribute("chosen");
                    }
                }
            },
            firstWeekdayNum: {
                attribute: {
                    name: "first-weekday-num"
                },
                set: function(weekdayNum) {
                    this.xtag.calObj.firstWeekdayNum = weekdayNum;
                }
            },
            noToggle: {
                attribute: {
                    "boolean": true,
                    name: "notoggle"
                },
                set: function(toggleDisabled) {
                    if (toggleDisabled) {
                        this.chosen = null;
                    }
                }
            },
            firstVisibleMonth: {
                get: function() {
                    return this.xtag.calObj.firstVisibleMonth;
                }
            },
            lastVisibleMonth: {
                get: function() {
                    return this.xtag.calObj.lastVisibleMonth;
                }
            },
            firstVisibleDate: {
                get: function() {
                    return this.xtag.calObj.firstVisibleDate;
                }
            },
            lastVisibleDate: {
                get: function() {
                    return this.xtag.calObj.lastVisibleDate;
                }
            },
            customRenderFn: {
                get: function() {
                    return this.xtag.calObj.customRenderFn;
                },
                set: function(newRenderFn) {
                    this.xtag.calObj.customRenderFn = newRenderFn;
                }
            },
            labels: {
                get: function() {
                    return JSON.parse(JSON.stringify(this.xtag.calObj.labels));
                },
                set: function(newLabelData) {
                    this.xtag.calObj.labels = newLabelData;
                    var labels = this.xtag.calObj.labels;
                    var prevControl = this.querySelector(".controls > .prev");
                    if (prevControl) {
                        prevControl.textContent = labels.prev;
                    }
                    var nextControl = this.querySelector(".controls > .next");
                    if (nextControl) {
                        nextControl.textContent = labels.next;
                    }
                }
            }
        },
        methods: {
            render: function(preserveNodes) {
                this.xtag.calObj.render(preserveNodes);
            },
            prevMonth: function() {
                var calObj = this.xtag.calObj;
                calObj.view = prevMonth(calObj.view);
            },
            nextMonth: function() {
                var calObj = this.xtag.calObj;
                calObj.view = nextMonth(calObj.view);
            },
            toggleDateOn: function(newDateObj, append) {
                this.xtag.calObj.addDate(newDateObj, append);
                this.chosen = this.chosen;
            },
            toggleDateOff: function(dateObj) {
                this.xtag.calObj.removeDate(dateObj);
                this.chosen = this.chosen;
            },
            toggleDate: function(dateObj, appendIfAdd) {
                if (this.xtag.calObj.hasChosenDate(dateObj)) {
                    this.toggleDateOff(dateObj);
                } else {
                    this.toggleDateOn(dateObj, appendIfAdd);
                }
            },
            hasVisibleDate: function(dateObj, excludeBadMonths) {
                return this.xtag.calObj.hasVisibleDate(dateObj, excludeBadMonths);
            }
        }
    });
})();