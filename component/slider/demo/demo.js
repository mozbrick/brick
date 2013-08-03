function hasNativeRangeSupport(){
    rangeInput = document.createElement("input");
    rangeInput.setAttribute("type", "range");

    return (rangeInput.type.toLowerCase() === "range");
}

function updateDemoSection(demoSect, skipPrettyprint){
    var slider = demoSect.querySelector("x-slider");
    var proplist = demoSect.querySelector('.proplist');
    if((!slider) || (!proplist)) return;

    proplist.textContent = [".value -> " + slider.value,
                            ".min -> " + slider.min,
                            ".max -> " + slider.max,
                            ".step -> " + slider.step,
                            ".polyfill -> " + slider.polyfill].join("\n");
    xtag.removeClass(proplist, "prettyprinted");
    if(!skipPrettyprint) prettyPrint(); 
}

document.addEventListener('DOMComponentsLoaded', function(){
    var supportsNative = hasNativeRangeSupport();
    var msgEl = document.getElementById("native-support-msg");
    msgEl.innerHTML = "<code class='prettyprint'>" +
                     "&lt;input type='range'&gt;</code> is <b>" + 
                     ((supportsNative) ? "" : " NOT") +
                     " natively</b> supported by this browser, so all "+
                     "<code class='prettyprint'>&lt;x-slider&gt;</code>"+
                     " demos will use a <b>" + 
                     ((supportsNative) ? "native" : "polyfill") + " UI</b>.";
    


    xtag.addEvent(document, "input:delegate(.demo-wrap)", function(e){
        updateDemoSection(this);
    });

    xtag.addEvent(document, "change:delegate(.demo-wrap)", function(e){
        updateDemoSection(this);
    });

    xtag.query(document, ".demo-wrap").forEach(function(demoSect){
        updateDemoSection(demoSect, true);
    });

    var form = document.querySelector("form");
    form.addEventListener("submit", function(e){
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
    prettyPrint();
});