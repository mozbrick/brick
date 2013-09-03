// updates the trigger-style demo's content. also manages custom handlers for 
// trigger-style="custom" option
var updateTriggerStyleDemoContent = function(){
    var tooltip = document.getElementById("trigger-style-demo-tip");
    if(!tooltip) return function(){};
    
    var demoSect = tooltip.parentNode.parentNode.parentNode;
    var targetButton = demoSect.querySelector(".target-button span");

    var _toggleListener = function(){
        tooltip.toggle(); 
    };

    // update hidden status of custom source elements
    var _updateSourceVisibility = function(){
        xtag.query(demoSect, ".custom-source").forEach(function(customSourceEl){
            if(tooltip.triggerStyle === "custom"){
                customSourceEl.removeAttribute("hidden");
            }
            else{
                customSourceEl.setAttribute("hidden", "true");
            }
        });
    };

    return function(){
        var triggerStyle = tooltip.triggerStyle;

        if(triggerStyle !== "custom"){
            // remove custom toggle button handler first
            var customToggleButton = targetButton.querySelector("#custom-toggle-button");
            if(customToggleButton){
                customToggleButton.removeEventListener("click", _toggleListener);
            }

            // set normal text
            var cappedStyle = triggerStyle.charAt(0).toUpperCase() + 
                              triggerStyle.substring(1);
            targetButton.textContent = cappedStyle + " me!";
            tooltip.contentEl.textContent = cappedStyle + " somewhere else to hide!";
        }
        else{
            // set custom toggle button and add handler
            tooltip.contentEl.textContent = "Click the button again to hide!";
            targetButton.innerHTML = 
                    "<button id='custom-toggle-button'>Click me!</button>" +
                    "<br/>We are using custom handlers!";

            var customToggleButton = targetButton.querySelector("#custom-toggle-button");
            customToggleButton.addEventListener("click", _toggleListener);
        }

        _updateSourceVisibility();
    };
}();

function lineBreakTooltip(markup){
    var tooltipOpen = /<x-tooltip.*?>/.exec(markup);
    var tooltipClose = /<\/x-tooltip>/.exec(markup);
    var contentIndex = tooltipOpen.index + tooltipOpen[0].length;
    return (markup.substring(0, contentIndex) +  "\n    " + 
            markup.substring(contentIndex, tooltipClose.index) + "\n" +
            markup.substring(tooltipClose.index));
}

function updateDemoSect(demoSect, toggleProp){
    var contextEl = DemoHelpers.getContextEl(demoSect);
    var markupEl = DemoHelpers.getMarkupEl(demoSect, "html");

    var tooltip = contextEl.querySelector("x-tooltip");
    if(tooltip && toggleProp){
        switch(toggleProp){
            case "orientation":
                tooltip.contentEl.innerHTML = '<code>orientation="'+tooltip.orientation+'"</code>';
                break;
            case "targetSelector":
                tooltip.contentEl.innerHTML = '<code>target-selector="'+tooltip.targetSelector+'"</code>';
                break;
            case "triggerStyle":
                updateTriggerStyleDemoContent();
                break;
            default:
                break;
        }
    }

    var markup = contextEl.innerHTML;
    if(tooltip){
        markup = markup.replace(tooltip.innerHTML, tooltip.contentEl.innerHTML);
    }

    markup = DemoHelpers.cleanHtmlSource(markup, ["style", "_auto-orientation"]);
    markup = lineBreakTooltip(markup)
    DemoHelpers.updatePrettyprintEl(markupEl, markup);
}

document.addEventListener('DOMComponentsLoaded', function(){
    xtag.addEvent(document, "update-demo:delegate("+DemoHelpers.DEMO_SECT_SELECTOR+")", function(e){
        if(e.detail && e.detail.toggleProp){
            updateDemoSect(this, e.detail.toggleProp);
        }
        else{
            updateDemoSect(this);
        }
    });

    updateTriggerStyleDemoContent();
    DemoHelpers.initializeDemos();
});