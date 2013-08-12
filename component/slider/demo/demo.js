function updateDemoSect(demoSect){
    var slider = demoSect.querySelector("x-slider");
    var proplist = demoSect.querySelector('.proplist');
    if(slider && proplist){
        var propNames = ["value", "min", "max", "step", "polyfill"];
        var propStr = DemoHelpers.getPropertiesString(slider, propNames);
        DemoHelpers.updatePrettyprintEl(proplist, propStr);
    }
}

function getEventCounter(eventDemo){
    var nativeSlider = eventDemo.querySelector("x-slider:first-of-type");
    var polyfillSlider = eventDemo.querySelector("x-slider:last-of-type");
    var keys = ["nativechange", "nativeinput", "polychange", "polyinput"];

    var toKeyFn = function(e, slider){
        if(e.type !== "change" && e.type !== "input") return;
        if(slider!== nativeSlider && slider !== polyfillSlider) return;
        return ((slider === nativeSlider) ? "native" : "poly") + e.type;
    };

    var toStrFn = function(counters){
        return [
            "<x-slider> input fired " + counters.nativeinput + " times",
            "<x-slider> change fired " + counters.nativechange + " times",
            "<x-slider polyfill> input fired " + counters.polyinput + " times",
            "<x-slider polyfill> change fired " + counters.polychange + " times"
        ].join("\n");
    };

    return new DemoHelpers.EventCounter(keys, toKeyFn, toStrFn);
}

document.addEventListener('DOMComponentsLoaded', function(){
    var supportsNative = DemoHelpers.hasNativeInputTypeSupport('range');
    var msgEl = document.getElementById("native-support-msg");
    msgEl.innerHTML = "<code class='prettyprint'>" +
                     "&lt;input type='range'&gt;</code> is <b>" + 
                     ((supportsNative) ? "" : " NOT") +
                     " natively</b> supported by this browser, so all "+
                     "<code class='prettyprint'>&lt;x-slider&gt;</code>"+
                     " demos will use a <b>" + 
                     ((supportsNative) ? "native" : "polyfill") + " UI</b>.";


    var eventDemo = document.getElementById("event-demo");
    var eventCounter = getEventCounter(eventDemo);
    xtag.addEvent(eventDemo, "input:delegate(x-slider)", function(e){
        eventCounter.updateCounter(e, this);
    });

    xtag.addEvent(eventDemo, "change:delegate(x-slider)", function(e){
        eventCounter.updateCounter(e, this);
    });

    xtag.addEvent(document, "update-demo:delegate("+DemoHelpers.DEMO_SECT_SELECTOR+")", function(e){
        var demoSect = this;
        updateDemoSect(demoSect);

        if(demoSect === eventDemo){
            var eventEl = demoSect.querySelector(".events");
            DemoHelpers.updatePrettyprintEl(eventEl, eventCounter.toString());
        }
    });

    DemoHelpers.registerUpdateListeners(["input", "change"]);
    DemoHelpers.initializeDemos();
});