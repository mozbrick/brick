(function(){
    // hides contentless elements
    function updateVisible(elem){
        elem.xtag.icon.style.display = (elem.xtag.icon.src) ? "" : "none";
        elem.xtag.label.style.display = (elem.xtag.label.innerHTML) ? "" : "none";
    }

    xtag.register("x-iconbutton", {
        lifecycle:{
            created: function(){
                this.xtag.button = document.createElement('button');
                this.xtag.icon = document.createElement('img');
                this.xtag.label = document.createElement('span');
                
                this.xtag.label.innerHTML = this.innerHTML;
                this.innerHTML = "";
                
                this.appendChild(this.xtag.button);
                this.xtag.button.appendChild(this.xtag.icon);
                this.xtag.button.appendChild(this.xtag.label);
                
                updateVisible(this);
            },
            inserted: function() {
                updateVisible(this);
            }
        },
        accessors:{
            "src":{
                attribute: {},
                set: function(newSrc) {
                    this.xtag.icon.src = newSrc ? newSrc : "";
                    
                    updateVisible(this);
                    console.log(this.xtag.icon.src,"'"+this.xtag.icon.style.display+"'");
                },
                get: function() {
                    return this.xtag.icon.src;
                }
            }
        }
    });

})();