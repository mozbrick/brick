(function() {
    xtag.register("x-appbar", {
        lifecycle: {
            created: function() {
                var header = xtag.queryChildren(this, "header")[0];
                if (!header) {
                    header = document.createElement("header");
                    this.appendChild(header);
                }
                this.xtag.data.header = header;
                this.subheading = this.subheading;
            }
        },
        accessors: {
            heading: {
                attribute: {},
                get: function() {
                    return this.xtag.data.header.innerHTML;
                },
                set: function(value) {
                    this.xtag.data.header.innerHTML = value;
                }
            },
            subheading: {
                attribute: {},
                get: function() {
                    return this.getAttribute("subheading") || "";
                },
                set: function(value) {
                    this.xtag.data.header.setAttribute("subheading", value);
                }
            }
        }
    });
})();