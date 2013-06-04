(function(){  

  xtag.register('x-panel', {
    mixins: ['request'],
    lifecycle:{
      created: function(){
        this.dataready = function(request){
            
          var frag = document.createDocumentFragment();
          var container = document.createElement('div');
          frag.appendChild(container);
          container.innerHTML = request.responseText;

          this.innerHTML = '';

          xtag.toArray(container.children).forEach(function(child){        
            if (child.nodeName == 'SCRIPT'){
              var script = document.createElement('script');
              script.type = child.type;
              if (child.src.length>0){
                script.src = child.src;
              }else{
                script.appendChild( 
                document.createTextNode(child.text||child.textContent||child.innerHTML));
              }
              this.appendChild(script);
            }
            else{                
              this.appendChild(child);
            }
          }, this);

      }
    }
  }
  });

})();