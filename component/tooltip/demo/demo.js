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

function lineBreakTooltip(markup){
    var tooltipOpen = /<x-tooltip.*?>/.exec(markup);
    var tooltipClose = /<\/x-tooltip>/.exec(markup);
    var contentIndex = tooltipOpen.index + tooltipOpen[0].length;
    return (markup.substring(0, contentIndex) +  "\n    " + 
            markup.substring(contentIndex, tooltipClose.index) + "\n" +
            markup.substring(tooltipClose.index));
}

function getTooltipMarkup(tooltip, contextEl, markupEl){
    var tooltipContentMarkup = tooltip.contentEl.innerHTML;
    var origTooltipMarkup = tooltip.outerHTML;
    // hide shadow DOM to display initializing markup
    var tooltipMarkup = origTooltipMarkup.replace(tooltip.innerHTML, 
                                                  tooltipContentMarkup);
    var markup = contextEl.innerHTML.replace(origTooltipMarkup, 
                                               tooltipMarkup);
    markup = cleanHtmlSource(markup, ["style", "_auto-orientation"]);
    markup = lineBreakTooltip(markup);
    return markup;
}

function updateMarkupElem(markupEl, markup, skipPrettyprint){
    markupEl.textContent = markup;
    xtag.removeClass(markupEl, "prettyprinted");
    if(!skipPrettyprint) prettyPrint();
}

// defaults to first item if given item is not in list
function nextItem(items, prevItem){
    if(items.length === 0) return null;
    var index = items.indexOf(prevItem);
    return items[(index+1) % items.length];
}

function initBasicDemo(){
    var demoContext = document.querySelector("#basic-demo .demo");
    var tooltip = document.querySelector("#basic-demo x-tooltip");
    var markupEl = document.querySelector("#basic-demo .markup-wrap .html");
    updateMarkupElem(markupEl, 
                     getTooltipMarkup(tooltip, demoContext, markupEl));
}

function initOrientationDemo(){
    var demoEl = document.getElementById("orientation-edit-demo");
    var toggleButton = document.getElementById("orientation-edit-button");
    var demoContext = demoEl.querySelector(".demo");
    var demoTip = demoEl.querySelector("x-tooltip");
    var markupEl = demoEl.querySelector(".markup-wrap .html");
    var orients = ["auto", "top", "left", "bottom", "right"];

    var _updateDemo = function(skipPrettyprint){
        demoTip.contentEl.innerHTML = '<code>orientation="'+
                                      demoTip.orientation+'"</code>';
        updateMarkupElem(markupEl, 
                         getTooltipMarkup(demoTip, demoContext, markupEl),
                         skipPrettyprint);
    };

    toggleButton.addEventListener("click", function(e){
        demoTip.orientation = nextItem(orients, demoTip.orientation)
        _updateDemo();
    });
    _updateDemo(true);
}

function initTargetSelectorDemo(){
    var demoEl = document.getElementById("target-edit-demo");
    var toggleButton = document.getElementById("target-edit-button");
    var demoContext = demoEl.querySelector(".demo");
    var demoTip = demoEl.querySelector("x-tooltip");
    var markupEl = demoEl.querySelector(".markup-wrap .html");
    var selectors = ["_previousSibling", "_nextSibling", ".sibling-demo img"];

    var _updateDemo = function(skipPrettyprint){
        demoTip.contentEl.innerHTML = '<code>target-selector="'+
                                       demoTip.targetSelector+
                                       '"</code>';
        updateMarkupElem(markupEl, 
                         getTooltipMarkup(demoTip, demoContext, markupEl),
                         skipPrettyprint);
    };

    toggleButton.addEventListener("click", function(){
        demoTip.targetSelector = nextItem(selectors, demoTip.targetSelector);
        _updateDemo();
    });

    _updateDemo(true);
}

function initTriggerStyleDemo(){
    var demoEl = document.getElementById("trigger-style-edit-demo");
    var toggleButton = document.getElementById("trigger-style-edit-button");
    var demoContext = demoEl.querySelector(".demo");
    var demoTip = demoEl.querySelector("x-tooltip");
    var markupEl = demoEl.querySelector(".markup-wrap .html");
    var jsWrapEl = demoEl.querySelector(".js-wrap");
    var jsMarkupEl = demoEl.querySelector(".markup-wrap .javascript");
    var styles = ["hover", "click", "touchstart", "custom"];

    var _toggleListener = function(){
        var tooltip = document.querySelector("#trigger-style-edit-demo x-tooltip");
        tooltip.toggle(); 
    };
    var _customToggleButton = null;

    var _updateDemo = function(skipPrettyprint){
        if(_customToggleButton){
            _customToggleButton.removeEventListener('click', _toggleListener);
            _customToggleButton.parentNode.removeChild(_customToggleButton);
            _customToggleButton = null;
        }

        var statusEl = demoContext.querySelector(".target-button:first-of-type span");
        if(demoTip.triggerStyle !== "custom"){
            var style = demoTip.triggerStyle;
            var capStyle = style.charAt(0).toUpperCase() + style.substring(1);
            statusEl.textContent = capStyle + " me!";
            demoTip.contentEl.textContent = capStyle + " somewhere else to hide!";
            jsWrapEl.setAttribute("hidden", true);
        }
        else{
            statusEl.innerHTML = "<button id='custom-toggle-button'>Click me!</button>" +
                                 "<br/>We are using custom handlers!";
            _customToggleButton = statusEl.querySelector("button");
            _customToggleButton.addEventListener("click", _toggleListener);
            demoTip.contentEl.innerHTML = "Wow! (Click the button again to hide)";
            jsWrapEl.removeAttribute("hidden");
        }

        var markup = getTooltipMarkup(demoTip, demoContext, markupEl);
        updateMarkupElem(markupEl, markup, skipPrettyprint);     
        var jsSource = dedentAll(_toggleListener.toString());
        jsSource = "document.getElementById('custom-toggle-button')"+
                    ".addEventListener('click', " + jsSource;
        updateMarkupElem(jsMarkupEl, jsSource, skipPrettyprint);
    };

    toggleButton.addEventListener("click", function(e){
        demoTip.triggerStyle = nextItem(styles, demoTip.triggerStyle)
        _updateDemo();
    });
    _updateDemo(true);
}


document.addEventListener('DOMComponentsLoaded', function(){
    initBasicDemo();
    initOrientationDemo();
    initTargetSelectorDemo();
    initTriggerStyleDemo();
    prettyPrint();
});