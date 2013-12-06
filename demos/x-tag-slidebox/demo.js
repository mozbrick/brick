function updateDemoSect(demoSect){
    var contextEl = DemoHelpers.getContextEl(demoSect);
    var markupEl = DemoHelpers.getMarkupEl(demoSect, "html");

    var htmlMarkup = DemoHelpers.cleanHtmlSource(contextEl.innerHTML, ["style"]);
    DemoHelpers.updatePrettyprintEl(markupEl, htmlMarkup);
}

document.addEventListener('DOMComponentsLoaded', function(){
    xtag.addEvent(document, "update-demo:delegate("+DemoHelpers.DEMO_SECT_SELECTOR+")", function(e){
        updateDemoSect(this);
    });

    xtag.addEvent(document, "click:delegate("+DemoHelpers.BUTTON_SELECTOR+".prev)", function(e){
        var demoSect = DemoHelpers.controlButtonToDemoSect(this);
        var slidebox = demoSect.querySelector("x-slidebox");
        slidebox.slidePrevious();
        updateDemoSect(demoSect);
    });

    xtag.addEvent(document, "click:delegate("+DemoHelpers.BUTTON_SELECTOR+".next)", function(e){
        var demoSect = DemoHelpers.controlButtonToDemoSect(this);
        var slidebox = demoSect.querySelector("x-slidebox");
        slidebox.slideNext();
        updateDemoSect(demoSect);
    });

    xtag.addEvent(document, "click:delegate("+DemoHelpers.BUTTON_SELECTOR+".slideto)", function(e){
        var button = this;
        var demoSect = DemoHelpers.controlButtonToDemoSect(button);
        var slidebox = demoSect.querySelector("x-slidebox");
        slidebox.slideTo(parseInt(button.getAttribute("data-slide-target")));
        updateDemoSect(demoSect);
    });

    DemoHelpers.initializeDemos();
});