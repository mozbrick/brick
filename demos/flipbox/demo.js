function updateDemoSect(demoSect){
    var contextEl = DemoHelpers.getContextEl(demoSect);
    var markupEl = DemoHelpers.getMarkupEl(demoSect, "html");

    var markup = DemoHelpers.cleanHtmlSource(contextEl.innerHTML, ["style", "_anim-direction"]);
    DemoHelpers.updatePrettyprintEl(markupEl, markup);
}

document.addEventListener('DOMComponentsLoaded', function(){
    xtag.addEvent(document, "update-demo:delegate("+DemoHelpers.DEMO_SECT_SELECTOR+")", function(e){
        updateDemoSect(this);
    });

    DemoHelpers.registerUpdateListeners(["flipend"]);
    DemoHelpers.initializeDemos();
});