function updateDemoSect(demoSect){
    var datepicker = demoSect.querySelector("x-datepicker");
    var proplist = demoSect.querySelector('.proplist');
    if(datepicker && proplist){
        var propNames = ["value", "submitValue", "polyfill"];
        var propStr = DemoHelpers.getPropertiesString(datepicker, propNames);
        DemoHelpers.updatePrettyprintEl(proplist, propStr);
    }
}

function getInitEventCounter(eventDemo){
    var nativeElem = eventDemo.querySelector("x-datepicker:first-of-type");
    var polyfillElem = eventDemo.querySelector("x-datepicker:last-of-type");
    var keys = ["nativeinput", "nativechange", "polyinput", "polychange"];
    var toKeyFn = function(e, elem){
        if(e.type !== "input" && e.type !== "change") return;
        if(elem !== nativeElem && elem !== polyfillElem) return;
        return ((elem === nativeElem) ? "native" : "poly") + e.type;
    };

    var toStrFn = function(counters){
        return [
            "<x-datepicker> input fired " + counters.nativeinput + " times",
            "<x-datepicker> change fired " + counters.nativechange + " times",
            "<x-datepicker polyfill> input fired " + counters.polyinput + " times",
            "<x-datepicker polyfill> change fired " + counters.polychange + " times"
        ].join("\n");
    };

    return new DemoHelpers.EventCounter(keys, toKeyFn, toStrFn);
}

document.addEventListener('DOMComponentsLoaded', function(){
    var supportsNative = DemoHelpers.hasNativeInputTypeSupport("date");
    var msgEl = document.getElementById("native-support-msg");
    msgEl.innerHTML = "<code class='prettyprint'>" +
                     "&lt;input type='date'&gt;</code> is <b>" + 
                     ((supportsNative) ? "" : " NOT") +
                     " natively</b> supported by this browser, so all "+
                     "<code class='prettyprint'>&lt;x-datepicker&gt;</code>"+
                     " demos will use a <b>" + 
                     ((supportsNative) ? "native" : "polyfill") + " UI</b>.";

    var eventDemo = document.getElementById("event-demo");
    var eventCounter = getInitEventCounter(eventDemo);

    xtag.addEvent(eventDemo, "input:delegate(x-datepicker)", function(e){
        eventCounter.updateCounter(e, this);
    });
    xtag.addEvent(eventDemo, "change:delegate(x-datepicker)", function(e){
        eventCounter.updateCounter(e, this);
    });

    xtag.addEvent(document, "update-demo:delegate("+DemoHelpers.DEMO_SECT_SELECTOR+")", function(e){
        var demoSect = this;
        if(demoSect === eventDemo){
            var eventEl = demoSect.querySelector(".events");
            DemoHelpers.updatePrettyprintEl(eventEl, eventCounter.toString());
        }
        updateDemoSect(demoSect);
    });

    DemoHelpers.registerUpdateListeners(["input", "change"]);
    DemoHelpers.initializeDemos();
});