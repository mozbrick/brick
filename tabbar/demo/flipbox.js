(function() {

  xtag.register('x-flipbox', {
    lifecycle: {
      created: function() {
        if (this.flipped){
          xtag.skipTransition(this.firstElementChild,function(){});
        } else {
          xtag.skipTransition(this.lastElementChild,function(){});
        }
      }
    },
    events:{
      'transitionend': function(e) {
        if (e.target == this) xtag.fireEvent(this, 'flipend');
      },
      'show:delegate(*:first-child)': function(e){
         // because we can't use the descendent selector of > at the front of
         // our delegation, make sure this is the correct top-level element
         
         var frontCard = e.target;
         var flipBox = frontCard.parentNode;
         
         if(flipBox.nodeName.toLowerCase() === "x-flipbox"){
            flipBox.flipped = false;
         }
      },
      'show:delegate(*:last-child)': function(e){
         // because we can't use the descendent selector of > at the front of
         // our delegation, make sure this is the correct top-level element
         
         var backCard = e.target;
         var flipBox = backCard.parentNode;
         
         if(flipBox.nodeName.toLowerCase() === "x-flipbox"){
            flipBox.flipped = true;
         }
      }
    },
    accessors: {
      direction: {
        get: function(){
          return this.getAttribute('direction');
        },
        set: function(value) {
          xtag.skipTransition(this.firstElementChild, function() {
            this.setAttribute('direction', value);
          }, this);
          xtag.skipTransition(this.lastElementChild, function() {
            this.setAttribute('direction', value);
          }, this);
        }
      },
      flipped: {
        attribute: { boolean: true }
      }
    },
    methods: {
      toggle: function() {
        this.flipped = !this.flipped;
      }
    }
  });

})();
