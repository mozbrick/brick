(function(){
    // dataUrl for a 1x1 transparent gif
    var EMPTY_SRC = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
    var IMG_NODE_NAME = document.createElement("img").nodeName;
    var DEFAULT_TEXT_GETTER = function(iconButton){
                                 return iconButton.xtag.labelEl.textContent;
                              };
    var DEFAULT_TEXT_SETTER = function(iconButton, newText){
                                  iconButton.xtag.labelEl.textContent = newText;
                              };
    
    
    // hides/unhides parts of the button depending on if they have any content, 
    // also removes image source if explicitly given a null/empty src
    function updatePartsVisibility(elem, iconSrc){
        // if the icon is an img tag, modify based on its img src
        
        if(elem.xtag.iconEl.nodeName === IMG_NODE_NAME){
            iconSrc = (iconSrc !== undefined) ? iconSrc : elem.xtag.iconEl.src;
            // replace image with empty source if given an empty source
            if(!iconSrc){
                elem.xtag.iconEl.src = EMPTY_SRC;
            }
            
            // only show if given a valid source that is not empty
            elem.xtag.iconEl.style.display = 
                (iconSrc && iconSrc !== EMPTY_SRC) ? "" : "none";
        }
        // if the icon isn't an img tag, modify based on its innerHTML
        else{
            elem.xtag.iconEl.style.display = 
                (elem.xtag.iconEl.innerHTML) ? "" : "none";
        }
        
        elem.xtag.labelEl.style.display = 
            (elem.xtag.labelEl.innerHTML) ? "" : "none";
    }
    
    // updates the html layout order of the icon and label to match any given
    // anchors
    function updatePartsOrder(elem){
        var icon = elem.xtag.iconEl;
        var label = elem.xtag.labelEl;
        if(!(label && icon)) return;
        
        switch(elem.iconAnchor){
            // icon goes after label
            case "right":
            case "bottom":
                elem.insertBefore(label, icon);
                break;
            
            //icon goes before label
            //case "left":
            //case "top":
            default:
                elem.insertBefore(icon, label);
                break;
        }
    }
    
    function _deactivateButtons(e){
        console.log(e.type);
        xtag.query(document, "x-iconbutton[active]").forEach(function(button){
            button.removeAttribute("active");
        });

        xtag.query(document, "x-iconbutton:focus").forEach(function(button){
            button.blur();
        });
    }

    var DOC_LISTENER_FNS = null;

    xtag.register("x-iconbutton", {
        lifecycle:{
            // creates a <button> element with top-level <figure> wrapper for 
            // the icon's <img> element
            // and a <span> element for the label
            created: function(){
                this.xtag.iconEl = document.createElement('img');
                this.xtag.labelEl = document.createElement('span');
                
                // provide classes to expose certain elements and allow
                // users to hook in their own styles
                xtag.addClass(this.xtag.iconEl, "x-iconbutton-icon");
                xtag.addClass(this.xtag.labelEl, "x-iconbutton-label");
                
                // set up default getter and setters for modifying text content
                // default behavior: modify text directly
                if(!this.textGetter){
                    this.textGetter = DEFAULT_TEXT_GETTER;
                }
                if(!this.textSetter){
                    this.textSetter = DEFAULT_TEXT_SETTER;
                }
                
                // remove content and put into the label
                this.xtag.labelEl.innerHTML = this.innerHTML;
                this.innerHTML = "";
                
                // actually create the button
                this.appendChild(this.xtag.iconEl);
                this.appendChild(this.xtag.labelEl);
                
                updatePartsOrder(this);
                updatePartsVisibility(this);
            },
            inserted: function() {
                if(!DOC_LISTENER_FNS){
                    DOC_LISTENER_FNS = {
                        "tapend": xtag.addEvent(document, "tapend", 
                                                _deactivateButtons),
                        "dragend": xtag.addEvent(document, "dragend", 
                                                _deactivateButtons)
                    };
                }
                updatePartsOrder(this);
                updatePartsVisibility(this);
            },
            removed: function(){
                if(DOC_LISTENER_FNS && !document.query("x-calendar")){
                    for(var eventType in DOC_LISTENER_FNS){
                        xtag.removeEvent(document, eventType,
                                         DOC_LISTENER_FNS[eventType]);
                    }
                    DOC_LISTENER_FNS = null;
                }
            },
            attributeChanged: function(){
                updatePartsOrder(this);
                updatePartsVisibility(this);
            }
        },
        events: {
            "tapstart": function(e){
                e.currentTarget.setAttribute("active", true);
            }
        },
        accessors: {
            "src": {
                attribute: {},
                get: function(){
                    return this.xtag.iconEl.getAttribute("src");
                },
                set: function(newSrc){
                    this.xtag.iconEl.setAttribute("src", newSrc);
                    this.xtag.iconEl.src = newSrc;
                    updatePartsVisibility(this, newSrc);
                }
            },
            "iconAnchor": {
                attribute: {name: "icon-anchor"},
                set: function(newAnchor){
                    updatePartsOrder(this);
                }
            },
            "icon": {
                get: function(){
                    return this.xtag.iconEl;
                }
            },
            "label": {
                get: function(){
                    return this.xtag.labelEl;
                }
            },
            "text": {
                get: function(){
                    return this.textGetter(this);
                },
                set: function(newText){
                    this.textSetter(this, newText);
                }
            },
            // if the user defines a different label structure, it is up to them
            // to provide callback functions to correctly interface with the 
            // new label
            "textGetter": {
                get: function(){
                    return this.xtag.textGetter;
                },
                set: function(newGetter){
                    this.xtag.textGetter = newGetter;
                }
            },
            "textSetter": {
                get: function(){
                    return this.xtag.textSetter;
                },
                set: function(newSetter){
                    this.xtag.textSetter = newSetter;
                }
            }
        }
    });

})();