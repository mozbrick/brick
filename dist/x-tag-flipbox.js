(function() {
    xtag.register("x-flipbox", {
        lifecycle: {
            created: function() {
                if (this.firstElementChild) {
                    xtag.skipTransition(this.firstElementChild, function() {});
                }
                if (this.lastElementChild) {
                    xtag.skipTransition(this.lastElementChild, function() {});
                }
                if (!this.hasAttribute("direction")) {
                    this.xtag._direction = "right";
                }
            }
        },
        events: {
            "transitionend:delegate(*:first-child)": function(e) {
                var frontCard = e.target;
                var flipBox = frontCard.parentNode;
                if (flipBox.nodeName.toLowerCase() === "x-flipbox") {
                    xtag.fireEvent(flipBox, "flipend");
                }
            },
            "show:delegate(*:first-child)": function(e) {
                var frontCard = e.target;
                var flipBox = frontCard.parentNode;
                if (flipBox.nodeName.toLowerCase() === "x-flipbox") {
                    flipBox.flipped = false;
                }
            },
            "show:delegate(*:last-child)": function(e) {
                var backCard = e.target;
                var flipBox = backCard.parentNode;
                if (flipBox.nodeName.toLowerCase() === "x-flipbox") {
                    flipBox.flipped = true;
                }
            }
        },
        accessors: {
            direction: {
                attribute: {},
                get: function() {
                    return this.xtag._direction;
                },
                set: function(value) {
                    xtag.skipTransition(this.firstElementChild, function() {
                        this.setAttribute("_anim-direction", value);
                    }, this);
                    xtag.skipTransition(this.lastElementChild, function() {
                        this.setAttribute("_anim-direction", value);
                    }, this);
                    this.xtag._direction = value;
                }
            },
            flipped: {
                attribute: {
                    "boolean": true
                }
            }
        },
        methods: {
            toggle: function() {
                this.flipped = !this.flipped;
            },
            showFront: function() {
                this.flipped = false;
            },
            showBack: function() {
                this.flipped = true;
            }
        }
    });
})();