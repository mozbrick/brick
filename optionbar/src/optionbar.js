(function(){
    xtag.register('x-optionbar', {
        lifecycle: {
            created: function(){
                this.options.forEach(function(option){
                    if(this.name){
                        option.name = this.name;
                    }
                    if(this.group){
                        option.group = this.group;
                    }
                }.bind(this));

                console.log(this.childNodes);
            }
        },
        events: {

        },
        accessors: {
            "name": {
                attribute: {}
            },
            "group": {
                attribute: {}
            },
            "options": {
                get: function(){
                    return xtag.queryChildren(this, "x-toggle");
                }
            }
        },
        methods: {

        }
    });
})();