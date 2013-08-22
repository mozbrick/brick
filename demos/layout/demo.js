function updateDemoSect(demoSect){
    var markupEl = DemoHelpers.getMarkupEl(demoSect, "html");
    var contextEl = DemoHelpers.getContextEl(demoSect);

    var htmlMarkup = DemoHelpers.cleanHtmlSource(contextEl.innerHTML, 
                                               ["style", "content-maximizing"]);
    DemoHelpers.updatePrettyprintEl(markupEl, htmlMarkup);
}

document.addEventListener('DOMComponentsLoaded', function(){
    xtag.addEvent(document, "update-demo:delegate("+DemoHelpers.DEMO_SECT_SELECTOR+")", function(e){
        updateDemoSect(this);
    });

    DemoHelpers.initializeDemos();
});