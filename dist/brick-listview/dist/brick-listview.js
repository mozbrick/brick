/* global Platform, Promise*/

(function () {

  var SCROLL_TIMEOUT = 100;

  var currentScript = document._currentScript || document.currentScript;

  var requestAnimationFrame = window.requestAnimationFrame ||
                              window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame ||
                              window.msRequestAnimationFrame ||
                              function (fn) { setTimeout(fn, 16); };

  var cancelAnimationFrame = window.cancelAnimationFrame ||
                             window.mozCancelAnimationFrame ||
                             window.webkitCancelAnimationFrame ||
                             window.msCancelAnimationFrame ||
                             function () {};

  var webComponentsReady = new Promise(function (resolve) {
    window.addEventListener('WebComponentsReady', resolve);
  });

  function ArrayAdapter(array) {

    this.array = array;

    this.size = function () {
      return Promise.resolve(array.length);
    };

    this.getMany = function (options) {
      options = options || {};
      var start = options.offset || 0;
      var end = options.count ? options.count + start + 1: undefined;
      return Promise.resolve(array.slice(start, end));
    };

  }

  function shimShadowStyles(styles, tag) {
    if (!Platform.ShadowCSS) {
      return;
    }
    for (var i = 0; i < styles.length; i++) {
      var style = styles[i];
      var cssText = Platform.ShadowCSS.shimStyle(style, tag);
      Platform.ShadowCSS.addCssToDocument(cssText);
      style.remove();
    }
  }

  function computeMetrics(listview) {
    listview.ns.numItemsVisible = (listview.offsetHeight / listview.ns.height|0) + 1;
  }

  function init(listview) {
    var ns = listview.ns;
    var data = ns.data;
    if (!data) {
      return Promise.resolve(listview);
    }
    // create a hidden item to measure its height
    ns.list.innerHTML = '<div class="item sentinel">test</div>';
    return data.size().then(function (numItems) {
      // A list of created, not-in-use DOM nodes
      ns.deadPool = [];
      // Object key to use for display label;
      ns.labelKey = listview.getAttribute('label');
      ns.imageKey = listview.getAttribute('image');
      ns.detailKey = listview.getAttribute('detail');
      // The indexes of the items currently rendered
      ns.visibleItems = [];
      // A lookup cache by index of items from ns.data
      ns.items = {};
      ns.numItems = numItems;
      // A list of open requests for ranges of data
      ns.rangeRequests = [];
      ns.height = listview.querySelector('.sentinel').offsetHeight;
      // Set the height of the scrolling strip
      ns.list.style.height = ns.height * (numItems) + 'px';
      return listview;
    });
  }

  function defaultRenderer(el, row, listview) {
    el.innerHTML = "";
    var labelKey = listview.ns.labelKey;
    var imageKey = listview.ns.imageKey;
    var detailKey = listview.ns.detailKey;

    // the image
    if (imageKey) {
      var img = document.createElement('img');
      img.src = row[listview.getAttribute(imageKey)];
      el.appendChild(img);
    }

    // the content
    var content = document.createElement('div');
    content.classList.add('content');

    if (labelKey) {
      var label = document.createElement('div');
      label.textContent = row[labelKey];
      content.appendChild(label);
    }
    if (detailKey) {
      var detail = document.createElement('div');
      detail.textContent = row[detailKey];
      content.appendChild(detail);
    }
    if (content.hasChildNodes()) {
      el.appendChild(content);
    }
  }

  function placeItem(listview, i) {
    var div;
    var deadPool = listview.ns.deadPool;
    if (deadPool.length) {
      div = deadPool.pop();
      div.innerHTML = '';
    } else {
      div = document.createElement('div');
      div.classList.add('item');
    }
    // place the element along the scroll strip.
    div.style.transform = 'translateY(' + i * 100 + '%)';
    div.style.webkitTransform = 'translateY(' + i * 100 + '%)';
    return div;
  }

  function stopScrolling(listview) {
    listview.classList.remove('scrolling');
  }

  function renderItems(min, rows) {
    var listview = this;
    var ns = listview.ns;
    var items = ns.items;
    for (var i = 0; i < rows.length; i++) {
      if (items[i+min]) {
        items[i+min].__item__ = rows[i];
        renderItem(items[i+min], rows[i], listview);
      }
    }
  }

  function renderItem(el, row, listview) {
    defaultRenderer(el, row, listview);
  }

  function removeReq(requests, min, max) {
    for (var i = 0; i < requests.length; i++) {
      var req = requests[i];
      if (req.min === min && req.max === max) {
        requests.splice(i, 1);
        i--;
      }
    }
  }

  function fetchRange(listview, min, max) {
    var rangeRequests = listview.ns.rangeRequests;
    var realMin = min;
    var realMax = max;
    var data = listview.ns.data;

    rangeRequests.forEach(function (range) {
      if ((range.max > realMin && range.max < realMax) !== (range.min > realMin && range.min < realMax)) {
        if (range.max >= realMin && range.max < realMax) {
          realMin = range.max + 1;
        }
        if (range.min <= realMax && range.min > realMin) {
          realMax = range.min - 1;
        }
      }
    });
    var req = data.getMany({offset: realMin, count: realMax-realMin+1});

    rangeRequests.push({
      min: realMin,
      max: realMax,
      request: req
    });

    req.then(function (rows) {
      renderItems.call(listview, realMin, rows);
    });

    req.then(function () {
      removeReq(rangeRequests, realMin, realMax);
    },function () {
      removeReq(rangeRequests, realMin, realMax);
    });
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
    var visibleItems = ns.visibleItems || [];
    var deadPool = ns.deadPool;
    var height = ns.height;
    var min = Math.max((listview.scrollTop / height|0) - itemWindow * 2, 0);
    var max = Math.min((listview.scrollTop / height|0) + itemWindow * 3, ns.numItems-1);

    var realMin = Infinity;
    var realMax = -Infinity;
    var numToFetch = 0;

    // is this item already rendered?
    for (var i = min; i <= max; i++) {
      if (!items[i]) {

        numToFetch++;

        // if not, create a new item and position it
        var newEl = placeItem(listview, i);
        items[i] = newEl;
        visibleItems.push(i);
        if (!newEl.parentNode) {
          list.appendChild(newEl);
        }

        // adjust the range of data we need to fetch
        realMin = Math.min(i, realMin);
        realMax = Math.max(i, realMax);
      }
    }

    // do we need to fetch data?
    if (numToFetch > 0) {
      fetchRange(listview, realMin, realMax);
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
      ns.scrolling = true;
    }
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
      ns.nextFrame = null;
    }
    ns.nextFrame = requestAnimationFrame(function () {
      render(listview);
    });
  }

  function clickHandler(e) {
    if ('__item__' in e.target) {
      var ev = new CustomEvent("select", {"detail": e.target.__item__});
      this.dispatchEvent(ev);
    }
  }

  var ListViewPrototype = Object.create(HTMLElement.prototype);

  ListViewPrototype.createdCallback = function () {
    this.ns = {};
    var list = document.createElement('div');
    list.classList.add('list');
    this.ns.list = list;
    this.appendChild(list);
  };

  ListViewPrototype.attachedCallback = function () {
    var listview = this;

    webComponentsReady.then(function() {

      // get the storage
      var storage = listview.getAttribute('storage');
      if (storage) {
        storage = document.getElementById(storage);
        if (storage) {
          listview.ns.data = storage;
        }
      }

      // import template
      var importDoc = currentScript.ownerDocument;
      var templateContent = importDoc.querySelector('#brick-listview-template').content;

      // fix styling for polyfill
      shimShadowStyles(templateContent.querySelectorAll('style'), 'brick-listview');

      // create shadowRoot and append template
      var shadowRoot = listview.createShadowRoot();
      shadowRoot.appendChild(templateContent.cloneNode(true));

      // setup event handlers
      listview.ns.scrollHandler = listview.addEventListener('scroll', function() {
        scroll(listview);
      });
      listview.ns.clickHandler = listview.addEventListener('click', clickHandler.bind(listview));

      // render the list
      listview.render();

    });
  };

  ListViewPrototype.detachedCallback = function () {
    var listview = this;
    listview.removeEventListener('scroll', listview.ns.scrollHandler);
    listview.removeEventListener('click', listview.ns.clickHandler);
  };

  var attrs = {
    'storage': function (oldVal, newVal) {
      this.ns.storage = document.getElementById(newVal);
      this.render();
    },
    'label': function () {
      this.render();
    },
    'detail': function () {
      this.render();
    },
    'image': function () {
      this.render();
    }
  };

  ListViewPrototype.attributeChangedCallback = function (attr, oldVal, newVal) {
    if (attr in attrs) {
      attrs[attr].call(this, oldVal, newVal);
    }
  };

  ListViewPrototype.render = function () {
    init(this).then(render);
  };

  Object.defineProperties (ListViewPrototype, {
    'data': {
      get: function () {
        // return either the array or the store
        return this.ns.data.array || this.ns.data;
      },
      set: function (newVal) {
        if (Array.isArray(newVal)) {
          this.ns.data = new ArrayAdapter(newVal);
        } else {
          this.ns.data = newVal;
        }
        this.render();
      }
    }
  });

  window.BrickListViewElement = document.registerElement('brick-listview', {
    prototype: ListViewPrototype
  });

})();
