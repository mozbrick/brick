/* global IndexedDbStore */

(function () {

  var BrickStorageIndexeddbElementPrototype = Object.create(HTMLElement.prototype);

  BrickStorageIndexeddbElementPrototype.attachedCallback = function () {
    this.name = this.getAttribute('name') || 'storage';
    this.keyname = this.getAttribute('keyname') || null;
    this.indexnames = this.getAttribute('indexname') ? this.getAttribute('indexname').split(" ") : [];
    this.storage = new IndexedDbStore(this.name, this.keyname, this.indexnames);
  };

  BrickStorageIndexeddbElementPrototype.insert = function (object) {
    return this.storage.insert(object);
  };
  BrickStorageIndexeddbElementPrototype.set = function (key, object) {
    return this.storage.set(key, object);
  };
  BrickStorageIndexeddbElementPrototype.setMany = function (objects) {
    return this.storage.setMany(objects);
  };
  BrickStorageIndexeddbElementPrototype.get = function (key) {
    return this.storage.get(key);
  };
  BrickStorageIndexeddbElementPrototype.remove = function (key) {
    return this.storage.remove(key);
  };
  BrickStorageIndexeddbElementPrototype.getMany = function (options) {
    return this.storage.getMany(options);
  };
  BrickStorageIndexeddbElementPrototype.size = function () {
    return this.storage.size();
  };
  BrickStorageIndexeddbElementPrototype.clear = function () {
    return this.storage.clear();
  };

  // Register the element
  window.BrickStorageIndexeddbElement = document.registerElement('brick-storage-indexeddb', {
    prototype: BrickStorageIndexeddbElementPrototype
  });

})();
