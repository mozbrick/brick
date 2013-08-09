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
    // remove blank attribute values (TODO: more complex regex to catch more 
    //  edge cases involving content)
    html = html.replace(/=""/g, "");

    // remove comments
    html = html.replace(/<!--.*?-->/g, "");
    
    html = dedentAll(html);
    // trim spacing from start/end of markup
    html = html.replace(/^\s*\n/, "");
    html = html.replace(/\n\s*$/, "");
    return html;
}

function getFormString(formEl){
    // retrieves all _actual_ <input> elements (ie: not fake polyfills)
    var inputElems = e.currentTarget.elements;
    var vals = [];
    for (var i = 0; i < inputElems.length; i++) {
        var input = inputElems[i];
        if(!input.name) continue;
        if((input.type === "radio" || input.type === "checkbox") &&
            (!input.checked))
        {
            continue;
        }

        vals.push(encodeURIComponent(input.name) + "=" + 
                  encodeURIComponent(input.value));
    }
    return vals.join("&");
}

// defaults to first item if given item is not in list
function nextItem(items, prevItem){
    if(items.length === 0) return null;
    var index = items.indexOf(prevItem);
    return items[(index+1) % items.length];
}

function updatePrettyprintEl(prettyprintEl, rawContent){
    prettyprintEl.textContent = rawContent;
    prettyprintEl.innerHTML = prettyPrintOne(prettyprintEl.innerHTML);
    xtag.addClass(prettyprintEl, "prettyprinted");
}

function getMarkupEl(demoSect, lang){
    return demoSect.querySelector(".markup-wrap ."+lang);
}

function getContextEl(demoSect){
    return demoSect.querySelector(".demo");
}

// prevent submission of any demo forms
document.addEventListener('DOMComponentsLoaded', function(){
     xtag.addEvent(document, "submit:delegate(.demo form)", function(e){
        alert(getFormString(e.target));
        e.preventDefault();
        e.stopPropagation();
    });
});