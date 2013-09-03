function updateDemoSect(demoSect){
    var contextEl = DemoHelpers.getContextEl(demoSect);
    var markupEl = DemoHelpers.getMarkupEl(demoSect, "html")
    var markup = contextEl.innerHTML;
    xtag.query(contextEl, "x-iconbutton").forEach(function(button){
        markup = markup.replace(button.innerHTML, 
                                button.contentEl.innerHTML);
    });

    markup = DemoHelpers.cleanHtmlSource(markup, ["tabindex"]);

    // space out icon button source into multiple lines
    var match = /^(<x-iconbutton.*?>)(\S[\s\S]*?\S)<\/x-iconbutton>/.exec(markup);
    if(match){
        var openTag = match[1];
        var content = match[2];
        markup = markup.substring(0, openTag.length) + "\n    " + 
                 markup.substring(openTag.length, 
                                  openTag.length+content.length) + "\n"+ 
                 markup.substring(openTag.length + content.length);
    }

    DemoHelpers.updatePrettyprintEl(markupEl, markup);
}

function initDomDemo(){
    var demoSect = document.getElementById("dom-demo");

    var iconElToggle = document.getElementById("iconel-edit-button");
    var contentElToggle = document.getElementById("contentel-edit-button");

    var iconButton = document.getElementById("dom-demo-button");

    iconElToggle.addEventListener("click", function(e){
        iconButton.iconEl.style.backgroundColor = DemoHelpers.randomColor();
        updateDemoSect(demoSect);
    });

    contentElToggle.addEventListener("click", function(e){
        iconButton.contentEl.innerHTML = "<code>"+DemoHelpers.randomWord(7)+"</code>";
        updateDemoSect(demoSect);
    });
}


document.addEventListener('DOMComponentsLoaded', function(){
    xtag.addEvent(document, "update-demo:delegate("+DemoHelpers.DEMO_SECT_SELECTOR+")", function(e){
        updateDemoSect(this);
    });

    initDomDemo();

    DemoHelpers.initializeDemos();
});