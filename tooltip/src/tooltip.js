(function(){
    function _selectorToElems(tooltip, selector){
        if(selector === "_parentNode"){
            // return a NodeList of a single element
            var fragment = document.createDocumentFragment();
            fragment.appendChild(tooltip.parentNode);
            return fragment.childNodes;
        }
        else{
            return document.querySelectorAll(selector);
        }
    }

    xtag.register("x-tooltip", {
        lifecycle:{
            created: function(){
                this.xtag.triggerElemSelector = "_parentNode";
            }
        },
        events: {
        },
        accessors: {
            "direction": {
                attribute: {}
            },
            "trigger-selector": {
                attribute: {},
                get: function(){
                    console.log(_selectorToElems(this, this.xtag.triggerElemSelector));
                    return this.xtag.triggerElemSelector;
                },
                set: function(newElemSelector){
                    this.xtag.triggerElemSelector = newElemSelector;
                }
            }
        },
        methods: {
        }
    });
})();