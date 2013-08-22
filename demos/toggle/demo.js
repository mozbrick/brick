function updateDemoSect(demoSect){
    var markupEl = DemoHelpers.getMarkupEl(demoSect, "html");
    var contextEl = DemoHelpers.getContextEl(demoSect);
    var rawHtml = contextEl.innerHTML;

    // remove shadow DOM from markup
    xtag.query(contextEl, "x-toggle").forEach(function(toggle){
        rawHtml = rawHtml.replace(toggle.innerHTML, "");
    });
    var ignoreAttrs = ["x-toggle-no-form", "type"];

    DemoHelpers.updatePrettyprintEl(markupEl, DemoHelpers.cleanHtmlSource(rawHtml, ignoreAttrs));
}

document.addEventListener('DOMComponentsLoaded', function(){
    xtag.addEvent(document, "update-demo:delegate("+DemoHelpers.DEMO_SECT_SELECTOR+")", function(e){
        updateDemoSect(this);
    });

    xtag.addEvent(document, "change:delegate("+DemoHelpers.DEMO_SECT_SELECTOR+")", function(e){
        updateDemoSect(this);
    });

    DemoHelpers.initializeDemos();
});