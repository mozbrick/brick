(function () {

  var KEYVALUE_API_VERSION = 1;

  var indexedDB = window.indexedDB ||
                  window.mozIndexedDB ||
                  window.webkitIndexedDB ||
                  window.msIndexedDB;

  var IDBTransaction = window.IDBTransaction ||
                       window.webkitIDBTransaction ||
                       window.mozIDBTransaction ||
                       window.msIDBTransaction;

  var IDBKeyRange = window.IDBKeyRange ||
                    window.webkitIDBKeyRange ||
                    window.msIDBKeyRange;

  function wrap(req) {
    return new Promise(function (resolve, reject) {
      req.onsuccess = function (e) {
        resolve(req.result);
      };
      req.onerror = function (e) {
        // prevent the transaction from being aborted
        // on a constraint error
        e.preventDefault();
        reject(req.error);
      };
    });
  }

  function IndexedDbStore(storeName, key, indices) {

    var self = this;
    self._ready = false;
    self.storeName = storeName;
    self.indices = indices;
    if (key) {
      self.key = key;
      self.autoIncrement = false;
    } else {
      self.key = "id";
      self.autoIncrement = true;
    }

    self.ready = new Promise(function (resolve, reject) {
      if (!indexedDB) {
        reject('No indexedDB implementation found!');
      }
      var req = indexedDB.open(self.storeName, KEYVALUE_API_VERSION);
      req.onerror = function (e) {
        reject(req.error);
      };
      req.onsuccess = function (e) {
        self.db = req.result;
        resolve(self);
      };
      req.onupgradeneeded = function (e) {
        self.db = req.result;
        var store = self.db.createObjectStore(self.storeName, { keyPath: self.key, autoIncrement: self.autoIncrement });
        // create indices
        for (var i = 0; i < self.indices.length; i++) {
          store.createIndex(self.indices[i], self.indices[i]);
        }
      };
      req.onerror = reject;
    });

    self.ready.then(function() {
      self._ready = true;
    });
  }

  IndexedDbStore.prototype = {

    // Internal function: returns the objectStore with the supplied
    // transaction mode. Defaults to readonly transaction.
    _getObjectStore: function(mode) {
      var self = this;
      mode = typeof mode !== 'undefined' ? mode : 'readonly';
      return self.db.transaction(self.storeName, mode)
                    .objectStore(self.storeName);
    },

    // Internal function to defer the execution of a supplied function
    // until the database is ready.
    _awaitReady: function(fn, args) {
      var self = this;
      if (self._ready) {
        return fn.apply(self, args);
      } else {
        return self.ready.then(function() {
          return fn.apply(self, args);
        });
      }
    },

    /**
    * Save an object into the database
    * @param {object} object the object to be saved
    * @return {promise} Promise for the id/key to which
    * it was saved
    */
    insert: function (object) {
      var self = this;
      return self._awaitReady(self._insert, arguments);
    },
    _insert: function (object) {
      var self = this;
      var store = self._getObjectStore('readwrite');
      return wrap(store.add(object));
    },

    /**
     * Update or insert an Object at the given id/key.
     * @param {number}               id
     * @param {string|number|object} object
     * @return {promise}             Promise for the id/key of
     *                               the created object
     */
    set: function (object) {
      var self = this;
      return self._awaitReady(self._set, arguments);
    },
    _set: function (object) {
      var self = this;
      var store = self._getObjectStore('readwrite');
      return wrap(store.put(object));
    },

    /**
     * Get the object saved at a given id/key.
     * @param  {number|string} id
     * @return {promise}       Promise for the object
     */
    get: function (key) {
      var self = this;
      return self._awaitReady(self._get, arguments);
    },
    _get: function (key) {
      var self = this;
      var store = self._getObjectStore();
      return wrap(store.get(key));
    },

    /**
     * Removes the the entry with the supplied id/key from the database.
     * @param  {number|string} id
     * @return {promise} for undefined
     */
    remove: function (key) {
      var self = this;
      return self._awaitReady(self._remove, arguments);
    },
    _remove: function (key) {
      var self = this;
      var store = self._getObjectStore('readwrite');
      return wrap(store.delete(key));
    },

    /**
     * Returns multiple database entries.
     * @param  {options}
     *   {any}     start      The first id of the results.
     *   {any}     end        The last id of the results.
     *   {number}  count      The number of results.
     *   {number}  offset     The offset of the first result.
     *   {string}  orderby    The key by which the results will be ordered.
     *   {boolean} reverse    Reverse the order of the results.
     *   use [start] with ([end] or/and [count])
     *   use [offset] with ([end] or/and [count])
     *   using [end] together with [count] the results stop at whatever comes first.
     * @return {promise}      Promise for the objects
     */
    getMany: function(options) {
      var self = this;
      return self._awaitReady(self._getMany, arguments);
    },
    _getMany: function(options) {
      options = options || {};
      var self = this;
      var store = self._getObjectStore();
      var counter = 0;
      var advanced = false;
      var start = options.start;
      var end = options.end;
      var count = options.count || undefined;
      var offset = options.offset || 0;
      var advance = offset === 0 ? false : true;
      var direction = options.reverse ? 'prev' : 'next';
      var orderby = options.orderby;

      // set bound based on options
      var bound;
      if (start && end) {
        bound = IDBKeyRange.bound(start,end);
      } else if (start) {
        bound = IDBKeyRange.lowerBound(start);
      } else if (end) {
        bound = IDBKeyRange.upperBound(end);
      } else {
        bound = null;
      }
      var allItems = [];
      return new Promise(function(resolve,reject){
        var cursorRequest;
        if (!orderby || orderby === self.key) {
          cursorRequest = store.openCursor(bound, direction);
        } else {
          var index = store.index(orderby);
          cursorRequest = index.openCursor(bound, direction);
        }
        cursorRequest.onsuccess = function(e){
          var cursor = e.target.result;
          // if we reached the end of the items or as many items as
          // requested with the counter, resolve with the result array.
          if (!cursor || (counter !== undefined && counter >= count)) {
            resolve(allItems);
          } else {
            // if we no offset is specified or we skipped ahead
            // already, add the item to the results.
            // else advance the cursor by the offset.
            if (!advance) {
              allItems.push(cursor.value);
              counter++;
              cursor.continue();
            } else {
              advance = false;
              cursor.advance(offset);
            }
          }
        };
      });
    },

    /**
     * Returns the number of database entries.
     * @return {promise} Promise for the size.
     */
    size: function() {
      var self = this;
      return self._awaitReady(self._size);
    },
    _size: function() {
      var self = this;
      var store = self._getObjectStore();
      return wrap(store.count());
    },

    /**
     * Deletes all database entries.
     * @return {promise} Promise for undefined.
     */
    clear: function () {
      var self = this;
      return self._awaitReady(self._clear);
    },
    _clear: function() {
      var self = this;
      var store = self._getObjectStore('readwrite');
      return wrap(store.clear());
    }
  };


var StoragePrototype = Object.create(HTMLElement.prototype);

  StoragePrototype.createdCallback = function () {
  };

  StoragePrototype.attachedCallback = function () {
    this.name = this.getAttribute('name') || 'storage';
    this.key = this.getAttribute('key') || null;
    this.indices = this.getAttribute('index') ? this.getAttribute('index').split(" ") : [];
    this.storage = new IndexedDbStore(this.name, this.key, this.indices);
  };

  StoragePrototype.insert = function (object) {
    return this.storage.insert(object);
  };
  StoragePrototype.set = function (key, object) {
    return this.storage.set(key, object);
  };
  StoragePrototype.get = function (key) {
    return this.storage.get(key);
  };
  StoragePrototype.remove = function (key) {
    return this.storage.remove(key);
  };
  StoragePrototype.getMany = function (options) {
    return this.storage.getMany(options);
  };
  StoragePrototype.size = function () {
    return this.storage.size();
  };
  StoragePrototype.clear = function () {
    return this.storage.clear();
  };

  window.XStorageIndexedDB = document.registerElement('x-storage-indexeddb', {
    prototype: StoragePrototype
  });

})();