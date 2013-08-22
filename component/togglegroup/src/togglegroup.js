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
            }
        },
        events: {

        },
        accessors: {
            "name": {
                attribute: {selector: "x-toggle"},
                set: function(newName){
                    this.options.forEach(function(toggle){
                        toggle.name = newName;
                    });
                }
            },
            "group": {
                attribute: {selector: "x-toggle"},
                set: function(newGroup){
                    this.options.forEach(function(toggle){
                        toggle.group = newGroup;
                    });
                }
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