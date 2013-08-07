function hasNativeDateSupport(){
    rangeInput = document.createElement("input");
    rangeInput.setAttribute("type", "date");

    return (rangeInput.type.toLowerCase() === "date");
}

function updatePropertyList(demoSect, skipPrettyprint){
    var datepicker = demoSect.querySelector("x-datepicker");
    var proplist = demoSect.querySelector('.proplist');
    if((!datepicker) || (!proplist)) return;

    var propNames = ["value", "submitValue", "polyfill"];
    var propKeys = [];
    for(var i = 0; i < propNames.length; i++){
        var propName = propNames[i];
        var val = datepicker[propName];
        if(typeof(val) === "string") val = '"'+val+'"';
        propKeys.push("." + propName + " -> " + val);
    }

    proplist.textContent = propKeys.join("\n");
    xtag.removeClass(proplist, "prettyprinted");
    if(!skipPrettyprint) prettyPrint(); 
}


var updateEventsDemo = function(){
    var nativeCounters = {
        "change": 0,
        "input": 0
    };
    var polyfillCounters = {
        "change": 0,
        "input": 0
    };
    var eventDemo = document.getElementById("event-demo");
    var markupEl = eventDemo.querySelector(".events");
    var nativeElem = eventDemo.querySelector("x-datepicker:first-of-type");
    var polyfillElem = eventDemo.querySelector("x-datepicker:last-of-type");
    return function(datepicker, eventType){
        if(eventType !== undefined && 
           (datepicker === nativeElem || datepicker === polyfillElem))
        {
            var isPolyfill = (datepicker === polyfillElem);
            var counters = (isPolyfill) ? polyfillCounters : nativeCounters;
            if(!(eventType in counters)){
                return;
            }
            counters[eventType]++;
        }
        markupEl.textContent = "<x-datepicker> input count: " + 
                                nativeCounters.input + 
                                "\n<x-datepicker> change count: " + 
                                nativeCounters.change + 
                                "\n<x-datepicker polyfill> input count: " + 
                                polyfillCounters.input + 
                                "\n<x-datepicker polyfill> change count: " + 
                                polyfillCounters.change;
    }
}();

document.addEventListener('DOMComponentsLoaded', function(){
    var supportsNative = hasNativeDateSupport();
    var msgEl = document.getElementById("native-support-msg");
    msgEl.innerHTML = "<code class='prettyprint'>" +
                     "&lt;input type='date'&gt;</code> is <b>" + 
                     ((supportsNative) ? "" : " NOT") +
                     " natively</b> supported by this browser, so all "+
                     "<code class='prettyprint'>&lt;x-datepicker&gt;</code>"+
                     " demos will use a <b>" + 
                     ((supportsNative) ? "native" : "polyfill") + " UI</b>.";

    xtag.query(document, ".demo-wrap").forEach(function(demoSect){
        updatePropertyList(demoSect, true);
    });

    xtag.addEvent(document, "input:delegate(.demo-wrap)", function(e){
        updateEventsDemo(e.target, "input");
        updatePropertyList(this);
    });

    xtag.addEvent(document, "change:delegate(.demo-wrap)", function(e){
        updateEventsDemo(e.target, "change");
        updatePropertyList(this);
    });

    var form = document.querySelector("form");
    form.addEventListener("submit", function(e){
        // retrieves all _actual_ <input> elements (ie: not fake polyfills)
        var inputElems = e.currentTarget.elements;
        var vals = "";
        for (var i = 0; i < inputElems.length; i++) {
            var input = inputElems[i];
            if(!input.name) break;

            vals += encodeURIComponent(input.name) + "=" + 
                    encodeURIComponent(input.value);
        }
        alert("submitted: " + vals);
        e.preventDefault();
        e.stopPropagation();
    });
    updateEventsDemo();
    prettyPrint();
});