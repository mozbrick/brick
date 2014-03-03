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
    
    xtag.addEvent(document, 'tap:delegate(button[hide-trigger])', function(e){
      xtag.query(this.parentNode, 'button').forEach(function(el){
        xtag.removeClass(el, 'active');
      });
      xtag.addClass(this, 'active');
      this.parentNode.parentNode.previousElementSibling.querySelector('x-layout').setAttribute('hide-trigger', this.getAttribute('hide-trigger'));
      xtag.fireEvent(this, 'update-demo');
    });
    
    DemoHelpers.initializeDemos();
});