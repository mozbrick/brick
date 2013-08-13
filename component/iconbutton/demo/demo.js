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

function updateHtmlMarkup(contextEl, markupEl, skipPrettyPrint, postprocessor){
    var button = contextEl.querySelector('x-iconbutton');
    var markup = contextEl.innerHTML;
    if(button){
        markup = markup.replace(button.innerHTML, 
                                button.contentEl.innerHTML);
    }
    markup = cleanHtmlSource(markup, ['tabindex']);

    markupEl.textContent = (postprocessor) ? postprocessor(markup) : markup;

    xtag.removeClass(markupEl, "prettyprinted");
    if(!skipPrettyPrint) prettyPrint();
}

function initIconDemo(){
    var demoSect = document.getElementById("icon-demo");
    var contextEl = demoSect.querySelector(".demo");
    var markupEl = demoSect.querySelector(".markup-wrap .html");
    var anchorButton = document.getElementById("anchor-edit-button");
    var srcButton = document.getElementById("src-edit-button");
    var iconButton = demoSect.querySelector("x-iconbutton");

    var anchors = ['left', 'top', 'right', 'bottom'];
    var srcs = ['firefox.png', 'http://placekitten.com/50', 
                'grounds_keeping_it_real_s1.gif'];

    anchorButton.addEventListener("click", function(e){
        iconButton.iconAnchor = nextItem(anchors, iconButton.iconAnchor);
        updateHtmlMarkup(contextEl, markupEl);
    });

    srcButton.addEventListener("click", function(e){
        iconButton.src = nextItem(srcs, iconButton.src);
        updateHtmlMarkup(contextEl, markupEl);
    });

    updateHtmlMarkup(contextEl, markupEl, true);
}

function randomColor(){
    var _randomVal = function(){
        return Math.floor(Math.random() * 256);
    }

    return "rgb("+_randomVal()+","+_randomVal()+","+_randomVal()+")";
}

function randomWord(len){
    var output = "";
    var aCode = "A".charCodeAt(0);
    for(var i=0; i < len; i++){
        var letterCode = aCode + Math.floor(Math.random() * 26);
        var letter = String.fromCharCode(letterCode);
        
        if(Math.random() > 0.5){
            letter = letter.toLowerCase();
        }
        output += letter;
    }
    return output;
}

function initDomDemo(){
    var demoSect = document.getElementById("dom-demo");
    var contextEl = demoSect.querySelector(".demo");
    var markupEl = demoSect.querySelector(".markup-wrap .html");

    var iconElToggle = document.getElementById("iconel-edit-button");
    var contentElToggle = document.getElementById("contentel-edit-button");

    var _postprocessor = function(markup){
        var match = /^<x-iconbutton.*?>/.exec(markup);
        markup = markup.substring(0, match[0].length) + "\n    " + 
                 markup.substring(match[0].length);
        markup = markup.replace("</x-iconbutton>", "\n</x-iconbutton>");
        return markup;
    };

    var iconButton = document.getElementById("dom-demo-button");
    iconElToggle.addEventListener("click", function(e){
        iconButton.iconEl.style.backgroundColor = randomColor();
        updateHtmlMarkup(contextEl, markupEl, null, _postprocessor);
    });

    contentElToggle.addEventListener("click", function(e){
        iconButton.contentEl.style.color = randomColor();
        iconButton.contentEl.innerHTML = "<code>"+randomWord(7)+"</code>";
        updateHtmlMarkup(contextEl, markupEl, null, _postprocessor);
    });

    updateHtmlMarkup(contextEl, markupEl, true, _postprocessor);
}

document.addEventListener('DOMComponentsLoaded', function(){
    initIconDemo();
    initDomDemo();
    prettyPrint();
});