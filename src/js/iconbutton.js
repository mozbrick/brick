(function(){
    // hides/unhides elements depending on if they have any content
    function updateVisible(elem){
        elem.xtag.iconWrapper.style.display = (elem.xtag.icon.src) ? "" : "none";
        elem.xtag.label.style.display = (elem.xtag.label.innerHTML) ? "" : "none";
    }
    
    // updates the html layout order of the icon and label to match any given
    // anchors
    function updateOrder(elem){
        var iconWrapper = elem.xtag.iconWrapper;
        var label = elem.xtag.label;
        var button = elem.xtag.button;
        
        switch(elem.getAttribute('icon-anchor')){
            // icon goes after label
            case "right":
            case "bottom":
                button.insertBefore(label, iconWrapper);
                break;
            
            //icon goes before label
            case "left":
            case "top":
            default:
                button.insertBefore(iconWrapper, label);
                break;
        }
    }
    
    
    xtag.register("x-iconbutton", {
        lifecycle:{
            // creates a <button> element with top-level <figure> wrapper for 
            // the icon's <img> element
            // and a <span> element for the label
            created: function(){
                this.xtag.button = document.createElement('button');
                this.xtag.iconWrapper = document.createElement('figure');
                this.xtag.icon = document.createElement('img');
                this.xtag.label = document.createElement('span');
                
                // provide classes to expose certain elements and allow
                // users to hook in their own styles
                xtag.addClass(this.xtag.button, "button");
                xtag.addClass(this.xtag.icon, "icon");
                xtag.addClass(this.xtag.label, "label");
                
                // remove content and put into the label
                this.xtag.label.innerHTML = this.innerHTML;
                this.innerHTML = "";
                
                // initialize blank image
                this.xtag.icon.src = null;
                
                // actually create the button
                this.xtag.iconWrapper.appendChild(this.xtag.icon);
                this.appendChild(this.xtag.button);
                this.xtag.button.appendChild(this.xtag.iconWrapper);
                this.xtag.button.appendChild(this.xtag.label);
                
                updateOrder(this);
                updateVisible(this);
            },
            inserted: function() {
                updateOrder(this);
                updateVisible(this);
            }
        },
        accessors:{
            "src":{
                attribute: {selector: ".icon"},
                set: function(newSrc){
                    // if not given a src, use null in order to actually clear
                    // the image's src (using empty string defaults to the
                    // 
                    return newSrc ? newSrc : null;
                }
            },
            "icon-anchor":{
                attribute: {},
                set: function(newAnchor){
                    updateOrder(this);
                }
            }
        }
    });

})();