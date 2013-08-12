function dedentAll(source){
    // find the least amount of tabbing and dedent each line by that much
    var tabRegex = /\n(\s*?)(\S|\n)/g;
    var spacing = tabRegex.exec(source);
    if(spacing){
        var shortest = spacing[1].length;
        while(spacing){
            if(spacing[1].length < shortest){
                shortest = spacing[1].length;
            }
            spacing = tabRegex.exec(source);
        }
        if(shortest > 0){
            var dedentRegex = new RegExp("\\n\\s{"+shortest+"}", "g");
            source = source.replace(dedentRegex, "\n");
        }
    }
    return source;
}

function cleanHtmlSource(html, ignoreAttrs){
    // remove any attributes given in parameter, but only if they are
    // actually in a tag
    if(ignoreAttrs && ignoreAttrs.length){
        // no global flag, or we will over-skip through string
        var attrIgnoreRegex = new RegExp("(<[^>]*?\\s)(("+
                                         ignoreAttrs.join("|")+
                                         ")=\".*?\"\\s?)([^<]*?>)");
        var match = attrIgnoreRegex.exec(html);
        while(match){
            html = html.substr(0, match.index) + match[1] + match[4] + 
                   html.substr(match.index + match[0].length);
            match = attrIgnoreRegex.exec(html);
        }
        html = html.replace(/\s*>/g, ">");
    }
    
    html = dedentAll(html);
    // trim spacing from start/end of markup
    html = html.replace(/^\s*\n/, "");
    html = html.replace(/\n\s*$/, "");
    return html;
}


function updateHtmlMarkup(markupEl, contextEl, isInit){
    // remove shadow dom internals
    var calendar = contextEl.querySelector("x-calendar");
    var markup = contextEl.innerHTML.replace(calendar.innerHTML, "");
    markup = cleanHtmlSource(markup, ["active"])

    // special case to account for escaped json doublequote when 
    // retrieved from inner/outerHTML
    var r = /chosen="(.*?)"/;
    var match = r.exec(markup);
    if(match){
        var val = match[1];
        markup = markup.substring(0, match.index) + 
                 ((calendar.multiple) ? "\n    chosen='" : "chosen='") +
                 val.replace(/&quot;/g, '"') + "'" + 
                 markup.substring(match.index+match[0].length);
    }

    // remove empty attributes
    markup = markup.replace(/=""/g, "");

    markupEl.textContent = markup;
    xtag.removeClass(markupEl, "prettyprinted");
    if(!isInit) prettyPrint();
}

function getMarkupEl(demoSect){
    return demoSect.querySelector(".markup-wrap .html");
}

function getContextEl(demoSect){
    return demoSect.querySelector(".demo");
}

function getCalendar(demoSect){
    return demoSect.querySelector("x-calendar");
}

function initEventsDemo(){
    var demoSect = document.getElementById("events-demo");
    var calendar = getCalendar(demoSect);
    var trackerEl = demoSect.querySelector(".events-tracker");

    var eventsData = {
        "datetoggleon": 0,
        "datetoggleoff": 0,
        "datetap": 0,
        "prevmonth": 0,
        "nextmonth": 0
    };

    var _updateTrackerEl = function(isInit){
        var events = [];
        for(var eventName in eventsData){
            events.push(eventName + " fired " + eventsData[eventName] + " times");
        }
        trackerEl.textContent = events.join("\n");
        xtag.removeClass(trackerEl, "prettyprinted");
        if(!isInit) prettyPrint();
    };

    var _listenerUpdate = function(e){
        if(!(e.type in eventsData)) return;
        eventsData[e.type]++;
        _updateTrackerEl()
    };

    calendar.addEventListener("datetoggleon", _listenerUpdate);
    calendar.addEventListener("datetoggleoff", _listenerUpdate);
    calendar.addEventListener("datetap", _listenerUpdate);
    calendar.addEventListener("prevmonth", _listenerUpdate);
    calendar.addEventListener("nextmonth", _listenerUpdate);

    _updateTrackerEl(true);
}

function initFrenchCalendar(){
    var frenchCal = document.querySelector("x-calendar[lang=fr]");
    frenchCal.labels = {
        prev: "<<",
        next: ">>",
        months: ["janvier", "f\u00E9vrier", "mars", "avril", "mai", 
                 "juin", "juillet", "ao\u00FBt", "septembre", "octobre", 
                 "novembre", "d\u00E9cembre"],
        weekdays: ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"]
    };
}

function initSimpleCustomRenderDemo(){
    var cal = document.getElementById("custom-render-simple");
    cal.customRenderFn = function(dayEl, date, iso){
        // add selector to every 5th day in a month
        if(date.getDate() % 5 === 0){
            dayEl.setAttribute("dance-time", true);
        }
        else{
            dayEl.removeAttribute("dance-time");
        }
    };
}

function initEventSchedulerDemo(){
    /** set up custom event handling demo using provided API hooks **/

    // the dictionary of iso datestring keys mapped to event data
    var DATE_INFO = {};
    // the currently displayed date
    var CURR_ISO = null;

    // aliases for DOM manipulation
    var eventsStage = document.getElementById("scheduler-demo");
    var eventsCal = eventsStage.querySelector("x-calendar");
    var eventsDateHeader = document.getElementById("scheduler-date");
    var eventsInfo = document.getElementById("scheduler-info");
    var eventsSaveButton = document.getElementById("scheduler-save");

    // define a .customRenderFn that provides extra styling 
    // information for day elements with stored data
    eventsCal.customRenderFn = function(dayEl, date, isoStr){
        if(isoStr === CURR_ISO){
            xtag.addClass(dayEl, "scheduler-current");
        }
        else{
            xtag.removeClass(dayEl, "scheduler-current");
        }

        if(isoStr in DATE_INFO){
            dayEl.setAttribute("scheduler-has-info", true);
        }
        else{
            dayEl.removeAttribute("scheduler-has-info");
        }
    }

    // respond to calendar taps
    eventsCal.addEventListener("datetap", function(e){
        // grab date info from event as both a Date and a string
        var date = e.detail.date;
        var dateStr = e.detail.iso;
        // get dictionary content for this date
        var content = (dateStr && dateStr in DATE_INFO) ? 
                                        DATE_INFO[dateStr] : "";
        // set up text area                                                
        eventsInfo.value = content;
        eventsInfo.disabled = !dateStr;
        eventsSaveButton.disabled = !dateStr;
        // remember currently shown date
        CURR_ISO = dateStr;
        eventsDateHeader.textContent = (dateStr) ? dateStr : "None";
        // programmatically toggle date object with .toggleDateOn
        eventsCal.toggleDateOn(date);
        // forces rerender of calendar
        eventsCal.render();
    });

    // save button listener; simply adds textarea value to data
    eventsSaveButton.addEventListener("click", function(e){
        if(CURR_ISO){
            if(eventsInfo.value){
                DATE_INFO[CURR_ISO] = eventsInfo.value;
            }
            else{
                delete DATE_INFO[CURR_ISO];
            }
        }
        eventsCal.render();
    });
}

document.addEventListener('DOMComponentsLoaded', function(){
    xtag.addEvent(document, "datetoggleon:delegate(.demo-wrap)", function(e){
        var demoSect = this;
        var contextEl = getContextEl(demoSect);
        var markupEl = getMarkupEl(demoSect);
        if(contextEl && markupEl) updateHtmlMarkup(markupEl, contextEl);
    });

    xtag.addEvent(document, "datetoggleoff:delegate(.demo-wrap)", function(e){
        var demoSect = this;
        var contextEl = getContextEl(demoSect);
        var markupEl = getMarkupEl(demoSect);
        if(contextEl && markupEl) updateHtmlMarkup(markupEl, contextEl);
    });

    xtag.addEvent(document, "datetap:delegate(.demo-wrap)", function(e){
        var demoSect = this;
        var contextEl = getContextEl(demoSect);
        var markupEl = getMarkupEl(demoSect);
        if(contextEl && markupEl) updateHtmlMarkup(markupEl, contextEl);
    });

    xtag.query(document, '.demo-wrap').forEach(function(demoSect){
        var contextEl = getContextEl(demoSect);
        var markupEl = getMarkupEl(demoSect);
        if(contextEl && markupEl) updateHtmlMarkup(markupEl, contextEl);
    });

    initFrenchCalendar();
    initEventsDemo();
    initSimpleCustomRenderDemo();
    initEventSchedulerDemo();
    prettyPrint();
});