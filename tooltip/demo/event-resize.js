//TODO: register event-resize in bower, then make it a dependency in components.json instead of including this file

(function(){
  
  var baseStyle = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;',
      innerStyle = 'style="' + baseStyle + ' overflow: hidden;"';
  
  xtag.customEvents.resize = {
    onAdd: function(event, fn){
      var element = this,
        resize = 'onresize' in this;
      
      if (!resize && !this.__flowSensor__) {
        var sensor = this.__flowSensor__ = document.createElement('div');
          sensor.className = 'resize-sensor';
          sensor.setAttribute('style', baseStyle + ' visibility: hidden; z-index: -1;');
          sensor.innerHTML = '<div class="resize-overflow" ' + innerStyle + '><div></div></div>' +
                             '<div class="resize-underflow" ' + innerStyle + '><div></div></div>';
        
        var x = 0, y = 0,
          first = sensor.firstElementChild.firstChild,
          last = sensor.lastElementChild.firstChild,
          matchFlow = function(event){
          var change = false,
            width = element.offsetWidth;
          if (x != width) {
            first.style.width = width - 1 + 'px';	
            last.style.width = width + 1 + 'px';
            change = true;
            x = width;
          }
          var height = element.offsetHeight;
          if (y != height) {
            first.style.height = height - 1 + 'px';
            last.style.height = height + 1 + 'px';	
            change = true;
            y = height;
          }
          if (change && event.currentTarget != element) xtag.fireEvent(element, 'resize');
          };
        
        if (window.getComputedStyle(element).position == 'static'){
        element.style.position = 'relative';
        sensor.__flowPosition__ = true;
        }
        
        xtag.addEvents(sensor, {
          overflow: matchFlow,
          underflow: matchFlow
        });
        xtag.addEvent(sensor.firstElementChild, 'overflow', matchFlow);
        xtag.addEvent(sensor.firstElementChild, 'underflow', matchFlow);
        
        element.appendChild(sensor);
        matchFlow({});
      }
      
      var events = this.__flowEvents__ || (this.__flowEvents__ = []);
      if (events.indexOf(fn) == -1) events.push(fn);
      if (!resize) this.addEventListener('resize', fn, false);
      this.onresize = function(e){
        events.forEach(function(fn){
        fn.call(element, e);
        });
      };
    },
    
    onRemove: function(event, fn){
    var events = this.__flowEvents__,
      index = events.indexOf(fn);
      if (index > -1) events.splice(index, 1);
      if (!events.length) {
        var sensor = this.__flowSensor__;
        if (sensor) {
          this.removeChild(sensor);
          if (sensor.__flowPosition__) this.style.position = 'static';
          delete this.__flowSensor__;
        }
        if ('onresize' in this) this.onresize = null;
        delete this.__flowEvents__;
      }
      this.removeEventListener('resize', fn);
    }
  };

})();