(function () {

  var DEFAULT_HEIGHT = 48;
  var SCROLL_TIMEOUT = 100;

  var requestAnimationFrame = window.requestAnimationFrame ||
                              window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame ||
                              window.msRequestAnimationFrame ||
                              function (fn) { setTimeout(fn, 0); };

  var cancelAnimationFrame = window.cancelAnimationFrame ||
                             window.mozCancelAnimationFrame ||
                             window.webkitCancelAnimationFrame ||
                             window.msCancelAnimationFrame ||
                             function () {};

  function computeMetrics(listview) {
    listview.ns.numItemsVisible = (listview.offsetHeight / listview.height|0) + 1;
  }

  function init(listview) {
    var ns = listview.ns;
    var data = ns.data;
    ns.list.innerHTML = '';
    if (!data) {
      return;
    }
    return data.size().then(function (numItems) {
      // A list of created, not-in-use DOM nodes
      ns.deadPool = [];
      // Object key to use for display label;
      ns.labelKey = listview.getAttribute('label');
      // The indexes of the items currently rendered
      ns.visibleItems = [];
      // A lookup cache by index of items from ns.data
      ns.items = {};
      ns.numItems = numItems;
      ns.skippedFrames = 0;
      // Set the height of the scrolling strip
      ns.list.style.height = listview.height * numItems + 'px';
      return listview;
    }).catch(console.error.bind(console));
  }

  function defaultRenderer(el, item, i, label) {
    el.setAttribute('data-id', i);
    el.innerHTML = label;
  }

  function renderItem(listview, i) {
    var div, img, span;
    var deadPool = listview.ns.deadPool;
    var height = listview.height;
    var data = listview.ns.data;
    var labelKey = listview.ns.labelKey;
    if (deadPool.length) {
      div = deadPool.pop();
      div.innerHTML = '';
    } else {
      div = document.createElement('div');
      div.classList.add('item');
    }
    data.getMany({offset:i,count:1}).then(function (item) {
      div.__item__ = item[0];
      defaultRenderer(div, item[0], i, item[0][labelKey]);
      div.style.transform = 'translateY(' + i * height + 'px)';
      div.style.webkitTransform = 'translateY(' + i * height + 'px)';
    });
    // place the element along the scroll strip.
    return div;
  }

  function stopScrolling(listview) {
    listview.classList.remove('scrolling');
  }

  function render(listview) {
    var ns = listview.ns;
    ns.skippedFrames = 0;
    var itemWindow = ns.numItemsVisible;
    if (!itemWindow) {
      computeMetrics(listview);
      itemWindow = ns.numItemsVisible;
    }
    var list = ns.list;
    var items = ns.items;
    var visibleItems = ns.visibleItems;
    var deadPool = ns.deadPool;
    var height = listview.height;
    var min = Math.max((listview.scrollTop / height|0) - itemWindow, 0);
    var max = Math.min((listview.scrollTop / height|0) + itemWindow * 2, ns.numItems);
    for (var i = min; i < max; i++) {
      if (!items[i]) {
        var newEl = renderItem(listview, i);
        items[i] = newEl;
        visibleItems.push(i);
        if (!newEl.parentNode) {
          list.appendChild(newEl);
        }
      }
    }
    for (i = 0; i < visibleItems.length; i++) {
      var idx = visibleItems[i];
      if (idx < min || idx > max) {
        deadPool.push(items[idx]);
        visibleItems.splice(i,1);
        delete items[idx];
        i--;
      }
    }
  }

  function scroll(listview) {
    if (!listview.ns.data) {
      return;
    }

    var ns = listview.ns;

    if (!ns.numItems) {
      return;
    }

    if (!ns.scrolling) {
      listview.classList.add('scrolling');
    }
    ns.scrolling = true;
    if (ns.scrollTimeout) {
      clearTimeout(ns.scrollTimeout);
    }
    ns.scrollTimeout = setTimeout(function () {
      ns.scrolling = false;
      stopScrolling(listview);
    }, SCROLL_TIMEOUT);

    if (ns.nextFrame) {
      ns.skippedFrames = ns.skippedFrames + 1;
      cancelAnimationFrame(ns.nextFrame);
    }
    ns.nextFrame = requestAnimationFrame(function () {
      render(listview);
    });
  }

  var ListViewPrototype = Object.create(HTMLElement.prototype);

  ListViewPrototype.createdCallback = function () {
    this.ns = {};
    var list = document.createElement('div');
    list.classList.add('list');
    this.ns.foo = 'bar';
    this.ns.list = list;
    this.appendChild(list);
  };

  ListViewPrototype.attachedCallback = function () {
    var listview = this;

    var storage = listview.getAttribute('storage');
    if (storage) {
      storage = document.getElementById(storage);
      if (storage) {
        listview.ns.data = storage;
      }
    }

    this.ns.scrollHandler = listview.addEventListener('scroll', function() {
      scroll(listview);
    });
    init(listview).then(render);
  };

  ListViewPrototype.detachedCallback = function () {
    var listview = this;
    listview.removeEventListener('scroll', listview.ns.scrollHandler);
  };

  var attrs = {
    'storage': function (oldVal, newVal) {
      var list = this;
      list.ns.storage = document.getElementById(newVal);
      init(list).then(function () {
        render(list);
      });
    }
  };

  ListViewPrototype.attributeChangedCallback = function (attr, oldVal, newVal) {
    if (attr in attrs) {
      attrs[attr].call(this, oldVal, newVal);
    }
  };

  ListViewPrototype.render = function () {
    var listview = this;
    init(listview).then(render);
  };

  Object.defineProperty(ListViewPrototype, "height", {
    get : function () {
      return this.ns.height || DEFAULT_HEIGHT;
    },
    set : function (newVal) {
      this.ns.height = newVal;
      render(this);
    }
  });

  window.ListView = document.registerElement('list-view', {
    prototype: ListViewPrototype
  });

})();
