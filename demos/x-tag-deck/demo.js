function getDeck(demoSect){
    return demoSect.querySelector("x-deck");
}

function updateDemoSect(demoSect, isInit){
    var deck = getDeck(demoSect);
    var markupEl = DemoHelpers.getMarkupEl(demoSect, "html");

    var ignoreAttrs = ["style", "reverse","selected","hide", "class"];
    // to indicate that initializing selected-index is not required
    if(isInit) ignoreAttrs.push("selected-index");

    var newHtml = DemoHelpers.cleanHtmlSource(deck.outerHTML, ignoreAttrs);
    // prettify html spacing for dynamically added elements
    newHtml = newHtml.replace(/>(\s*)<x-card/g, ">\n    <x-card");
    newHtml = newHtml.replace(/>(\s*)<\/x-deck/g, ">\n</x-deck");

    DemoHelpers.updatePrettyprintEl(markupEl, newHtml);
}

function initShuffleButtons(){
    // set up global shuffle prev handlers
    xtag.addEvent(document, "click:delegate("+DemoHelpers.BUTTON_SELECTOR+".prev)", function(e){
        var button = this;
        var demoSect = DemoHelpers.controlButtonToDemoSect(button);
        var deck = getDeck(demoSect);
        if(xtag.hasClass(button, "forward")){
            deck.previousCard("forward");
        }
        else if(xtag.hasClass(button, "reverse")){
            deck.previousCard("reverse");
        }
        else{
            deck.previousCard();
        }
    });

    // set up global shuffle next handlers
    xtag.addEvent(document, "click:delegate("+DemoHelpers.BUTTON_SELECTOR+".next)", function(e){
        var button = this;
        var demoSect = DemoHelpers.controlButtonToDemoSect(button);
        var deck = getDeck(demoSect);

        if(xtag.hasClass(button, "forward")){
            deck.nextCard("forward");
        }
        else if(xtag.hasClass(button, "reverse")){
            deck.nextCard("reverse");
        }
        else{
            deck.nextCard();
        }
    });

    // set up global shuffle to handlers
    xtag.addEvent(document, "click:delegate("+DemoHelpers.BUTTON_SELECTOR+".showCard)", function(e){
        var button = this;
        var demoSect = DemoHelpers.controlButtonToDemoSect(button);
        var deck = getDeck(demoSect);
        var target = button.getAttribute("target");
        if(target === null || isNaN(parseInt(target))) return;
        target = parseInt(target);

        if(xtag.hasClass(button, "forward")){
            deck.showCard(target, "forward");
        }
        else if(xtag.hasClass(button, "reverse")){
            deck.showCard(target, "reverse");
        }
        else{
            deck.showCard(target);
        }
    });
}

function initCardAddRemoveButtons(){
    xtag.addEvent(document, "click:delegate("+DemoHelpers.BUTTON_SELECTOR+".add)", function(e){
        var button = this;
        var demoSect = DemoHelpers.controlButtonToDemoSect(button);;
        var deck = getDeck(demoSect);

        // deck.numCards retrieves the number of cards currently in the deck
        var newIndex = deck.cards.length;
        var newCard = document.createElement("x-card");
        newCard.style.backgroundColor = DemoHelpers.randomColor();
        newCard.textContent = newIndex;
        deck.appendChild(newCard);
        if(!button.hasAttribute("noshuffle")){
            // for demo, shuffle to newly inserted card
            deck.showCard(newIndex);
        }
    });

    xtag.addEvent(document, "click:delegate("+DemoHelpers.BUTTON_SELECTOR+".remove)", function(e){
        var button = this;
        var demoSect = DemoHelpers.controlButtonToDemoSect(button);;
        var deck = getDeck(demoSect);
		var cards = deck.cards;
		var length = cards.length;
        if(length > 0){
            // deck.getCardAt retrieves the <x-card> at the given index
            var lastCard = cards[length-1];
            deck.removeChild(lastCard);            
        }
    });
}

function initRandomCardColors(){
    xtag.query(document, "x-card").forEach(function(card){
        card.style.backgroundColor = DemoHelpers.randomColor();
    });
}

function getInitEventCounter(eventDemo){
    var keys = ["show", "hide"];
    return new DemoHelpers.EventCounter(keys);
}

document.addEventListener('DOMComponentsLoaded', function(){

    var eventDemo = document.getElementById("shuffleevents-demo");
    var eventCounter = getInitEventCounter(eventDemo);
    var transitionDemo = document.getElementById("transition-demo");

    xtag.addEvent(document, "update-demo:delegate("+DemoHelpers.DEMO_SECT_SELECTOR+")", function(e){
        var demoSect = this;
        updateDemoSect(demoSect, e.detail && e.detail.init);

        if(demoSect === eventDemo){
            if(e.detail && e.detail.originalEvent){
                eventCounter.updateCounter(e.detail.originalEvent);
            }

            var eventsEl = eventDemo.querySelector(".markup-wrap .events");
            DemoHelpers.updatePrettyprintEl(eventsEl, eventCounter.toString());
        }

        if(demoSect === transitionDemo && 
            e.detail && e.detail.toggleProp === "transitionType")
        {
            var deck = demoSect.querySelector("x-deck");
            deck.nextCard("forward");
        }
    });

    DemoHelpers.initializeDemos();

    initShuffleButtons();
    initCardAddRemoveButtons();
    initRandomCardColors();
    DemoHelpers.registerUpdateListeners(["show", "hide"]);
});