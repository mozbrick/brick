(function(){
    xtag.register('x-togglegroup', {
        lifecycle: {
            created: function(){
                this.options.forEach(function(option){
                    if(this.name){
                        option.name = this.name;
                    }
                    if(this.group){
                        option.group = this.group;
                    }

                    option.noBox = true;
                }.bind(this));

                console.log(this.options);
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