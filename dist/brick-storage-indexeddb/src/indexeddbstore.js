(function() {

  var KEYVALUE_API_VERSION = 1;

  var indexedDB = window.indexedDB ||
                  window.mozIndexedDB ||
                  window.webkitIndexedDB ||
                  window.msIndexedDB;

  var IDBKeyRange = window.IDBKeyRange ||
                    window.webkitIDBKeyRange ||
                    window.msIDBKeyRange;

  function wrap(req) {
    return new Promise(function (resolve, reject) {
      req.onsuccess = function () {
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
      req.onerror = function () {
        reject(req.error);
      };
      req.onsuccess = function () {
        self.db = req.result;
        resolve(self);
      };
      req.onupgradeneeded = function () {
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
    _getTransactionAndStore: function(mode) {
      var self = this;
      mode = typeof mode !== 'undefined' ? mode : 'readonly';
      var tx = self.db.transaction(self.storeName, mode);
      var store = tx.objectStore(self.storeName);
      return {'transaction': tx, 'store': store};
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
    * @param {object}   object
    * @return {promise} Promise for the id/key to which
    * it was saved
    */
    insert: function (object) {
      var self = this;
      return self._awaitReady(self._insert, arguments);
    },
    _insert: function (object) {
      var self = this;
      var db = self._getTransactionAndStore('readwrite');
      var promise = wrap(db.store.add(object));
      promise.abort = function(){
        db.transaction.abort();
      };
      return promise;
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
      var db = self._getTransactionAndStore('readwrite');
      var promise = wrap(db.store.put(object));
      promise.abort = function(){
        db.transaction.abort();
      };
      return promise;
    },

    /**
    * Update or insert multiple objects into the database
    * @param {objects}  objects
    * @return {promise}
    */
    setMany: function (objects) {
      var self = this;
      return self._awaitReady(self._setMany, arguments);
    },
    _setMany: function (objects) {
      var self = this;
      var db = self._getTransactionAndStore('readwrite');
      var promises = [];
      for (var i = 0; i < objects.length; i++) {
        promises.push(db.store.put(objects[i]));
      }
      var promise = Promise.all(promises);
      promise.abort = function(){
        db.transaction.abort();
      };
      return promise;
    },

    /**
     * Get the object saved at a given id/key.
     * @param  {number|string} key
     * @return {promise}       Promise for the object
     */
    get: function (key) {
      var self = this;
      return self._awaitReady(self._get, arguments);
    },
    _get: function (key) {
      var self = this;
      var db = self._getTransactionAndStore();
      var promise = wrap(db.store.get(key));
      promise.abort = function(){
        db.transaction.abort();
      };
      return promise;
    },

    /**
     * Removes the the entry with the supplied id/key from the database.
     * @param  {number|string} key
     * @return {promise}       Promise for undefined
     */
    remove: function (key) {
      var self = this;
      return self._awaitReady(self._remove, arguments);
    },
    _remove: function (key) {
      var self = this;
      var db = self._getTransactionAndStore('readwrite');
      var promise = wrap(db.store.delete(key));
      promise.abort = function(){
        db.transaction.abort();
      };
      return promise;
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
      var db = self._getTransactionAndStore();
      var counter = 0;
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
      var promise = new Promise(function(resolve,reject){
        var cursorRequest;
        if (!orderby || orderby === self.key) {
          cursorRequest = db.store.openCursor(bound, direction);
        } else {
          var index = db.store.index(orderby);
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
      promise.abort = function(){
        db.transaction.abort();
      };
      return promise;
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
      var db = self._getTransactionAndStore();
      var promise = wrap(db.store.count());
      promise.abort = function(){
        db.transaction.abort();
      };
      return promise;
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
      var db = self._getTransactionAndStore('readwrite');
      var promise = wrap(db.store.clear());
      promise.abort = function(){
        db.transaction.abort();
      };
      return promise;
    }
  };

  window.IndexedDbStore = IndexedDbStore;

})();
