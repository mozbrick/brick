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

function updateDemoSect(demoSect){
    var contextEl = DemoHelpers.getContextEl(demoSect);
    var markupEl = DemoHelpers.getMarkupEl(demoSect, "html");
    var calendar = demoSect.querySelector("x-calendar");

    if(contextEl && markupEl && calendar){
         // remove shadow dom internals
        var markup = contextEl.innerHTML.replace(calendar.innerHTML, "");
        markup = DemoHelpers.cleanHtmlSource(markup, ["active"])

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

        DemoHelpers.updatePrettyprintEl(markupEl, markup);
    }
}

function getInitEventsCounter(eventsDemo){
    var keys = ["datetoggleon", "datetoggleoff", "datetap", 
                "prevmonth", "nextmonth"];

    return new DemoHelpers.EventCounter(keys);
}

document.addEventListener('DOMComponentsLoaded', function(){
    var eventsDemo = document.getElementById("events-demo");
    var eventCounter = getInitEventsCounter(eventsDemo);

    xtag.addEvent(document, "update-demo:delegate("+DemoHelpers.DEMO_SECT_SELECTOR+")", function(e){
        var demoSect = this;
        if(demoSect === eventsDemo){
            if(e.detail && e.detail.originalEvent){
                eventCounter.updateCounter(e.detail.originalEvent);
            }
            // still update the markup even if no counter update is called
            var eventEl = demoSect.querySelector(".events");
            if(eventEl){
                DemoHelpers.updatePrettyprintEl(eventEl, 
                                                eventCounter.toString());
            }   
        }
        updateDemoSect(demoSect);
    });

    initSimpleCustomRenderDemo();
    initFrenchCalendar();
    initEventSchedulerDemo();

    DemoHelpers.registerUpdateListeners(["datetoggleon", "datetoggleoff", 
                                         "datetap", "prevmonth", "nextmonth"]);

    DemoHelpers.initializeDemos();
});