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
    
    
    // hides/unhides parts of the button depending on if they have any content, also
    // removes image source if explicitly given a null/empty src
    function updatePartsVisibility(elem, iconSrc){
        // if the icon is an img tag, modify based on its img src
        
        if(elem.xtag.iconEl.nodeName === IMG_NODE_NAME){
            iconSrc = (iconSrc !== undefined) ? iconSrc : elem.xtag.iconEl.src;
            
            // replace image with empty source if given an empty source
            if(!iconSrc){
                elem.xtag.iconEl.src = EMPTY_SRC;
            }
            
            // only show if given a valid source that is not empty
            elem.xtag.iconWrapperEl.style.display = 
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
        var iconWrapper = elem.xtag.iconWrapperEl;
        var label = elem.xtag.labelEl;
        var button = elem.xtag.buttonEl;
        
        switch(elem.getAttribute('icon-anchor')){
            // icon goes after label
            case "right":
            case "bottom":
                button.insertBefore(label, iconWrapper);
                break;
            
            //icon goes before label
            //case "left":
            //case "top":
            default:
                button.insertBefore(iconWrapper, label);
                break;
        }
    }
    
    // replaces the element in the given category with the new element
    // useful for full replacements of button components
    function replaceComponentElement(xButtonElem, newElem, categoryName, elemClass){
        var oldElem = xButtonElem.xtag[categoryName];
        if(newElem instanceof HTMLElement){
            oldElem.parentNode.replaceChild(newElem, oldElem);
            
            // don't forget to change the xtag reference to the element
            xButtonElem.xtag[categoryName] = newElem;
            xtag.addClass(newElem, elemClass);
        }
        else{
            throw "Attempted to insert non HTML-DOM element replacement";
        }
    }
    
    xtag.register("x-iconbutton", {
        lifecycle:{
            // creates a <button> element with top-level <figure> wrapper for 
            // the icon's <img> element
            // and a <span> element for the label
            created: function(){
                this.xtag.buttonEl = document.createElement('button');
                // we use a wrapper to prevent our css styles from clobbering 
                // custom styles due to specificity issues
                this.xtag.iconWrapperEl = document.createElement('figure');
                this.xtag.iconEl = document.createElement('img');
                this.xtag.labelEl = document.createElement('span');
                
                // provide classes to expose certain elements and allow
                // users to hook in their own styles
                xtag.addClass(this.xtag.buttonEl, "button");
                xtag.addClass(this.xtag.iconEl, "icon");
                xtag.addClass(this.xtag.labelEl, "label");
                
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
                this.xtag.iconWrapperEl.appendChild(this.xtag.iconEl);
                this.appendChild(this.xtag.buttonEl);
                this.xtag.buttonEl.appendChild(this.xtag.iconWrapperEl);
                this.xtag.buttonEl.appendChild(this.xtag.labelEl);
                
                updatePartsOrder(this);
                updatePartsVisibility(this);
            },
            inserted: function() {
                updatePartsOrder(this);
                updatePartsVisibility(this);
            },
            attributeChange: function(){
                updatePartsOrder(this);
                updatePartsVisibility(this);
            }
        },
        accessors:{
            "src":{
                attribute: {selector: ".icon"},
                set: function(newSrc){
                    updatePartsVisibility(this, newSrc);
                }
            },
            "icon-anchor":{
                attribute: {},
                set: function(newAnchor){
                    updatePartsOrder(this);
                }
            },
            "icon":{
                get: function(){
                    return this.xtag.iconEl;
                },
                set: function(newIconEl){
                    replaceComponentElement(this, newIconEl, 'iconEl', 'icon');
                }
            },
            "label":{
                get: function(){
                    return this.xtag.labelEl;
                },
                set: function(newLabelEl){
                    replaceComponentElement(this, newLabelEl, 'labelEl', 'label');
                }
            },
            "text":{
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