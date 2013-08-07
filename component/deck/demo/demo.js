function randomColor(alpha){
    var _randomVal = function(){
        return Math.floor(Math.random() * 256);
    }
    var type = (alpha) ? "rgba" : "rgb";
    var alphaStr = (alpha) ? ","+alpha : "";
    
    return type+"("+_randomVal()+","+_randomVal()+","+_randomVal()+alphaStr+")";
}

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

// defaults to first item if given item is not in list
function nextItem(items, prevItem){
    if(items.length === 0) return null;
    var index = items.indexOf(prevItem);
    return items[(index+1) % items.length];
}

function updateHtmlMarkup(deck, markupEl, isInit){
    var ignoreAttrs = ["style","card-anim-type","before-animation",
                        "reverse","selected","leaving", "class"];
    if(isInit) ignoreAttrs.push("selected-index");

    var newHtml = cleanHtmlSource(deck.outerHTML, ignoreAttrs);
    // prettify html spacing for dynamically added elements
    newHtml = newHtml.replace(/>(\s*)<x-card/g, ">\n    <x-card");
    newHtml = newHtml.replace(/>(\s*)<\/x-deck/g, ">\n</x-deck");

    markupEl.textContent = newHtml;
    xtag.removeClass(markupEl, "prettyprinted");
    if(!isInit) prettyPrint();
}

function getDeck(demoSect){
    return demoSect.querySelector("x-deck");
}

function getMarkupEl(demoSect){
    return demoSect.querySelector(".markup-wrap .html");
}

function updateEventsTracker(trackerEl, eventData, isInit){
    var events = [];
    for(var eventName in eventData){
        events.push(eventName + " fired " + eventData[eventName] + " times");
    }

    trackerEl.textContent = events.join("\n");
    if(!isInit){
        xtag.removeClass(trackerEl, "prettyprinted");
        prettyPrint();
    }
}

function initEventsDemo(){
    var demoSect = document.getElementById("shuffleevents-demo");
    var trackerEl = demoSect.querySelector(".events-tracker");
    var counts = {
        "shufflestart": 0,
        "shuffleend": 0
    };

    xtag.addEvent(demoSect, "shufflestart:delegate(x-deck)", function(e){
        counts.shufflestart++;
        updateEventsTracker(trackerEl, counts);
    });
    xtag.addEvent(demoSect, "shuffleend:delegate(x-deck)", function(e){
        counts.shuffleend++;
        updateEventsTracker(trackerEl, counts);
    });

    updateEventsTracker(trackerEl, counts, true);
}

document.addEventListener('DOMComponentsLoaded', function(){
    xtag.query(document, "x-card").forEach(function(card){
        card.style.backgroundColor = randomColor();
    });

    var baseButtonSelector = ".demo-wrap > .markup-wrap > button";

    xtag.addEvent(document, "click:delegate("+baseButtonSelector+".prev)", function(e){
        var button = this;
        var demoSect = button.parentNode.parentNode;
        var deck = getDeck(demoSect);
        if(xtag.hasClass(button, "forward")){
            deck.shufflePrev("forward");
        }
        else if(xtag.hasClass(button, "reverse")){
            deck.shufflePrev("reverse");
        }
        else{
            deck.shufflePrev();
        }
    });

    xtag.addEvent(document, "click:delegate("+baseButtonSelector+".next)", function(e){
        var button = this;
        var demoSect = button.parentNode.parentNode;
        var deck = getDeck(demoSect);

        if(xtag.hasClass(button, "forward")){
            deck.shuffleNext("forward");
        }
        else if(xtag.hasClass(button, "reverse")){
            deck.shuffleNext("reverse");
        }
        else{
            deck.shuffleNext();
        }
    });

    xtag.addEvent(document, "click:delegate("+baseButtonSelector+".shuffleto)", function(e){
        var button = this;
        var demoSect = button.parentNode.parentNode;
        var deck = getDeck(demoSect);
        var target = button.getAttribute("target");
        if(target === null || isNaN(parseInt(target))) return;
        target = parseInt(target);

        if(xtag.hasClass(button, "forward")){
            deck.shuffleTo(target, "forward");
        }
        else if(xtag.hasClass(button, "reverse")){
            deck.shuffleTo(target, "reverse");
        }
        else{
            deck.shuffleTo(target);
        }
    });

    xtag.addEvent(document, "click:delegate("+baseButtonSelector+".transition-type)", function(e){
        var button = this;
        var demoSect = button.parentNode.parentNode;
        var deck = getDeck(demoSect);

        var transitionTypes = [
            "scrollLeft", "scrollUp", "scrollRight", "scrollDown",
            "flipX", "flipY", 
            "coverLeft", "coverUp", "coverRight", "coverDown",
            "uncoverLeft", "uncoverUp", "uncoverRight", "uncoverDown",
            "none"
        ];

        deck.transitionType = nextItem(transitionTypes, deck.transitionType);
        deck.shuffleNext("forward");
    });

    xtag.addEvent(document, "click:delegate("+baseButtonSelector+".add)", function(e){
        var button = this;
        var demoSect = button.parentNode.parentNode;
        var deck = getDeck(demoSect);
        var markupEl = getMarkupEl(demoSect);

        // deck.numCards retrieves the number of cards currently in the deck
        var newIndex = deck.numCards;
        var newCard = document.createElement("x-card");
        newCard.style.backgroundColor = randomColor();
        newCard.textContent = newIndex;
        deck.appendChild(newCard);
        // for demo, shuffle to newly inserted card
        deck.shuffleTo(newIndex);
    });

    xtag.addEvent(document, "click:delegate("+baseButtonSelector+".remove)", function(e){
        var button = this;
        var demoSect = button.parentNode.parentNode;
        var deck = getDeck(demoSect);
        var markupEl = getMarkupEl(demoSect);

        if(deck.numCards > 0){
            // deck.getCardAt retrieves the <x-card> at the given index
            var lastCard = deck.getCardAt(deck.numCards-1);
            deck.removeChild(lastCard);            
        }
    });

    xtag.addEvent(document, "shufflestart:delegate(.demo-wrap > .two-up > .demo > x-deck)", function(e){
        var deck = this;
        var demoSect = deck.parentNode.parentNode.parentNode;
        var markupEl = demoSect.querySelector(".markup-wrap .html");
        updateHtmlMarkup(deck, markupEl);
    });

    xtag.addEvent(document, "shuffleend:delegate(.demo-wrap > .two-up > .demo > x-deck)", function(e){
        var deck = this;
        var demoSect = deck.parentNode.parentNode.parentNode;
        var markupEl = demoSect.querySelector(".markup-wrap .html");
        updateHtmlMarkup(deck, markupEl);
    });

    xtag.addEvent(document, "click:delegate("+baseButtonSelector+")", function(e){
        var button = this;
        var demoSect = button.parentNode.parentNode;
        var deck = getDeck(demoSect);
        var markupEl = getMarkupEl(demoSect);
        updateHtmlMarkup(deck, markupEl);
    });

    xtag.query(document, ".demo-wrap").forEach(function(demoSect){
        var deck = getDeck(demoSect);
        var markupEl = getMarkupEl(demoSect);
        updateHtmlMarkup(deck, markupEl, true);
    });

    initEventsDemo();

    prettyPrint();
});