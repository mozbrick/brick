(function(){
    xtag.register('x-optionbar', {
        lifecycle: {
            created: function(){

                this.options.forEach(function(option){
                    if(this.name){
                        option.name = this.name;
                    }
                }.bind(this));
            }
        },
        events: {

        },
        accessors: {
            "name": {
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