<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> default skin wip
window.Platform = {};

var logFlags = {};

(function() {
    if (typeof window.Element === "undefined" || "classList" in document.documentElement) return;
    var prototype = Array.prototype, indexOf = prototype.indexOf, slice = prototype.slice, push = prototype.push, splice = prototype.splice, join = prototype.join;
    function DOMTokenList(el) {
        this._element = el;
        if (el.className != this._classCache) {
            this._classCache = el.className;
            if (!this._classCache) return;
            var classes = this._classCache.replace(/^\s+|\s+$/g, "").split(/\s+/), i;
            for (i = 0; i < classes.length; i++) {
                push.call(this, classes[i]);
            }
        }
    }
    function setToClassName(el, classes) {
        el.className = classes.join(" ");
    }
    DOMTokenList.prototype = {
        add: function(token) {
            if (this.contains(token)) return;
            push.call(this, token);
            setToClassName(this._element, slice.call(this, 0));
        },
        contains: function(token) {
            return indexOf.call(this, token) !== -1;
        },
        item: function(index) {
            return this[index] || null;
        },
        remove: function(token) {
            var i = indexOf.call(this, token);
            if (i === -1) {
                return;
            }
            splice.call(this, i, 1);
            setToClassName(this._element, slice.call(this, 0));
        },
        toString: function() {
            return join.call(this, " ");
        },
        toggle: function(token) {
            if (indexOf.call(this, token) === -1) {
                this.add(token);
            } else {
                this.remove(token);
            }
        }
    };
    window.DOMTokenList = DOMTokenList;
    function defineElementGetter(obj, prop, getter) {
        if (Object.defineProperty) {
            Object.defineProperty(obj, prop, {
                get: getter
            });
        } else {
            obj.__defineGetter__(prop, getter);
        }
    }
    defineElementGetter(Element.prototype, "classList", function() {
        return new DOMTokenList(this);
    });
})();

if (typeof WeakMap === "undefined") {
    (function() {
        var defineProperty = Object.defineProperty;
        var counter = Date.now() % 1e9;
        var WeakMap = function() {
            this.name = "__st" + (Math.random() * 1e9 >>> 0) + (counter++ + "__");
        };
        WeakMap.prototype = {
            set: function(key, value) {
                var entry = key[this.name];
                if (entry && entry[0] === key) entry[1] = value; else defineProperty(key, this.name, {
                    value: [ key, value ],
                    writable: true
                });
            },
            get: function(key) {
                var entry;
                return (entry = key[this.name]) && entry[0] === key ? entry[1] : undefined;
            },
            "delete": function(key) {
                this.set(key, undefined);
            }
        };
        window.WeakMap = WeakMap;
    })();
}

<<<<<<< HEAD
(function(global) {
    var registrationsTable = new WeakMap();
=======
var SideTable;

if (typeof WeakMap !== "undefined" && navigator.userAgent.indexOf("Firefox/") < 0) {
    SideTable = WeakMap;
} else {
    (function() {
        var defineProperty = Object.defineProperty;
        var counter = Date.now() % 1e9;
        SideTable = function() {
            this.name = "__st" + (Math.random() * 1e9 >>> 0) + (counter++ + "__");
        };
        SideTable.prototype = {
            set: function(key, value) {
                var entry = key[this.name];
                if (entry && entry[0] === key) entry[1] = value; else defineProperty(key, this.name, {
                    value: [ key, value ],
                    writable: true
                });
            },
            get: function(key) {
                var entry;
                return (entry = key[this.name]) && entry[0] === key ? entry[1] : undefined;
            },
            "delete": function(key) {
                this.set(key, undefined);
            }
        };
    })();
}

(function(global) {
    var registrationsTable = new SideTable();
>>>>>>> default skin wip
    var setImmediate = window.msSetImmediate;
    if (!setImmediate) {
        var setImmediateQueue = [];
        var sentinel = String(Math.random());
        window.addEventListener("message", function(e) {
            if (e.data === sentinel) {
                var queue = setImmediateQueue;
                setImmediateQueue = [];
                queue.forEach(function(func) {
                    func();
                });
            }
        });
        setImmediate = function(func) {
            setImmediateQueue.push(func);
            window.postMessage(sentinel, "*");
        };
    }
    var isScheduled = false;
    var scheduledObservers = [];
    function scheduleCallback(observer) {
        scheduledObservers.push(observer);
        if (!isScheduled) {
            isScheduled = true;
            setImmediate(dispatchCallbacks);
        }
    }
    function wrapIfNeeded(node) {
        return window.ShadowDOMPolyfill && window.ShadowDOMPolyfill.wrapIfNeeded(node) || node;
    }
    function dispatchCallbacks() {
        isScheduled = false;
        var observers = scheduledObservers;
        scheduledObservers = [];
        observers.sort(function(o1, o2) {
            return o1.uid_ - o2.uid_;
        });
        var anyNonEmpty = false;
        observers.forEach(function(observer) {
            var queue = observer.takeRecords();
            removeTransientObserversFor(observer);
            if (queue.length) {
                observer.callback_(queue, observer);
                anyNonEmpty = true;
            }
        });
        if (anyNonEmpty) dispatchCallbacks();
    }
    function removeTransientObserversFor(observer) {
        observer.nodes_.forEach(function(node) {
            var registrations = registrationsTable.get(node);
            if (!registrations) return;
            registrations.forEach(function(registration) {
                if (registration.observer === observer) registration.removeTransientObservers();
            });
        });
    }
    function forEachAncestorAndObserverEnqueueRecord(target, callback) {
        for (var node = target; node; node = node.parentNode) {
            var registrations = registrationsTable.get(node);
            if (registrations) {
                for (var j = 0; j < registrations.length; j++) {
                    var registration = registrations[j];
                    var options = registration.options;
                    if (node !== target && !options.subtree) continue;
                    var record = callback(options);
                    if (record) registration.enqueue(record);
                }
            }
        }
    }
    var uidCounter = 0;
    function JsMutationObserver(callback) {
        this.callback_ = callback;
        this.nodes_ = [];
        this.records_ = [];
        this.uid_ = ++uidCounter;
    }
    JsMutationObserver.prototype = {
        observe: function(target, options) {
            target = wrapIfNeeded(target);
            if (!options.childList && !options.attributes && !options.characterData || options.attributeOldValue && !options.attributes || options.attributeFilter && options.attributeFilter.length && !options.attributes || options.characterDataOldValue && !options.characterData) {
                throw new SyntaxError();
            }
            var registrations = registrationsTable.get(target);
            if (!registrations) registrationsTable.set(target, registrations = []);
            var registration;
            for (var i = 0; i < registrations.length; i++) {
                if (registrations[i].observer === this) {
                    registration = registrations[i];
                    registration.removeListeners();
                    registration.options = options;
                    break;
                }
            }
            if (!registration) {
                registration = new Registration(this, target, options);
                registrations.push(registration);
                this.nodes_.push(target);
            }
            registration.addListeners();
        },
        disconnect: function() {
            this.nodes_.forEach(function(node) {
                var registrations = registrationsTable.get(node);
                for (var i = 0; i < registrations.length; i++) {
                    var registration = registrations[i];
                    if (registration.observer === this) {
                        registration.removeListeners();
                        registrations.splice(i, 1);
                        break;
                    }
                }
            }, this);
            this.records_ = [];
        },
        takeRecords: function() {
            var copyOfRecords = this.records_;
            this.records_ = [];
            return copyOfRecords;
        }
    };
    function MutationRecord(type, target) {
        this.type = type;
        this.target = target;
        this.addedNodes = [];
        this.removedNodes = [];
        this.previousSibling = null;
        this.nextSibling = null;
        this.attributeName = null;
        this.attributeNamespace = null;
        this.oldValue = null;
    }
    function copyMutationRecord(original) {
        var record = new MutationRecord(original.type, original.target);
        record.addedNodes = original.addedNodes.slice();
        record.removedNodes = original.removedNodes.slice();
        record.previousSibling = original.previousSibling;
        record.nextSibling = original.nextSibling;
        record.attributeName = original.attributeName;
        record.attributeNamespace = original.attributeNamespace;
        record.oldValue = original.oldValue;
        return record;
    }
    var currentRecord, recordWithOldValue;
    function getRecord(type, target) {
        return currentRecord = new MutationRecord(type, target);
    }
    function getRecordWithOldValue(oldValue) {
        if (recordWithOldValue) return recordWithOldValue;
        recordWithOldValue = copyMutationRecord(currentRecord);
        recordWithOldValue.oldValue = oldValue;
        return recordWithOldValue;
    }
    function clearRecords() {
        currentRecord = recordWithOldValue = undefined;
    }
    function recordRepresentsCurrentMutation(record) {
        return record === recordWithOldValue || record === currentRecord;
    }
    function selectRecord(lastRecord, newRecord) {
        if (lastRecord === newRecord) return lastRecord;
        if (recordWithOldValue && recordRepresentsCurrentMutation(lastRecord)) return recordWithOldValue;
        return null;
    }
    function Registration(observer, target, options) {
        this.observer = observer;
        this.target = target;
        this.options = options;
        this.transientObservedNodes = [];
    }
    Registration.prototype = {
        enqueue: function(record) {
            var records = this.observer.records_;
            var length = records.length;
            if (records.length > 0) {
                var lastRecord = records[length - 1];
                var recordToReplaceLast = selectRecord(lastRecord, record);
                if (recordToReplaceLast) {
                    records[length - 1] = recordToReplaceLast;
                    return;
                }
            } else {
                scheduleCallback(this.observer);
            }
            records[length] = record;
        },
        addListeners: function() {
            this.addListeners_(this.target);
        },
        addListeners_: function(node) {
            var options = this.options;
            if (options.attributes) node.addEventListener("DOMAttrModified", this, true);
            if (options.characterData) node.addEventListener("DOMCharacterDataModified", this, true);
            if (options.childList) node.addEventListener("DOMNodeInserted", this, true);
            if (options.childList || options.subtree) node.addEventListener("DOMNodeRemoved", this, true);
        },
        removeListeners: function() {
            this.removeListeners_(this.target);
        },
        removeListeners_: function(node) {
            var options = this.options;
            if (options.attributes) node.removeEventListener("DOMAttrModified", this, true);
            if (options.characterData) node.removeEventListener("DOMCharacterDataModified", this, true);
            if (options.childList) node.removeEventListener("DOMNodeInserted", this, true);
            if (options.childList || options.subtree) node.removeEventListener("DOMNodeRemoved", this, true);
        },
        addTransientObserver: function(node) {
            if (node === this.target) return;
            this.addListeners_(node);
            this.transientObservedNodes.push(node);
            var registrations = registrationsTable.get(node);
            if (!registrations) registrationsTable.set(node, registrations = []);
            registrations.push(this);
        },
        removeTransientObservers: function() {
            var transientObservedNodes = this.transientObservedNodes;
            this.transientObservedNodes = [];
            transientObservedNodes.forEach(function(node) {
                this.removeListeners_(node);
                var registrations = registrationsTable.get(node);
                for (var i = 0; i < registrations.length; i++) {
                    if (registrations[i] === this) {
                        registrations.splice(i, 1);
                        break;
                    }
                }
            }, this);
        },
        handleEvent: function(e) {
            e.stopImmediatePropagation();
            switch (e.type) {
              case "DOMAttrModified":
                var name = e.attrName;
                var namespace = e.relatedNode.namespaceURI;
                var target = e.target;
                var record = new getRecord("attributes", target);
                record.attributeName = name;
                record.attributeNamespace = namespace;
                var oldValue = e.attrChange === MutationEvent.ADDITION ? null : e.prevValue;
                forEachAncestorAndObserverEnqueueRecord(target, function(options) {
                    if (!options.attributes) return;
                    if (options.attributeFilter && options.attributeFilter.length && options.attributeFilter.indexOf(name) === -1 && options.attributeFilter.indexOf(namespace) === -1) {
                        return;
                    }
                    if (options.attributeOldValue) return getRecordWithOldValue(oldValue);
                    return record;
                });
                break;

              case "DOMCharacterDataModified":
                var target = e.target;
                var record = getRecord("characterData", target);
                var oldValue = e.prevValue;
                forEachAncestorAndObserverEnqueueRecord(target, function(options) {
                    if (!options.characterData) return;
                    if (options.characterDataOldValue) return getRecordWithOldValue(oldValue);
                    return record;
                });
                break;

              case "DOMNodeRemoved":
                this.addTransientObserver(e.target);

              case "DOMNodeInserted":
                var target = e.relatedNode;
                var changedNode = e.target;
                var addedNodes, removedNodes;
                if (e.type === "DOMNodeInserted") {
                    addedNodes = [ changedNode ];
                    removedNodes = [];
                } else {
                    addedNodes = [];
                    removedNodes = [ changedNode ];
                }
                var previousSibling = changedNode.previousSibling;
                var nextSibling = changedNode.nextSibling;
                var record = getRecord("childList", target);
                record.addedNodes = addedNodes;
                record.removedNodes = removedNodes;
                record.previousSibling = previousSibling;
                record.nextSibling = nextSibling;
                forEachAncestorAndObserverEnqueueRecord(target, function(options) {
                    if (!options.childList) return;
                    return record;
                });
            }
            clearRecords();
        }
    };
    global.JsMutationObserver = JsMutationObserver;
<<<<<<< HEAD
    if (!global.MutationObserver && global.WebKitMutationObserver) global.MutationObserver = global.WebKitMutationObserver;
    if (!global.MutationObserver) global.MutationObserver = JsMutationObserver;
})(this);

=======
})(this);

if (!window.MutationObserver) {
    window.MutationObserver = window.WebKitMutationObserver || window.JsMutationObserver;
    if (!MutationObserver) {
        throw new Error("no mutation observer support");
    }
}

>>>>>>> default skin wip
(function(scope) {
    if (!scope) {
        scope = window.CustomElements = {
            flags: {}
        };
    }
    var flags = scope.flags;
    var hasNative = Boolean(document.register);
    var useNative = !flags.register && hasNative;
    if (useNative) {
        var nop = function() {};
        scope.registry = {};
        scope.upgradeElement = nop;
        scope.watchShadow = nop;
        scope.upgrade = nop;
        scope.upgradeAll = nop;
        scope.upgradeSubtree = nop;
        scope.observeDocument = nop;
        scope.upgradeDocument = nop;
        scope.takeRecords = nop;
    } else {
        function register(name, options) {
            var definition = options || {};
            if (!name) {
                throw new Error("document.register: first argument `name` must not be empty");
            }
            if (name.indexOf("-") < 0) {
                throw new Error("document.register: first argument ('name') must contain a dash ('-'). Argument provided was '" + String(name) + "'.");
            }
            definition.name = name;
            if (!definition.prototype) {
                throw new Error("Options missing required prototype property");
            }
            definition.lifecycle = definition.lifecycle || {};
            definition.ancestry = ancestry(definition.extends);
            resolveTagName(definition);
            resolvePrototypeChain(definition);
            overrideAttributeApi(definition.prototype);
            registerDefinition(name, definition);
            definition.ctor = generateConstructor(definition);
            definition.ctor.prototype = definition.prototype;
            definition.prototype.constructor = definition.ctor;
            if (scope.ready) {
                scope.upgradeAll(document);
            }
            return definition.ctor;
        }
        function ancestry(extnds) {
            var extendee = registry[extnds];
            if (extendee) {
                return ancestry(extendee.extends).concat([ extendee ]);
            }
            return [];
        }
        function resolveTagName(definition) {
            var baseTag = definition.extends;
            for (var i = 0, a; a = definition.ancestry[i]; i++) {
                baseTag = a.is && a.tag;
            }
            definition.tag = baseTag || definition.name;
            if (baseTag) {
                definition.is = definition.name;
            }
        }
        function resolvePrototypeChain(definition) {
            if (!Object.__proto__) {
                var nativePrototype = HTMLElement.prototype;
                if (definition.is) {
                    var inst = document.createElement(definition.tag);
                    nativePrototype = Object.getPrototypeOf(inst);
                }
                var proto = definition.prototype, ancestor;
                while (proto && proto !== nativePrototype) {
                    var ancestor = Object.getPrototypeOf(proto);
                    proto.__proto__ = ancestor;
                    proto = ancestor;
                }
            }
            definition.native = nativePrototype;
        }
        function instantiate(definition) {
            return upgrade(domCreateElement(definition.tag), definition);
        }
        function upgrade(element, definition) {
            if (definition.is) {
                element.setAttribute("is", definition.is);
            }
<<<<<<< HEAD
            element.removeAttribute("unresolved");
=======
>>>>>>> default skin wip
            implement(element, definition);
            element.__upgraded__ = true;
            scope.upgradeSubtree(element);
            created(element);
            return element;
        }
        function implement(element, definition) {
            if (Object.__proto__) {
                element.__proto__ = definition.prototype;
            } else {
                customMixin(element, definition.prototype, definition.native);
                element.__proto__ = definition.prototype;
            }
        }
        function customMixin(inTarget, inSrc, inNative) {
            var used = {};
            var p = inSrc;
            while (p !== inNative && p !== HTMLUnknownElement.prototype) {
                var keys = Object.getOwnPropertyNames(p);
                for (var i = 0, k; k = keys[i]; i++) {
                    if (!used[k]) {
                        Object.defineProperty(inTarget, k, Object.getOwnPropertyDescriptor(p, k));
                        used[k] = 1;
                    }
                }
                p = Object.getPrototypeOf(p);
            }
        }
        function created(element) {
            if (element.createdCallback) {
                element.createdCallback();
            }
        }
        function overrideAttributeApi(prototype) {
<<<<<<< HEAD
            if (prototype.setAttribute._polyfilled) {
                return;
            }
=======
>>>>>>> default skin wip
            var setAttribute = prototype.setAttribute;
            prototype.setAttribute = function(name, value) {
                changeAttribute.call(this, name, value, setAttribute);
            };
            var removeAttribute = prototype.removeAttribute;
<<<<<<< HEAD
            prototype.removeAttribute = function(name) {
                changeAttribute.call(this, name, null, removeAttribute);
            };
            prototype.setAttribute._polyfilled = true;
=======
            prototype.removeAttribute = function(name, value) {
                changeAttribute.call(this, name, value, removeAttribute);
            };
>>>>>>> default skin wip
        }
        function changeAttribute(name, value, operation) {
            var oldValue = this.getAttribute(name);
            operation.apply(this, arguments);
<<<<<<< HEAD
            var newValue = this.getAttribute(name);
            if (this.attributeChangedCallback && newValue !== oldValue) {
                this.attributeChangedCallback(name, oldValue, newValue);
=======
            if (this.attributeChangedCallback && this.getAttribute(name) !== oldValue) {
                this.attributeChangedCallback(name, oldValue);
>>>>>>> default skin wip
            }
        }
        var registry = {};
        function registerDefinition(name, definition) {
            registry[name] = definition;
        }
        function generateConstructor(definition) {
            return function() {
                return instantiate(definition);
            };
        }
        function createElement(tag, typeExtension) {
            var definition = registry[typeExtension || tag];
            if (definition) {
                return new definition.ctor();
            }
            return domCreateElement(tag);
        }
        function upgradeElement(element) {
            if (!element.__upgraded__ && element.nodeType === Node.ELEMENT_NODE) {
                var type = element.getAttribute("is") || element.localName;
                var definition = registry[type];
                return definition && upgrade(element, definition);
            }
        }
        function cloneNode(deep) {
            var n = domCloneNode.call(this, deep);
            scope.upgradeAll(n);
            return n;
        }
        var domCreateElement = document.createElement.bind(document);
        var domCloneNode = Node.prototype.cloneNode;
        document.register = register;
        document.createElement = createElement;
        Node.prototype.cloneNode = cloneNode;
        scope.registry = registry;
        scope.upgrade = upgradeElement;
    }
    scope.hasNative = hasNative;
    scope.useNative = useNative;
})(window.CustomElements);

(function(scope) {
    var logFlags = window.logFlags || {};
    function findAll(node, find, data) {
        var e = node.firstElementChild;
        if (!e) {
            e = node.firstChild;
            while (e && e.nodeType !== Node.ELEMENT_NODE) {
                e = e.nextSibling;
            }
        }
        while (e) {
            if (find(e, data) !== true) {
                findAll(e, find, data);
            }
            e = e.nextElementSibling;
        }
        return null;
    }
    function forRoots(node, cb) {
        var root = node.shadowRoot;
        while (root) {
            forSubtree(root, cb);
            root = root.olderShadowRoot;
        }
    }
    function forSubtree(node, cb) {
        findAll(node, function(e) {
            if (cb(e)) {
                return true;
            }
            forRoots(e, cb);
        });
        forRoots(node, cb);
    }
    function added(node) {
        if (upgrade(node)) {
            insertedNode(node);
            return true;
        }
        inserted(node);
    }
    function addedSubtree(node) {
        forSubtree(node, function(e) {
            if (added(e)) {
                return true;
            }
        });
    }
    function addedNode(node) {
        return added(node) || addedSubtree(node);
    }
    function upgrade(node) {
        if (!node.__upgraded__ && node.nodeType === Node.ELEMENT_NODE) {
            var type = node.getAttribute("is") || node.localName;
            var definition = scope.registry[type];
            if (definition) {
                logFlags.dom && console.group("upgrade:", node.localName);
                scope.upgrade(node);
                logFlags.dom && console.groupEnd();
                return true;
            }
        }
    }
    function insertedNode(node) {
        inserted(node);
        if (inDocument(node)) {
            forSubtree(node, function(e) {
                inserted(e);
            });
        }
    }
    var hasPolyfillMutations = !window.MutationObserver || window.MutationObserver === window.JsMutationObserver;
    scope.hasPolyfillMutations = hasPolyfillMutations;
    var isPendingMutations = false;
    var pendingMutations = [];
    function deferMutation(fn) {
        pendingMutations.push(fn);
        if (!isPendingMutations) {
            isPendingMutations = true;
            var async = window.Platform && window.Platform.endOfMicrotask || setTimeout;
            async(takeMutations);
        }
    }
    function takeMutations() {
        isPendingMutations = false;
        var $p = pendingMutations;
        for (var i = 0, l = $p.length, p; i < l && (p = $p[i]); i++) {
            p();
        }
        pendingMutations = [];
    }
    function inserted(element) {
        if (hasPolyfillMutations) {
            deferMutation(function() {
                _inserted(element);
            });
        } else {
            _inserted(element);
        }
    }
    function _inserted(element) {
        if (element.enteredViewCallback || element.__upgraded__ && logFlags.dom) {
            logFlags.dom && console.group("inserted:", element.localName);
            if (inDocument(element)) {
                element.__inserted = (element.__inserted || 0) + 1;
                if (element.__inserted < 1) {
                    element.__inserted = 1;
                }
                if (element.__inserted > 1) {
                    logFlags.dom && console.warn("inserted:", element.localName, "insert/remove count:", element.__inserted);
                } else if (element.enteredViewCallback) {
                    logFlags.dom && console.log("inserted:", element.localName);
                    element.enteredViewCallback();
                }
            }
            logFlags.dom && console.groupEnd();
        }
    }
    function removedNode(node) {
        removed(node);
        forSubtree(node, function(e) {
            removed(e);
        });
    }
    function removed(element) {
        if (hasPolyfillMutations) {
            deferMutation(function() {
                _removed(element);
            });
        } else {
            _removed(element);
        }
    }
<<<<<<< HEAD
    function _removed(element) {
=======
    function removed(element) {
>>>>>>> default skin wip
        if (element.leftViewCallback || element.__upgraded__ && logFlags.dom) {
            logFlags.dom && console.log("removed:", element.localName);
            if (!inDocument(element)) {
                element.__inserted = (element.__inserted || 0) - 1;
                if (element.__inserted > 0) {
                    element.__inserted = 0;
                }
                if (element.__inserted < 0) {
                    logFlags.dom && console.warn("removed:", element.localName, "insert/remove count:", element.__inserted);
                } else if (element.leftViewCallback) {
                    element.leftViewCallback();
                }
            }
        }
    }
    function inDocument(element) {
        var p = element;
        var doc = window.ShadowDOMPolyfill && window.ShadowDOMPolyfill.wrapIfNeeded(document) || document;
        while (p) {
            if (p == doc) {
                return true;
            }
            p = p.parentNode || p.host;
        }
    }
    function watchShadow(node) {
        if (node.shadowRoot && !node.shadowRoot.__watched) {
            logFlags.dom && console.log("watching shadow-root for: ", node.localName);
            var root = node.shadowRoot;
            while (root) {
                watchRoot(root);
                root = root.olderShadowRoot;
            }
        }
    }
    function watchRoot(root) {
        if (!root.__watched) {
            observe(root);
            root.__watched = true;
        }
    }
<<<<<<< HEAD
=======
    function filter(inNode) {
        switch (inNode.localName) {
          case "style":
          case "script":
          case "template":
          case undefined:
            return true;
        }
    }
>>>>>>> default skin wip
    function handler(mutations) {
        if (logFlags.dom) {
            var mx = mutations[0];
            if (mx && mx.type === "childList" && mx.addedNodes) {
                if (mx.addedNodes) {
                    var d = mx.addedNodes[0];
                    while (d && d !== document && !d.host) {
                        d = d.parentNode;
                    }
                    var u = d && (d.URL || d._URL || d.host && d.host.localName) || "";
                    u = u.split("/?").shift().split("/").pop();
                }
            }
            console.group("mutations (%d) [%s]", mutations.length, u || "");
        }
        mutations.forEach(function(mx) {
            if (mx.type === "childList") {
                forEach(mx.addedNodes, function(n) {
<<<<<<< HEAD
                    if (!n.localName) {
=======
                    if (filter(n)) {
>>>>>>> default skin wip
                        return;
                    }
                    addedNode(n);
                });
                forEach(mx.removedNodes, function(n) {
<<<<<<< HEAD
                    if (!n.localName) {
=======
                    if (filter(n)) {
>>>>>>> default skin wip
                        return;
                    }
                    removedNode(n);
                });
            }
        });
        logFlags.dom && console.groupEnd();
    }
    var observer = new MutationObserver(handler);
    function takeRecords() {
        handler(observer.takeRecords());
        takeMutations();
    }
    var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);
    function observe(inRoot) {
        observer.observe(inRoot, {
            childList: true,
            subtree: true
        });
    }
    function observeDocument(document) {
        observe(document);
    }
    function upgradeDocument(document) {
        logFlags.dom && console.group("upgradeDocument: ", (document.URL || document._URL || "").split("/").pop());
        addedNode(document);
        logFlags.dom && console.groupEnd();
    }
    scope.watchShadow = watchShadow;
    scope.upgradeAll = addedNode;
    scope.upgradeSubtree = addedSubtree;
    scope.observeDocument = observeDocument;
    scope.upgradeDocument = upgradeDocument;
    scope.takeRecords = takeRecords;
})(window.CustomElements);

(function() {
    var IMPORT_LINK_TYPE = window.HTMLImports ? HTMLImports.IMPORT_LINK_TYPE : "none";
    var parser = {
        selectors: [ "link[rel=" + IMPORT_LINK_TYPE + "]" ],
        map: {
            link: "parseLink"
        },
        parse: function(inDocument) {
            if (!inDocument.__parsed) {
                inDocument.__parsed = true;
                var elts = inDocument.querySelectorAll(parser.selectors);
                forEach(elts, function(e) {
                    parser[parser.map[e.localName]](e);
                });
                CustomElements.upgradeDocument(inDocument);
                CustomElements.observeDocument(inDocument);
            }
        },
        parseLink: function(linkElt) {
            if (isDocumentLink(linkElt)) {
                this.parseImport(linkElt);
            }
        },
        parseImport: function(linkElt) {
            if (linkElt.content) {
                parser.parse(linkElt.content);
            }
        }
    };
    function isDocumentLink(inElt) {
        return inElt.localName === "link" && inElt.getAttribute("rel") === IMPORT_LINK_TYPE;
    }
    var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);
    CustomElements.parser = parser;
})();

<<<<<<< HEAD
(function(scope) {
=======
(function() {
>>>>>>> default skin wip
    function bootstrap() {
        CustomElements.parser.parse(document);
        CustomElements.upgradeDocument(document);
        var async = window.Platform && Platform.endOfMicrotask ? Platform.endOfMicrotask : setTimeout;
        async(function() {
            CustomElements.ready = true;
            CustomElements.readyTime = Date.now();
            if (window.HTMLImports) {
                CustomElements.elapsed = CustomElements.readyTime - HTMLImports.readyTime;
            }
            document.body.dispatchEvent(new CustomEvent("WebComponentsReady", {
                bubbles: true
            }));
        });
    }
    if (typeof window.CustomEvent !== "function") {
        window.CustomEvent = function(inType) {
            var e = document.createEvent("HTMLEvents");
            e.initEvent(inType, true, true);
            return e;
        };
    }
<<<<<<< HEAD
    if (document.readyState === "complete" || scope.flags.eager) {
        bootstrap();
    } else if (document.readyState === "interactive" && !window.attachEvent && (!window.HTMLImports || window.HTMLImports.ready)) {
=======
    if (document.readyState === "complete") {
>>>>>>> default skin wip
        bootstrap();
    } else {
        var loadEvent = window.HTMLImports ? "HTMLImportsLoaded" : "DOMContentLoaded";
        window.addEventListener(loadEvent, bootstrap);
    }
<<<<<<< HEAD
})(window.CustomElements);
=======
})();
>>>>>>> default skin wip

(function() {
    var win = window, doc = document, noop = function() {}, trueop = function() {
        return true;
    }, regexPseudoSplit = /([\w-]+(?:\([^\)]+\))?)/g, regexPseudoReplace = /(\w*)(?:\(([^\)]*)\))?/, regexDigits = /(\d+)/g, keypseudo = {
        action: function(pseudo, event) {
            return pseudo.value.match(regexDigits).indexOf(String(event.keyCode)) > -1 == (pseudo.name == "keypass") || null;
        }
    }, prefix = function() {
        var styles = win.getComputedStyle(doc.documentElement, ""), pre = (Array.prototype.slice.call(styles).join("").match(/-(moz|webkit|ms)-/) || styles.OLink === "" && [ "", "o" ])[1];
        return {
            dom: pre == "ms" ? "MS" : pre,
            lowercase: pre,
            css: "-" + pre + "-",
            js: pre == "ms" ? pre : pre[0].toUpperCase() + pre.substr(1)
        };
    }(), matchSelector = Element.prototype.matchesSelector || Element.prototype[prefix.lowercase + "MatchesSelector"], mutation = win.MutationObserver || win[prefix.js + "MutationObserver"];
    var typeCache = {}, typeString = typeCache.toString, typeRegexp = /\s([a-zA-Z]+)/;
    function typeOf(obj) {
        var type = typeString.call(obj);
        return typeCache[type] || (typeCache[type] = type.match(typeRegexp)[1].toLowerCase());
    }
    function clone(item, type) {
        var fn = clone[type || typeOf(item)];
        return fn ? fn(item) : item;
    }
    clone.object = function(src) {
        var obj = {};
        for (var key in src) obj[key] = clone(src[key]);
        return obj;
    };
    clone.array = function(src) {
        var i = src.length, array = new Array(i);
        while (i--) array[i] = clone(src[i]);
        return array;
    };
    var unsliceable = [ "undefined", "null", "number", "boolean", "string", "function" ];
    function toArray(obj) {
        return unsliceable.indexOf(typeOf(obj)) == -1 ? Array.prototype.slice.call(obj, 0) : [ obj ];
    }
    var str = "";
    function query(element, selector) {
        return (selector || str).length ? toArray(element.querySelectorAll(selector)) : [];
    }
    function parseMutations(element, mutations) {
        var diff = {
            added: [],
            removed: []
        };
        mutations.forEach(function(record) {
            record._mutation = true;
            for (var z in diff) {
                var type = element._records[z == "added" ? "inserted" : "removed"], nodes = record[z + "Nodes"], length = nodes.length;
                for (var i = 0; i < length && diff[z].indexOf(nodes[i]) == -1; i++) {
                    diff[z].push(nodes[i]);
                    type.forEach(function(fn) {
                        fn(nodes[i], record);
                    });
                }
            }
        });
    }
    function mergeOne(source, key, current) {
        var type = typeOf(current);
        if (type == "object" && typeOf(source[key]) == "object") xtag.merge(source[key], current); else source[key] = clone(current, type);
        return source;
    }
    function wrapMixin(tag, key, pseudo, value, original) {
        if (typeof original[key] != "function") original[key] = value; else {
            original[key] = xtag.wrap(original[key], xtag.applyPseudos(pseudo, value, tag.pseudos));
        }
    }
    var uniqueMixinCount = 0;
    function mergeMixin(tag, mixin, original, mix) {
        if (mix) {
            var uniques = {};
            for (var z in original) uniques[z.split(":")[0]] = z;
            for (z in mixin) {
                wrapMixin(tag, uniques[z.split(":")[0]] || z, z, mixin[z], original);
            }
        } else {
            for (var zz in mixin) {
                wrapMixin(tag, zz + ":__mixin__(" + uniqueMixinCount++ + ")", zz, mixin[zz], original);
            }
        }
    }
    function applyMixins(tag) {
        tag.mixins.forEach(function(name) {
            var mixin = xtag.mixins[name];
            for (var type in mixin) {
                var item = mixin[type], original = tag[type];
                if (!original) tag[type] = item; else {
                    switch (type) {
                      case "accessors":
                      case "prototype":
                        for (var z in item) {
                            if (!original[z]) original[z] = item[z]; else mergeMixin(tag, item[z], original[z], true);
                        }
                        break;

                      default:
                        mergeMixin(tag, item, original, type != "events");
                    }
                }
            }
        });
        return tag;
    }
    function delegateAction(pseudo, event) {
        var match, target = event.target;
<<<<<<< HEAD
        if (!target.tagName) return null;
=======
>>>>>>> default skin wip
        if (xtag.matchSelector(target, pseudo.value)) match = target; else if (xtag.matchSelector(target, pseudo.value + " *")) {
            var parent = target.parentNode;
            while (!match) {
                if (xtag.matchSelector(parent, pseudo.value)) match = parent;
                parent = parent.parentNode;
            }
        }
        return match ? pseudo.listener = pseudo.listener.bind(match) : null;
    }
    function touchFilter(event) {
        if (event.type.match("touch")) {
            event.target.__touched__ = true;
        } else if (event.target.__touched__ && event.type.match("mouse")) {
            delete event.target.__touched__;
            return;
        }
        return true;
    }
    function createFlowEvent(type) {
        var flow = type == "over";
        return {
            attach: "OverflowEvent" in win ? "overflowchanged" : [],
            condition: function(event, custom) {
                event.flow = type;
                return event.type == type + "flow" || event.orient === 0 && event.horizontalOverflow == flow || event.orient == 1 && event.verticalOverflow == flow || event.orient == 2 && event.horizontalOverflow == flow && event.verticalOverflow == flow;
            }
        };
    }
    function writeProperty(key, event, base, desc) {
        if (desc) event[key] = base[key]; else Object.defineProperty(event, key, {
            writable: true,
            enumerable: true,
            value: base[key]
        });
    }
    var skipProps = {};
    for (var z in document.createEvent("CustomEvent")) skipProps[z] = 1;
    function inheritEvent(event, base) {
        var desc = Object.getOwnPropertyDescriptor(event, "target");
        for (var z in base) {
            if (!skipProps[z]) writeProperty(z, event, base, desc);
        }
        event.baseEvent = base;
    }
    function getArgs(attr, value) {
        return {
            value: attr.boolean ? "" : value,
            method: attr.boolean && !value ? "removeAttribute" : "setAttribute"
        };
    }
    function modAttr(element, attr, name, value) {
        var args = getArgs(attr, value);
        element[args.method](name, args.value);
    }
    function syncAttr(element, attr, name, value, method) {
        var nodes = attr.property ? [ element.xtag[attr.property] ] : attr.selector ? xtag.query(element, attr.selector) : [], index = nodes.length;
        while (index--) nodes[index][method](name, value);
    }
    function updateView(element, name, value) {
        if (element.__view__) {
            element.__view__.updateBindingValue(element, name, value);
        }
    }
    function attachProperties(tag, prop, z, accessor, attr, name) {
        var key = z.split(":"), type = key[0];
        if (type == "get") {
            key[0] = prop;
            tag.prototype[prop].get = xtag.applyPseudos(key.join(":"), accessor[z], tag.pseudos);
        } else if (type == "set") {
            key[0] = prop;
            var setter = tag.prototype[prop].set = xtag.applyPseudos(key.join(":"), attr ? function(value) {
                this.xtag._skipSet = true;
                if (!this.xtag._skipAttr) modAttr(this, attr, name, value);
                if (this.xtag._skipAttr && attr.skip) delete this.xtag._skipAttr;
                accessor[z].call(this, attr.boolean ? !!value : value);
                updateView(this, name, value);
                delete this.xtag._skipSet;
            } : accessor[z] ? function(value) {
                accessor[z].call(this, value);
                updateView(this, name, value);
            } : null, tag.pseudos);
            if (attr) attr.setter = setter;
        } else tag.prototype[prop][z] = accessor[z];
    }
    function parseAccessor(tag, prop) {
        tag.prototype[prop] = {};
        var accessor = tag.accessors[prop], attr = accessor.attribute, name = attr && attr.name ? attr.name.toLowerCase() : prop;
        if (attr) {
            attr.key = prop;
            tag.attributes[name] = attr;
        }
        for (var z in accessor) attachProperties(tag, prop, z, accessor, attr, name);
        if (attr) {
            if (!tag.prototype[prop].get) {
                var method = (attr.boolean ? "has" : "get") + "Attribute";
                tag.prototype[prop].get = function() {
                    return this[method](name);
                };
            }
            if (!tag.prototype[prop].set) tag.prototype[prop].set = function(value) {
                modAttr(this, attr, name, value);
                updateView(this, name, value);
            };
        }
    }
    var readyTags = {};
    function fireReady(name) {
        readyTags[name] = (readyTags[name] || []).filter(function(obj) {
            return (obj.tags = obj.tags.filter(function(z) {
                return z != name && !xtag.tags[z];
            })).length || obj.fn();
        });
    }
    var xtag = {
        tags: {},
        defaultOptions: {
            pseudos: [],
            mixins: [],
            events: {},
            methods: {},
            accessors: {},
            lifecycle: {},
            attributes: {},
            prototype: {
                xtag: {
                    get: function() {
                        return this.__xtag__ ? this.__xtag__ : this.__xtag__ = {
                            data: {}
                        };
                    }
                }
            }
        },
        register: function(name, options) {
            var _name;
            if (typeof name == "string") {
                _name = name.toLowerCase();
            } else {
                return;
            }
            var basePrototype = options.prototype;
            delete options.prototype;
            var tag = xtag.tags[_name] = applyMixins(xtag.merge({}, xtag.defaultOptions, options));
            for (var z in tag.events) tag.events[z] = xtag.parseEvent(z, tag.events[z]);
            for (z in tag.lifecycle) tag.lifecycle[z.split(":")[0]] = xtag.applyPseudos(z, tag.lifecycle[z], tag.pseudos);
            for (z in tag.methods) tag.prototype[z.split(":")[0]] = {
                value: xtag.applyPseudos(z, tag.methods[z], tag.pseudos),
                enumerable: true
            };
            for (z in tag.accessors) parseAccessor(tag, z);
            var ready = tag.lifecycle.created || tag.lifecycle.ready;
            tag.prototype.createdCallback = {
                enumerable: true,
                value: function() {
                    var element = this;
                    xtag.addEvents(this, tag.events);
                    tag.mixins.forEach(function(mixin) {
                        if (xtag.mixins[mixin].events) xtag.addEvents(element, xtag.mixins[mixin].events);
                    });
                    var output = ready ? ready.apply(this, toArray(arguments)) : null;
                    for (var name in tag.attributes) {
                        var attr = tag.attributes[name], hasAttr = this.hasAttribute(name);
                        if (hasAttr || attr.boolean) {
                            this[attr.key] = attr.boolean ? hasAttr : this.getAttribute(name);
                        }
                    }
                    tag.pseudos.forEach(function(obj) {
                        obj.onAdd.call(element, obj);
                    });
                    return output;
                }
            };
            if (tag.lifecycle.inserted) tag.prototype.enteredViewCallback = {
                value: tag.lifecycle.inserted,
                enumerable: true
            };
<<<<<<< HEAD
            if (tag.lifecycle.removed) tag.prototype.leftViewCallback = {
=======
            if (tag.lifecycle.removed) tag.prototype.leftDocumentCallback = {
>>>>>>> default skin wip
                value: tag.lifecycle.removed,
                enumerable: true
            };
            if (tag.lifecycle.attributeChanged) tag.prototype.attributeChangedCallback = {
                value: tag.lifecycle.attributeChanged,
                enumerable: true
            };
            var setAttribute = tag.prototype.setAttribute || HTMLElement.prototype.setAttribute;
            tag.prototype.setAttribute = {
                writable: true,
                enumberable: true,
                value: function(name, value) {
                    var attr = tag.attributes[name.toLowerCase()];
                    if (!this.xtag._skipAttr) setAttribute.call(this, name, attr && attr.boolean ? "" : value);
                    if (attr) {
                        if (attr.setter && !this.xtag._skipSet) {
                            this.xtag._skipAttr = true;
                            attr.setter.call(this, attr.boolean ? true : value);
                        }
                        value = attr.skip ? attr.boolean ? this.hasAttribute(name) : this.getAttribute(name) : value;
                        syncAttr(this, attr, name, attr.boolean ? "" : value, "setAttribute");
                    }
                    delete this.xtag._skipAttr;
                }
            };
            var removeAttribute = tag.prototype.removeAttribute || HTMLElement.prototype.removeAttribute;
            tag.prototype.removeAttribute = {
                writable: true,
                enumberable: true,
                value: function(name) {
                    var attr = tag.attributes[name.toLowerCase()];
                    if (!this.xtag._skipAttr) removeAttribute.call(this, name);
                    if (attr) {
                        if (attr.setter && !this.xtag._skipSet) {
                            this.xtag._skipAttr = true;
                            attr.setter.call(this, attr.boolean ? false : undefined);
                        }
                        syncAttr(this, attr, name, undefined, "removeAttribute");
                    }
                    delete this.xtag._skipAttr;
                }
            };
            var elementProto = basePrototype ? basePrototype : options["extends"] ? Object.create(doc.createElement(options["extends"]).constructor).prototype : win.HTMLElement.prototype;
            var definition = {
                prototype: Object.create(elementProto, tag.prototype)
            };
            if (options["extends"]) {
                definition["extends"] = options["extends"];
            }
            var reg = doc.register(_name, definition);
            fireReady(_name);
            return reg;
        },
        ready: function(names, fn) {
            var obj = {
                tags: toArray(names),
                fn: fn
            };
            if (obj.tags.reduce(function(last, name) {
                if (xtag.tags[name]) return last;
                (readyTags[name] = readyTags[name] || []).push(obj);
            }, true)) fn();
        },
        mixins: {},
        prefix: prefix,
        captureEvents: [ "focus", "blur", "scroll", "underflow", "overflow", "overflowchanged", "DOMMouseScroll" ],
        customEvents: {
            overflow: createFlowEvent("over"),
            underflow: createFlowEvent("under"),
            animationstart: {
                attach: [ prefix.dom + "AnimationStart" ]
            },
            animationend: {
                attach: [ prefix.dom + "AnimationEnd" ]
            },
            transitionend: {
                attach: [ prefix.dom + "TransitionEnd" ]
            },
            move: {
                attach: [ "mousemove", "touchmove" ],
                condition: touchFilter
            },
            enter: {
                attach: [ "mouseover", "touchenter" ],
                condition: touchFilter
            },
            leave: {
                attach: [ "mouseout", "touchleave" ],
                condition: touchFilter
            },
            scrollwheel: {
                attach: [ "DOMMouseScroll", "mousewheel" ],
                condition: function(event) {
                    event.delta = event.wheelDelta ? event.wheelDelta / 40 : Math.round(event.detail / 3.5 * -1);
                    return true;
                }
            },
            tapstart: {
                observe: {
                    mousedown: doc,
                    touchstart: doc
                },
                condition: touchFilter
            },
            tapend: {
                observe: {
                    mouseup: doc,
                    touchend: doc
                },
                condition: touchFilter
            },
            tapmove: {
                attach: [ "tapstart", "dragend", "touchcancel" ],
                condition: function(event, custom) {
                    switch (event.type) {
                      case "move":
                        return true;

                      case "dragover":
                        var last = custom.lastDrag || {};
                        custom.lastDrag = event;
                        return last.pageX != event.pageX && last.pageY != event.pageY || null;

                      case "tapstart":
                        if (!custom.move) {
                            custom.current = this;
                            custom.move = xtag.addEvents(this, {
                                move: custom.listener,
                                dragover: custom.listener
                            });
                            custom.tapend = xtag.addEvent(doc, "tapend", custom.listener);
                        }
                        break;

                      case "tapend":
                      case "dragend":
                      case "touchcancel":
                        if (!event.touches.length) {
                            if (custom.move) xtag.removeEvents(custom.current, custom.move || {});
                            if (custom.tapend) xtag.removeEvent(doc, custom.tapend || {});
                            delete custom.lastDrag;
                            delete custom.current;
                            delete custom.tapend;
                            delete custom.move;
                        }
                    }
                }
            }
        },
        pseudos: {
            __mixin__: {},
            keypass: keypseudo,
            keyfail: keypseudo,
            delegate: {
                action: delegateAction
            },
            within: {
                action: delegateAction,
                onAdd: function(pseudo) {
                    var condition = pseudo.source.condition;
                    if (condition) pseudo.source.condition = function(event, custom) {
                        return xtag.query(this, pseudo.value).filter(function(node) {
                            return node == event.target || node.contains ? node.contains(event.target) : null;
                        })[0] ? condition.call(this, event, custom) : null;
                    };
                }
            },
            preventable: {
                action: function(pseudo, event) {
                    return !event.defaultPrevented;
                }
            }
        },
        clone: clone,
        typeOf: typeOf,
        toArray: toArray,
        wrap: function(original, fn) {
            return function() {
                var args = toArray(arguments), output = original.apply(this, args);
                fn.apply(this, args);
                return output;
            };
        },
        merge: function(source, k, v) {
            if (typeOf(k) == "string") return mergeOne(source, k, v);
            for (var i = 1, l = arguments.length; i < l; i++) {
                var object = arguments[i];
                for (var key in object) mergeOne(source, key, object[key]);
            }
            return source;
        },
        uid: function() {
            return Math.random().toString(36).substr(2, 10);
        },
        query: query,
        skipTransition: function(element, fn) {
            var prop = prefix.js + "TransitionProperty";
            element.style[prop] = element.style.transitionProperty = "none";
            var callback = fn();
            return xtag.requestFrame(function() {
                xtag.requestFrame(function() {
                    element.style[prop] = element.style.transitionProperty = "";
                    if (callback) xtag.requestFrame(callback);
                });
            });
        },
        requestFrame: function() {
            var raf = win.requestAnimationFrame || win[prefix.lowercase + "RequestAnimationFrame"] || function(fn) {
                return win.setTimeout(fn, 20);
            };
            return function(fn) {
                return raf(fn);
            };
        }(),
        cancelFrame: function() {
            var cancel = win.cancelAnimationFrame || win[prefix.lowercase + "CancelAnimationFrame"] || win.clearTimeout;
            return function(id) {
                return cancel(id);
            };
        }(),
        matchSelector: function(element, selector) {
            return matchSelector.call(element, selector);
        },
        set: function(element, method, value) {
            element[method] = value;
            if (window.CustomElements) CustomElements.upgradeAll(element);
        },
        innerHTML: function(el, html) {
            xtag.set(el, "innerHTML", html);
        },
        hasClass: function(element, klass) {
            return element.className.split(" ").indexOf(klass.trim()) > -1;
        },
        addClass: function(element, klass) {
            var list = element.className.trim().split(" ");
            klass.trim().split(" ").forEach(function(name) {
                if (!~list.indexOf(name)) list.push(name);
            });
            element.className = list.join(" ").trim();
            return element;
        },
        removeClass: function(element, klass) {
            var classes = klass.trim().split(" ");
            element.className = element.className.trim().split(" ").filter(function(name) {
                return name && !~classes.indexOf(name);
            }).join(" ");
            return element;
        },
        toggleClass: function(element, klass) {
            return xtag[xtag.hasClass(element, klass) ? "removeClass" : "addClass"].call(null, element, klass);
        },
        queryChildren: function(element, selector) {
            var id = element.id, guid = element.id = id || "x_" + xtag.uid(), attr = "#" + guid + " > ";
            selector = attr + (selector + "").replace(",", "," + attr, "g");
            var result = element.parentNode.querySelectorAll(selector);
            if (!id) element.removeAttribute("id");
            return toArray(result);
        },
        createFragment: function(content) {
            var frag = doc.createDocumentFragment();
            if (content) {
                var div = frag.appendChild(doc.createElement("div")), nodes = toArray(content.nodeName ? arguments : !(div.innerHTML = content) || div.children), length = nodes.length, index = 0;
                while (index < length) frag.insertBefore(nodes[index++], div);
                frag.removeChild(div);
            }
            return frag;
        },
        manipulate: function(element, fn) {
            var next = element.nextSibling, parent = element.parentNode, frag = doc.createDocumentFragment(), returned = fn.call(frag.appendChild(element), frag) || element;
            if (next) parent.insertBefore(returned, next); else parent.appendChild(returned);
        },
        applyPseudos: function(key, fn, target, source) {
            var listener = fn, pseudos = {};
            if (key.match(":")) {
                var split = key.match(regexPseudoSplit), i = split.length;
                while (--i) {
                    split[i].replace(regexPseudoReplace, function(match, name, value) {
                        if (!xtag.pseudos[name]) throw "pseudo not found: " + name + " " + split;
                        var pseudo = pseudos[i] = Object.create(xtag.pseudos[name]);
                        pseudo.key = key;
                        pseudo.name = name;
                        pseudo.value = value;
                        pseudo["arguments"] = (value || "").split(",");
                        pseudo.action = pseudo.action || trueop;
                        pseudo.source = source;
                        var last = listener;
                        listener = function() {
                            var args = toArray(arguments), obj = {
                                key: key,
                                name: name,
                                value: value,
                                source: source,
                                arguments: pseudo["arguments"],
                                listener: last
                            };
                            var output = pseudo.action.apply(this, [ obj ].concat(args));
                            if (output === null || output === false) return output;
                            return obj.listener.apply(this, args);
                        };
                        if (target && pseudo.onAdd) {
                            if (target.nodeName) pseudo.onAdd.call(target, pseudo); else target.push(pseudo);
                        }
                    });
                }
            }
            for (var z in pseudos) {
                if (pseudos[z].onCompiled) listener = pseudos[z].onCompiled(listener, pseudos[z]) || listener;
            }
            return listener;
        },
        removePseudos: function(target, pseudos) {
            pseudos.forEach(function(obj) {
                if (obj.onRemove) obj.onRemove.call(target, obj);
            });
        },
        parseEvent: function(type, fn) {
            var pseudos = type.split(":"), key = pseudos.shift(), custom = xtag.customEvents[key], event = xtag.merge({
                type: key,
                stack: noop,
                condition: trueop,
                attach: [],
                _attach: [],
                pseudos: "",
                _pseudos: [],
                onAdd: noop,
                onRemove: noop
            }, custom || {});
            event.attach = toArray(event.base || event.attach);
            event.chain = key + (event.pseudos.length ? ":" + event.pseudos : "") + (pseudos.length ? ":" + pseudos.join(":") : "");
            var condition = event.condition;
            event.condition = function(e) {
                var t = e.touches, tt = e.targetTouches;
                return condition.apply(this, toArray(arguments));
            };
            var stack = xtag.applyPseudos(event.chain, fn, event._pseudos, event);
            event.stack = function(e) {
                var t = e.touches, tt = e.targetTouches;
                var detail = e.detail || {};
                if (!detail.__stack__) return stack.apply(this, toArray(arguments)); else if (detail.__stack__ == stack) {
                    e.stopPropagation();
                    e.cancelBubble = true;
                    return stack.apply(this, toArray(arguments));
                }
            };
            event.listener = function(e) {
                var args = toArray(arguments), output = event.condition.apply(this, args.concat([ event ]));
                if (!output) return output;
                if (e.type != key) {
                    xtag.fireEvent(e.target, key, {
                        baseEvent: e,
                        detail: output !== true && (output.__stack__ = stack) ? output : {
                            __stack__: stack
                        }
                    });
                } else return event.stack.apply(this, args);
            };
            event.attach.forEach(function(name) {
                event._attach.push(xtag.parseEvent(name, event.listener));
            });
            if (custom && custom.observe && !custom.__observing__) {
                custom.observer = function(e) {
                    var output = event.condition.apply(this, toArray(arguments).concat([ custom ]));
                    if (!output) return output;
                    xtag.fireEvent(e.target, key, {
                        baseEvent: e,
                        detail: output !== true ? output : {}
                    });
                };
                for (var z in custom.observe) xtag.addEvent(custom.observe[z] || document, z, custom.observer, true);
                custom.__observing__ = true;
            }
            return event;
        },
        addEvent: function(element, type, fn, capture) {
            var event = typeof fn == "function" ? xtag.parseEvent(type, fn) : fn;
            event._pseudos.forEach(function(obj) {
                obj.onAdd.call(element, obj);
            });
            event._attach.forEach(function(obj) {
                xtag.addEvent(element, obj.type, obj);
            });
            event.onAdd.call(element, event, event.listener);
            element.addEventListener(event.type, event.stack, capture || xtag.captureEvents.indexOf(event.type) > -1);
            return event;
        },
        addEvents: function(element, obj) {
            var events = {};
            for (var z in obj) {
                events[z] = xtag.addEvent(element, z, obj[z]);
            }
            return events;
        },
        removeEvent: function(element, type, event) {
            event = event || type;
            event.onRemove.call(element, event, event.listener);
            xtag.removePseudos(element, event._pseudos);
            event._attach.forEach(function(obj) {
                xtag.removeEvent(element, obj);
            });
            element.removeEventListener(event.type, event.stack);
        },
        removeEvents: function(element, obj) {
            for (var z in obj) xtag.removeEvent(element, obj[z]);
        },
        fireEvent: function(element, type, options, warn) {
            var event = doc.createEvent("CustomEvent");
            options = options || {};
            if (warn) console.warn("fireEvent has been modified");
            event.initCustomEvent(type, options.bubbles !== false, options.cancelable !== false, options.detail);
            if (options.baseEvent) inheritEvent(event, options.baseEvent);
            try {
                element.dispatchEvent(event);
            } catch (e) {
                console.warn("This error may have been caused by a change in the fireEvent method", e);
            }
        },
        addObserver: function(element, type, fn) {
            if (!element._records) {
                element._records = {
                    inserted: [],
                    removed: []
                };
                if (mutation) {
                    element._observer = new mutation(function(mutations) {
                        parseMutations(element, mutations);
                    });
                    element._observer.observe(element, {
                        subtree: true,
                        childList: true,
                        attributes: !true,
                        characterData: false
                    });
                } else [ "Inserted", "Removed" ].forEach(function(type) {
                    element.addEventListener("DOMNode" + type, function(event) {
                        event._mutation = true;
                        element._records[type.toLowerCase()].forEach(function(fn) {
                            fn(event.target, event);
                        });
                    }, false);
                });
            }
            if (element._records[type].indexOf(fn) == -1) element._records[type].push(fn);
        },
        removeObserver: function(element, type, fn) {
            var obj = element._records;
            if (obj && fn) {
                obj[type].splice(obj[type].indexOf(fn), 1);
            } else {
                obj[type] = [];
            }
        }
    };
    var touching = false, touchTarget = null;
    doc.addEventListener("mousedown", function(e) {
        touching = true;
        touchTarget = e.target;
    }, true);
    doc.addEventListener("mouseup", function() {
        touching = false;
        touchTarget = null;
    }, true);
    doc.addEventListener("dragend", function() {
        touching = false;
        touchTarget = null;
    }, true);
    var UIEventProto = {
        touches: {
            configurable: true,
            get: function() {
                return this.__touches__ || (this.identifier = 0) || (this.__touches__ = touching ? [ this ] : []);
            }
        },
        targetTouches: {
            configurable: true,
            get: function() {
                return this.__targetTouches__ || (this.__targetTouches__ = touching && this.currentTarget && (this.currentTarget == touchTarget || this.currentTarget.contains && this.currentTarget.contains(touchTarget)) ? (this.identifier = 0) || [ this ] : []);
            }
        },
        changedTouches: {
            configurable: true,
            get: function() {
                return this.__changedTouches__ || (this.identifier = 0) || (this.__changedTouches__ = [ this ]);
            }
        }
    };
    for (z in UIEventProto) {
        UIEvent.prototype[z] = UIEventProto[z];
        Object.defineProperty(UIEvent.prototype, z, UIEventProto[z]);
    }
    function addTap(el, tap, e) {
        if (!el.__tap__) {
            el.__tap__ = {
                click: e.type == "mousedown"
            };
            if (el.__tap__.click) el.addEventListener("click", tap.observer); else {
                el.__tap__.scroll = tap.observer.bind(el);
                window.addEventListener("scroll", el.__tap__.scroll, true);
                el.addEventListener("touchmove", tap.observer);
                el.addEventListener("touchcancel", tap.observer);
                el.addEventListener("touchend", tap.observer);
            }
        }
        if (!el.__tap__.click) {
            el.__tap__.x = e.touches[0].pageX;
            el.__tap__.y = e.touches[0].pageY;
        }
    }
    function removeTap(el, tap) {
        if (el.__tap__) {
            if (el.__tap__.click) el.removeEventListener("click", tap.observer); else {
                window.removeEventListener("scroll", el.__tap__.scroll, true);
                el.removeEventListener("touchmove", tap.observer);
                el.removeEventListener("touchcancel", tap.observer);
                el.removeEventListener("touchend", tap.observer);
            }
            delete el.__tap__;
        }
    }
    function checkTapPosition(el, tap, e) {
        var touch = e.changedTouches[0], tol = tap.gesture.tolerance;
        if (touch.pageX < el.__tap__.x + tol && touch.pageX > el.__tap__.x - tol && touch.pageY < el.__tap__.y + tol && touch.pageY > el.__tap__.y - tol) return true;
    }
    xtag.customEvents.tap = {
        observe: {
            mousedown: document,
            touchstart: document
        },
        gesture: {
            tolerance: 8
        },
        condition: function(e, tap) {
            var el = e.target;
            switch (e.type) {
              case "touchstart":
                if (el.__tap__ && el.__tap__.click) removeTap(el, tap);
                addTap(el, tap, e);
                return;

              case "mousedown":
                if (!el.__tap__) addTap(el, tap, e);
                return;

              case "scroll":
              case "touchcancel":
                removeTap(this, tap);
                return;

              case "touchmove":
              case "touchend":
                if (this.__tap__ && !checkTapPosition(this, tap, e)) {
                    removeTap(this, tap);
                    return;
                }
                return e.type == "touchend" || null;

              case "click":
                removeTap(this, tap);
                return true;
            }
        }
    };
    win.xtag = xtag;
    if (typeof define == "function" && define.amd) define(xtag);
    doc.addEventListener("WebComponentsReady", function() {
        xtag.fireEvent(doc.body, "DOMComponentsLoaded");
    });
})();

(function() {
    xtag.register("x-appbar", {
        lifecycle: {
            created: function() {
<<<<<<< HEAD
                var header = xtag.queryChildren(this, "h1,h2,h3,h4,h5,h6")[0];
                if (!header) {
                    header = document.createElement("h1");
=======
                var header = xtag.queryChildren(this, "header")[0];
                if (!header) {
                    header = document.createElement("header");
>>>>>>> default skin wip
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

(function() {
    var LEFT_MOUSE_BTN = 0;
    var GET_DEFAULT_LABELS = function() {
        return {
            prev: "←",
            next: "→",
            months: [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
            weekdays: [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ]
        };
    };
    function normalize(localDate) {
        var normalizedDate = new Date(localDate.valueOf());
        normalizedDate.setHours(0);
        normalizedDate.setMinutes(0);
        normalizedDate.setSeconds(0);
        normalizedDate.setMilliseconds(0);
        return normalizedDate;
    }
    var TODAY = normalize(new Date());
    var DRAG_ADD = "add";
    var DRAG_REMOVE = "remove";
    var CHOSEN_CLASS = "chosen";
    var className = "className";
    function appendChild(parent, child) {
        parent.appendChild(child);
    }
    function parseIntDec(num) {
        return parseInt(num, 10);
    }
    function isWeekdayNum(dayNum) {
        var dayInt = parseIntDec(dayNum);
        return dayInt === dayNum && !isNaN(dayInt) && dayInt >= 0 && dayInt <= 6;
    }
    function isValidDateObj(d) {
        return d instanceof Date && !!d.getTime && !isNaN(d.getTime());
    }
    function isArray(a) {
        if (a && a.isArray) {
            return a.isArray();
        } else {
            return Object.prototype.toString.call(a) === "[object Array]";
        }
    }
    function makeEl(s) {
        var a = s.split(".");
        var tag = a.shift();
        var el = document.createElement(tag);
        el[className] = a.join(" ");
        return el;
    }
    function getWindowViewport() {
        var docElem = document.documentElement;
        var rect = {
            left: docElem.scrollLeft || document.body.scrollLeft || 0,
            top: docElem.scrollTop || document.body.scrollTop || 0,
            width: docElem.clientWidth,
            height: docElem.clientHeight
        };
        rect.right = rect.left + rect.width;
        rect.bottom = rect.top + rect.height;
        return rect;
    }
    function getRect(el) {
        var rect = el.getBoundingClientRect();
        var viewport = getWindowViewport();
        var docScrollLeft = viewport.left;
        var docScrollTop = viewport.top;
        return {
            left: rect.left + docScrollLeft,
            right: rect.right + docScrollLeft,
            top: rect.top + docScrollTop,
            bottom: rect.bottom + docScrollTop,
            width: rect.width,
            height: rect.height
        };
    }
    function addClass(el, c) {
        xtag.addClass(el, c);
    }
    function removeClass(el, c) {
        xtag.removeClass(el, c);
    }
    function hasClass(el, c) {
        return xtag.hasClass(el, c);
    }
    function getYear(d) {
        return d.getFullYear();
    }
    function getMonth(d) {
        return d.getMonth();
    }
    function getDate(d) {
        return d.getDate();
    }
    function getDay(d) {
        return d.getDay();
    }
    function pad(n, padSize) {
        var str = n.toString();
        var padZeros = new Array(padSize).join("0");
        return (padZeros + str).substr(-padSize);
    }
    function iso(d) {
        return [ pad(getYear(d), 4), pad(getMonth(d) + 1, 2), pad(getDate(d), 2) ].join("-");
    }
    var ISO_DATE_REGEX = /(\d{4})[^\d]?(\d{2})[^\d]?(\d{2})/;
    function fromIso(s) {
        if (isValidDateObj(s)) return s;
        var d = ISO_DATE_REGEX.exec(s);
        if (d) {
            return normalize(new Date(d[1], d[2] - 1, d[3]));
        } else {
            return null;
        }
    }
    function parseSingleDate(dateStr) {
        if (isValidDateObj(dateStr)) return dateStr;
        var isoParsed = fromIso(dateStr);
        if (isoParsed) {
            return isoParsed;
        } else {
            var parsedMs = Date.parse(dateStr);
            if (!isNaN(parsedMs)) {
                return normalize(new Date(parsedMs));
            }
            return null;
        }
    }
    function parseMultiDates(multiDateStr) {
        var ranges;
        if (isArray(multiDateStr)) {
            ranges = multiDateStr.slice(0);
        } else if (isValidDateObj(multiDateStr)) {
            return [ multiDateStr ];
        } else if (typeof multiDateStr === "string" && multiDateStr.length > 0) {
            try {
                ranges = JSON.parse(multiDateStr);
                if (!isArray(ranges)) {
                    console.warn("invalid list of ranges", multiDateStr);
                    return null;
                }
            } catch (err) {
                var parsedSingle = parseSingleDate(multiDateStr);
                if (parsedSingle) {
                    return [ parsedSingle ];
                } else {
                    console.warn("unable to parse", multiDateStr, "as JSON or single date");
                    return null;
                }
            }
        } else {
            return null;
        }
        for (var i = 0; i < ranges.length; i++) {
            var range = ranges[i];
            if (isValidDateObj(range)) {
                continue;
            } else if (typeof range === "string") {
                var parsedDate = parseSingleDate(range);
                if (!parsedDate) {
                    console.warn("unable to parse date", range);
                    return null;
                }
                ranges[i] = parsedDate;
            } else if (isArray(range) && range.length === 2) {
                var parsedStartDate = parseSingleDate(range[0]);
                if (!parsedStartDate) {
                    console.warn("unable to parse start date", range[0], "from range", range);
                    return null;
                }
                var parsedEndDate = parseSingleDate(range[1]);
                if (!parsedEndDate) {
                    console.warn("unable to parse end date", range[1], "from range", range);
                    return null;
                }
                if (parsedStartDate.valueOf() > parsedEndDate.valueOf()) {
                    console.warn("invalid range", range, ": start date is after end date");
                    return null;
                }
                ranges[i] = [ parsedStartDate, parsedEndDate ];
            } else {
                console.warn("invalid range value: ", range);
                return null;
            }
        }
        return ranges;
    }
    function from(base, y, m, d) {
        if (y === undefined) y = getYear(base);
        if (m === undefined) m = getMonth(base);
        if (d === undefined) d = getDate(base);
        return normalize(new Date(y, m, d));
    }
    function daysInMonth(month, year) {
        if (!year) {
            year = new Date().getFullYear();
        }
        return new Date(year, month + 1, 0).getDate();
    }
    function relOffset(base, y, m, d) {
        return from(base, getYear(base) + y, getMonth(base) + m, getDate(base) + d);
    }
    function nextMonth(d) {
        var date = d.getDate();
        var daysInNextMonth = daysInMonth(d.getMonth() + 1, d.getFullYear());
        if (date > daysInNextMonth) {
            date = daysInNextMonth;
        }
        console.log(new Date(d.getFullYear(), d.getMonth() + 1, date).toString());
        return new Date(d.getFullYear(), d.getMonth() + 1, date);
    }
    function prevMonth(d) {
        var date = d.getDate();
        var daysInPrevMonth = daysInMonth(d.getMonth() - 1, d.getFullYear());
        if (date > daysInPrevMonth) {
            date = daysInPrevMonth;
        }
        return new Date(d.getFullYear(), d.getMonth() - 1, date);
    }
    function findWeekStart(d, firstWeekday) {
        firstWeekday = parseIntDec(firstWeekday);
        if (!isWeekdayNum(firstWeekday)) {
            firstWeekday = 0;
        }
        for (var step = 0; step < 7; step++) {
            if (getDay(d) === firstWeekday) {
                return d;
            } else {
                d = prevDay(d);
            }
        }
        throw "unable to find week start";
    }
    function findWeekEnd(d, lastWeekDay) {
        lastWeekDay = parseIntDec(lastWeekDay);
        if (!isWeekdayNum(lastWeekDay)) {
            lastWeekDay = 6;
        }
        for (var step = 0; step < 7; step++) {
            if (getDay(d) === lastWeekDay) {
                return d;
            } else {
                d = nextDay(d);
            }
        }
        throw "unable to find week end";
    }
    function findFirst(d) {
        d = new Date(d.valueOf());
        d.setDate(1);
        return normalize(d);
    }
    function findLast(d) {
        return prevDay(relOffset(d, 0, 1, 0));
    }
    function nextDay(d) {
        return relOffset(d, 0, 0, 1);
    }
    function prevDay(d) {
        return relOffset(d, 0, 0, -1);
    }
    function dateMatches(d, matches) {
        if (!matches) return;
        matches = matches.length === undefined ? [ matches ] : matches;
        var foundMatch = false;
        matches.forEach(function(match) {
            if (match.length === 2) {
                if (dateInRange(match[0], match[1], d)) {
                    foundMatch = true;
                }
            } else {
                if (iso(match) === iso(d)) {
                    foundMatch = true;
                }
            }
        });
        return foundMatch;
    }
    function dateInRange(start, end, d) {
        return iso(start) <= iso(d) && iso(d) <= iso(end);
    }
    function sortRanges(ranges) {
        ranges.sort(function(rangeA, rangeB) {
            var dateA = isValidDateObj(rangeA) ? rangeA : rangeA[0];
            var dateB = isValidDateObj(rangeB) ? rangeB : rangeB[0];
            return dateA.valueOf() - dateB.valueOf();
        });
    }
    function makeControls(labelData) {
        var controls = makeEl("div.controls");
        var prev = makeEl("span.prev");
        var next = makeEl("span.next");
        prev.innerHTML = labelData.prev;
        next.innerHTML = labelData.next;
        appendChild(controls, prev);
        appendChild(controls, next);
        return controls;
    }
    function Calendar(data) {
        var self = this;
        data = data || {};
        self._span = data.span || 1;
        self._multiple = data.multiple || false;
        self._viewDate = self._sanitizeViewDate(data.view, data.chosen);
        self._chosenRanges = self._sanitizeChosenRanges(data.chosen, data.view);
        self._firstWeekdayNum = data.firstWeekdayNum || 0;
        self._el = makeEl("div.calendar");
        self._labels = GET_DEFAULT_LABELS();
        self._customRenderFn = null;
        self._renderRecursionFlag = false;
        self.render(true);
    }
    var CALENDAR_PROTOTYPE = Calendar.prototype;
    CALENDAR_PROTOTYPE.makeMonth = function(d) {
        if (!isValidDateObj(d)) throw "Invalid view date!";
        var firstWeekday = this.firstWeekdayNum;
        var chosen = this.chosen;
        var labels = this.labels;
        var month = getMonth(d);
        var sDate = findWeekStart(findFirst(d), firstWeekday);
        var monthEl = makeEl("div.month");
        var monthLabel = makeEl("div.month-label");
        monthLabel.textContent = labels.months[month] + " " + getYear(d);
        appendChild(monthEl, monthLabel);
        var weekdayLabels = makeEl("div.weekday-labels");
        for (var step = 0; step < 7; step++) {
            var weekdayNum = (firstWeekday + step) % 7;
            var weekdayLabel = makeEl("span.weekday-label");
            weekdayLabel.textContent = labels.weekdays[weekdayNum];
            appendChild(weekdayLabels, weekdayLabel);
        }
        appendChild(monthEl, weekdayLabels);
        var week = makeEl("div.week");
        var cDate = sDate;
        var maxDays = 7 * 6;
        for (step = 0; step < maxDays; step++) {
            var day = makeEl("span.day");
            day.setAttribute("data-date", iso(cDate));
            day.textContent = getDate(cDate);
            if (getMonth(cDate) !== month) {
                addClass(day, "badmonth");
            }
            if (dateMatches(cDate, chosen)) {
                addClass(day, CHOSEN_CLASS);
            }
            if (dateMatches(cDate, TODAY)) {
                addClass(day, "today");
            }
            appendChild(week, day);
            var oldDate = cDate;
            cDate = nextDay(cDate);
            if ((step + 1) % 7 === 0) {
                appendChild(monthEl, week);
                week = makeEl("div.week");
                var done = getMonth(cDate) > month || getMonth(cDate) < month && getYear(cDate) > getYear(sDate);
                if (done) break;
            }
        }
        return monthEl;
    };
    CALENDAR_PROTOTYPE._sanitizeViewDate = function(viewDate, chosenRanges) {
        chosenRanges = chosenRanges === undefined ? this.chosen : chosenRanges;
        var saneDate;
        if (isValidDateObj(viewDate)) {
            saneDate = viewDate;
        } else if (isValidDateObj(chosenRanges)) {
            saneDate = chosenRanges;
        } else if (isArray(chosenRanges) && chosenRanges.length > 0) {
            var firstRange = chosenRanges[0];
            if (isValidDateObj(firstRange)) {
                saneDate = firstRange;
            } else {
                saneDate = firstRange[0];
            }
        } else {
            saneDate = TODAY;
        }
        return saneDate;
    };
    function _collapseRanges(ranges) {
        ranges = ranges.slice(0);
        sortRanges(ranges);
        var collapsed = [];
        for (var i = 0; i < ranges.length; i++) {
            var currRange = ranges[i];
            var prevRange = collapsed.length > 0 ? collapsed[collapsed.length - 1] : null;
            var currStart, currEnd;
            var prevStart, prevEnd;
            if (isValidDateObj(currRange)) {
                currStart = currEnd = currRange;
            } else {
                currStart = currRange[0];
                currEnd = currRange[1];
            }
            currRange = dateMatches(currStart, currEnd) ? currStart : [ currStart, currEnd ];
            if (isValidDateObj(prevRange)) {
                prevStart = prevEnd = prevRange;
            } else if (prevRange) {
                prevStart = prevRange[0];
                prevEnd = prevRange[1];
            } else {
                collapsed.push(currRange);
                continue;
            }
            if (dateMatches(currStart, [ prevRange ]) || dateMatches(prevDay(currStart), [ prevRange ])) {
                var minStart = prevStart.valueOf() < currStart.valueOf() ? prevStart : currStart;
                var maxEnd = prevEnd.valueOf() > currEnd.valueOf() ? prevEnd : currEnd;
                var newRange = dateMatches(minStart, maxEnd) ? minStart : [ minStart, maxEnd ];
                collapsed[collapsed.length - 1] = newRange;
            } else {
                collapsed.push(currRange);
            }
        }
        return collapsed;
    }
    CALENDAR_PROTOTYPE._sanitizeChosenRanges = function(chosenRanges, viewDate) {
        viewDate = viewDate === undefined ? this.view : viewDate;
        var cleanRanges;
        if (isValidDateObj(chosenRanges)) {
            cleanRanges = [ chosenRanges ];
        } else if (isArray(chosenRanges)) {
            cleanRanges = chosenRanges;
        } else if (chosenRanges === null || chosenRanges === undefined || !viewDate) {
            cleanRanges = [];
        } else {
            cleanRanges = [ viewDate ];
        }
        var collapsedRanges = _collapseRanges(cleanRanges);
        if (!this.multiple && collapsedRanges.length > 0) {
            var firstRange = collapsedRanges[0];
            if (isValidDateObj(firstRange)) {
                return [ firstRange ];
            } else {
                return [ firstRange[0] ];
            }
        } else {
            return collapsedRanges;
        }
    };
    CALENDAR_PROTOTYPE.addDate = function(dateObj, append) {
        if (isValidDateObj(dateObj)) {
            if (append) {
                this.chosen.push(dateObj);
                this.chosen = this.chosen;
            } else {
                this.chosen = [ dateObj ];
            }
        }
    };
    CALENDAR_PROTOTYPE.removeDate = function(dateObj) {
        if (!isValidDateObj(dateObj)) {
            return;
        }
        var ranges = this.chosen.slice(0);
        for (var i = 0; i < ranges.length; i++) {
            var range = ranges[i];
            if (dateMatches(dateObj, [ range ])) {
                ranges.splice(i, 1);
                if (isArray(range)) {
                    var rangeStart = range[0];
                    var rangeEnd = range[1];
                    var prevDate = prevDay(dateObj);
                    var nextDate = nextDay(dateObj);
                    if (dateMatches(prevDate, [ range ])) {
                        ranges.push([ rangeStart, prevDate ]);
                    }
                    if (dateMatches(nextDate, [ range ])) {
                        ranges.push([ nextDate, rangeEnd ]);
                    }
                }
                this.chosen = _collapseRanges(ranges);
                break;
            }
        }
    };
    CALENDAR_PROTOTYPE.hasChosenDate = function(dateObj) {
        return dateMatches(dateObj, this._chosenRanges);
    };
    CALENDAR_PROTOTYPE.hasVisibleDate = function(dateObj, excludeBadMonths) {
        var startDate = excludeBadMonths ? this.firstVisibleMonth : this.firstVisibleDate;
        var endDate = excludeBadMonths ? findLast(this.lastVisibleMonth) : this.lastVisibleDate;
        return dateMatches(dateObj, [ [ startDate, endDate ] ]);
    };
    CALENDAR_PROTOTYPE.render = function(preserveNodes) {
        var span = this._span;
        var i;
        if (!preserveNodes) {
            this.el.innerHTML = "";
            var ref = this.firstVisibleMonth;
            for (i = 0; i < span; i++) {
                appendChild(this.el, this.makeMonth(ref));
                ref = relOffset(ref, 0, 1, 0);
            }
        } else {
            var days = xtag.query(this.el, ".day");
            var day;
            for (i = 0; i < days.length; i++) {
                day = days[i];
                if (!day.hasAttribute("data-date")) {
                    continue;
                }
                var dateIso = day.getAttribute("data-date");
                var parsedDate = fromIso(dateIso);
                if (!parsedDate) {
                    continue;
                } else {
                    if (dateMatches(parsedDate, this._chosenRanges)) {
                        addClass(day, CHOSEN_CLASS);
                    } else {
                        removeClass(day, CHOSEN_CLASS);
                    }
                    if (dateMatches(parsedDate, [ TODAY ])) {
                        addClass(day, "today");
                    } else {
                        removeClass(day, "today");
                    }
                }
            }
        }
        this._callCustomRenderer();
    };
    CALENDAR_PROTOTYPE._callCustomRenderer = function() {
        if (!this._customRenderFn) return;
        if (this._renderRecursionFlag) {
            throw "Error: customRenderFn causes recursive loop of " + "rendering calendar; make sure your custom rendering " + "function doesn't modify attributes of the x-calendar that " + "would require a re-render!";
        }
        var days = xtag.query(this.el, ".day");
        for (var i = 0; i < days.length; i++) {
            var day = days[i];
            var dateIso = day.getAttribute("data-date");
            var parsedDate = fromIso(dateIso);
            this._renderRecursionFlag = true;
            this._customRenderFn(day, parsedDate ? parsedDate : null, dateIso);
            this._renderRecursionFlag = false;
        }
    };
    Object.defineProperties(CALENDAR_PROTOTYPE, {
        el: {
            get: function() {
                return this._el;
            }
        },
        multiple: {
            get: function() {
                return this._multiple;
            },
            set: function(multi) {
                this._multiple = multi;
                this.chosen = this._sanitizeChosenRanges(this.chosen);
                this.render(true);
            }
        },
        span: {
            get: function() {
                return this._span;
            },
            set: function(newSpan) {
                var parsedSpan = parseIntDec(newSpan);
                if (!isNaN(parsedSpan) && parsedSpan >= 0) {
                    this._span = parsedSpan;
                } else {
                    this._span = 0;
                }
                this.render(false);
            }
        },
        view: {
            attribute: {},
            get: function() {
                return this._viewDate;
            },
            set: function(rawViewDate) {
                var newViewDate = this._sanitizeViewDate(rawViewDate);
                var oldViewDate = this._viewDate;
                this._viewDate = newViewDate;
                this.render(getMonth(oldViewDate) === getMonth(newViewDate) && getYear(oldViewDate) === getYear(newViewDate));
            }
        },
        chosen: {
            get: function() {
                return this._chosenRanges;
            },
            set: function(newChosenRanges) {
                this._chosenRanges = this._sanitizeChosenRanges(newChosenRanges);
                this.render(true);
            }
        },
        firstWeekdayNum: {
            get: function() {
                return this._firstWeekdayNum;
            },
            set: function(weekdayNum) {
                weekdayNum = parseIntDec(weekdayNum);
                if (!isWeekdayNum(weekdayNum)) {
                    weekdayNum = 0;
                }
                this._firstWeekdayNum = weekdayNum;
                this.render(false);
            }
        },
        lastWeekdayNum: {
            get: function() {
                return (this._firstWeekdayNum + 6) % 7;
            }
        },
        customRenderFn: {
            get: function() {
                return this._customRenderFn;
            },
            set: function(newRenderFn) {
                this._customRenderFn = newRenderFn;
                this.render(true);
            }
        },
        chosenString: {
            get: function() {
                if (this.multiple) {
                    var isoDates = this.chosen.slice(0);
                    for (var i = 0; i < isoDates.length; i++) {
                        var range = isoDates[i];
                        if (isValidDateObj(range)) {
                            isoDates[i] = iso(range);
                        } else {
                            isoDates[i] = [ iso(range[0]), iso(range[1]) ];
                        }
                    }
                    return JSON.stringify(isoDates);
                } else if (this.chosen.length > 0) {
                    return iso(this.chosen[0]);
                } else {
                    return "";
                }
            }
        },
        firstVisibleMonth: {
            get: function() {
                return findFirst(this.view);
            }
        },
        lastVisibleMonth: {
            get: function() {
                return relOffset(this.firstVisibleMonth, 0, Math.max(0, this.span - 1), 0);
            }
        },
        firstVisibleDate: {
            get: function() {
                return findWeekStart(this.firstVisibleMonth, this.firstWeekdayNum);
            }
        },
        lastVisibleDate: {
            get: function() {
                return findWeekEnd(findLast(this.lastVisibleMonth), this.lastWeekdayNum);
            }
        },
        labels: {
            get: function() {
                return this._labels;
            },
            set: function(newLabelData) {
                var oldLabelData = this.labels;
                for (var labelType in oldLabelData) {
                    if (!(labelType in newLabelData)) continue;
                    var oldLabel = this._labels[labelType];
                    var newLabel = newLabelData[labelType];
                    if (isArray(oldLabel)) {
                        if (isArray(newLabel) && oldLabel.length === newLabel.length) {
                            newLabel = newLabel.slice(0);
                            for (var i = 0; i < newLabel.length; i++) {
                                newLabel[i] = newLabel[i].toString ? newLabel[i].toString() : String(newLabel[i]);
                            }
                        } else {
                            throw "invalid label given for '" + labelType + "': expected array of " + oldLabel.length + " labels, got " + JSON.stringify(newLabel);
                        }
                    } else {
                        newLabel = String(newLabel);
                    }
                    oldLabelData[labelType] = newLabel;
                }
                this.render(false);
            }
        }
    });
    function _onDragStart(xCalendar, day) {
        var isoDate = day.getAttribute("data-date");
        var dateObj = parseSingleDate(isoDate);
        var toggleEventName;
        if (hasClass(day, CHOSEN_CLASS)) {
            xCalendar.xtag.dragType = DRAG_REMOVE;
            toggleEventName = "datetoggleoff";
        } else {
            xCalendar.xtag.dragType = DRAG_ADD;
            toggleEventName = "datetoggleon";
        }
        xCalendar.xtag.dragStartEl = day;
        xCalendar.xtag.dragAllowTap = true;
        if (!xCalendar.noToggle) {
            xtag.fireEvent(xCalendar, toggleEventName, {
                detail: {
                    date: dateObj,
                    iso: isoDate
                }
            });
        }
        xCalendar.setAttribute("active", true);
        day.setAttribute("active", true);
    }
    function _onDragMove(xCalendar, day) {
        var isoDate = day.getAttribute("data-date");
        var dateObj = parseSingleDate(isoDate);
        if (day !== xCalendar.xtag.dragStartEl) {
            xCalendar.xtag.dragAllowTap = false;
        }
        if (!xCalendar.noToggle) {
            if (xCalendar.xtag.dragType === DRAG_ADD && !hasClass(day, CHOSEN_CLASS)) {
                xtag.fireEvent(xCalendar, "datetoggleon", {
                    detail: {
                        date: dateObj,
                        iso: isoDate
                    }
                });
            } else if (xCalendar.xtag.dragType === DRAG_REMOVE && hasClass(day, CHOSEN_CLASS)) {
                xtag.fireEvent(xCalendar, "datetoggleoff", {
                    detail: {
                        date: dateObj,
                        iso: isoDate
                    }
                });
            }
        }
        if (xCalendar.xtag.dragType) {
            day.setAttribute("active", true);
        }
    }
    function _onDragEnd(e) {
        var xCalendars = xtag.query(document, "x-calendar");
        for (var i = 0; i < xCalendars.length; i++) {
            var xCalendar = xCalendars[i];
            xCalendar.xtag.dragType = null;
            xCalendar.xtag.dragStartEl = null;
            xCalendar.xtag.dragAllowTap = false;
            xCalendar.removeAttribute("active");
        }
        var days = xtag.query(document, "x-calendar .day[active]");
        for (var j = 0; j < days.length; j++) {
            days[j].removeAttribute("active");
        }
    }
    function _pointIsInRect(x, y, rect) {
        return rect.left <= x && x <= rect.right && rect.top <= y && y <= rect.bottom;
    }
    var DOC_MOUSEUP_LISTENER = null;
    var DOC_TOUCHEND_LISTENER = null;
    xtag.register("x-calendar", {
        lifecycle: {
            created: function() {
                this.innerHTML = "";
                var chosenRange = this.getAttribute("chosen");
                this.xtag.calObj = new Calendar({
                    span: this.getAttribute("span"),
                    view: parseSingleDate(this.getAttribute("view")),
                    chosen: parseMultiDates(chosenRange),
                    multiple: this.hasAttribute("multiple"),
                    firstWeekdayNum: this.getAttribute("first-weekday-num")
                });
                appendChild(this, this.xtag.calObj.el);
                this.xtag.calControls = null;
                this.xtag.dragType = null;
                this.xtag.dragStartEl = null;
                this.xtag.dragAllowTap = false;
            },
            inserted: function() {
                if (!DOC_MOUSEUP_LISTENER) {
                    DOC_MOUSEUP_LISTENER = xtag.addEvent(document, "mouseup", _onDragEnd);
                }
                if (!DOC_TOUCHEND_LISTENER) {
                    DOC_TOUCHEND_LISTENER = xtag.addEvent(document, "touchend", _onDragEnd);
                }
                this.render(false);
            },
            removed: function() {
                if (xtag.query(document, "x-calendar").length === 0) {
                    if (DOC_MOUSEUP_LISTENER) {
                        xtag.removeEvent(document, "mouseup", DOC_MOUSEUP_LISTENER);
                        DOC_MOUSEUP_LISTENER = null;
                    }
                    if (DOC_TOUCHEND_LISTENER) {
                        xtag.removeEvent(document, "touchend", DOC_TOUCHEND_LISTENER);
                        DOC_TOUCHEND_LISTENER = null;
                    }
                }
            }
        },
        events: {
            "tap:delegate(.next)": function(e) {
                var xCalendar = e.currentTarget;
                xCalendar.nextMonth();
                xtag.fireEvent(xCalendar, "nextmonth");
            },
            "tap:delegate(.prev)": function(e) {
                var xCalendar = e.currentTarget;
                xCalendar.prevMonth();
                xtag.fireEvent(xCalendar, "prevmonth");
            },
            "tapstart:delegate(.day)": function(e) {
                if (!e.touches && e.button && e.button !== LEFT_MOUSE_BTN) {
                    return;
                }
                e.preventDefault();
                if (e.baseEvent) e.baseEvent.preventDefault();
                _onDragStart(e.currentTarget, this);
            },
            touchmove: function(e) {
                if (!(e.touches && e.touches.length > 0)) {
                    return;
                }
                var xCalendar = e.currentTarget;
                if (!xCalendar.xtag.dragType) {
                    return;
                }
                var touch = e.touches[0];
                var days = xtag.query(xCalendar, ".day");
                for (var i = 0; i < days.length; i++) {
                    var day = days[i];
                    if (_pointIsInRect(touch.pageX, touch.pageY, getRect(day))) {
                        _onDragMove(xCalendar, day);
                    } else {
                        day.removeAttribute("active");
                    }
                }
            },
            "mouseover:delegate(.day)": function(e) {
                var xCalendar = e.currentTarget;
                var day = this;
                _onDragMove(xCalendar, day);
            },
            "mouseout:delegate(.day)": function(e) {
                var day = this;
                day.removeAttribute("active");
            },
            "tapend:delegate(.day)": function(e) {
                var xCalendar = e.currentTarget;
                if (!xCalendar.xtag.dragAllowTap) {
                    return;
                }
                var day = this;
                var isoDate = day.getAttribute("data-date");
                var dateObj = parseSingleDate(isoDate);
                xtag.fireEvent(xCalendar, "datetap", {
                    detail: {
                        date: dateObj,
                        iso: isoDate
                    }
                });
            },
            datetoggleon: function(e) {
                var xCalendar = this;
                xCalendar.toggleDateOn(e.detail.date, xCalendar.multiple);
            },
            datetoggleoff: function(e) {
                var xCalendar = this;
                xCalendar.toggleDateOff(e.detail.date);
            }
        },
        accessors: {
            controls: {
                attribute: {
                    "boolean": true
                },
                set: function(hasControls) {
                    if (hasControls && !this.xtag.calControls) {
                        this.xtag.calControls = makeControls(this.xtag.calObj.labels);
                        appendChild(this, this.xtag.calControls);
                    }
                }
            },
            multiple: {
                attribute: {
                    "boolean": true
                },
                get: function() {
                    return this.xtag.calObj.multiple;
                },
                set: function(multi) {
                    this.xtag.calObj.multiple = multi;
                    this.chosen = this.chosen;
                }
            },
            span: {
                attribute: {},
                get: function() {
                    return this.xtag.calObj.span;
                },
                set: function(newCalSpan) {
                    this.xtag.calObj.span = newCalSpan;
                }
            },
            view: {
                attribute: {},
                get: function() {
                    return this.xtag.calObj.view;
                },
                set: function(newView) {
                    var parsedDate = parseSingleDate(newView);
                    if (parsedDate) {
                        this.xtag.calObj.view = parsedDate;
                    }
                }
            },
            chosen: {
                attribute: {
                    skip: true
                },
                get: function() {
                    var chosenRanges = this.xtag.calObj.chosen;
                    if (!this.multiple) {
                        if (chosenRanges.length > 0) {
                            var firstRange = chosenRanges[0];
                            if (isValidDateObj(firstRange)) {
                                return firstRange;
                            } else {
                                return firstRange[0];
                            }
                        } else {
                            return null;
                        }
                    } else {
                        return this.xtag.calObj.chosen;
                    }
                },
                set: function(newDates) {
                    var parsedDateRanges = this.multiple ? parseMultiDates(newDates) : parseSingleDate(newDates);
                    if (parsedDateRanges) {
                        this.xtag.calObj.chosen = parsedDateRanges;
                    } else {
                        this.xtag.calObj.chosen = null;
                    }
                    if (this.xtag.calObj.chosenString) {
                        this.setAttribute("chosen", this.xtag.calObj.chosenString);
                    } else {
                        this.removeAttribute("chosen");
                    }
                }
            },
            firstWeekdayNum: {
                attribute: {
                    name: "first-weekday-num"
                },
                set: function(weekdayNum) {
                    this.xtag.calObj.firstWeekdayNum = weekdayNum;
                }
            },
            noToggle: {
                attribute: {
                    "boolean": true,
                    name: "notoggle"
                },
                set: function(toggleDisabled) {
                    if (toggleDisabled) {
                        this.chosen = null;
                    }
                }
            },
            firstVisibleMonth: {
                get: function() {
                    return this.xtag.calObj.firstVisibleMonth;
                }
            },
            lastVisibleMonth: {
                get: function() {
                    return this.xtag.calObj.lastVisibleMonth;
                }
            },
            firstVisibleDate: {
                get: function() {
                    return this.xtag.calObj.firstVisibleDate;
                }
            },
            lastVisibleDate: {
                get: function() {
                    return this.xtag.calObj.lastVisibleDate;
                }
            },
            customRenderFn: {
                get: function() {
                    return this.xtag.calObj.customRenderFn;
                },
                set: function(newRenderFn) {
                    this.xtag.calObj.customRenderFn = newRenderFn;
                }
            },
            labels: {
                get: function() {
                    return JSON.parse(JSON.stringify(this.xtag.calObj.labels));
                },
                set: function(newLabelData) {
                    this.xtag.calObj.labels = newLabelData;
                    var labels = this.xtag.calObj.labels;
                    var prevControl = this.querySelector(".controls > .prev");
                    if (prevControl) prevControl.textContent = labels.prev;
                    var nextControl = this.querySelector(".controls > .next");
                    if (nextControl) nextControl.textContent = labels.next;
                }
            }
        },
        methods: {
            render: function(preserveNodes) {
                this.xtag.calObj.render(preserveNodes);
            },
            prevMonth: function() {
                var calObj = this.xtag.calObj;
                calObj.view = prevMonth(calObj.view);
            },
            nextMonth: function() {
                var calObj = this.xtag.calObj;
                calObj.view = nextMonth(calObj.view);
            },
            toggleDateOn: function(newDateObj, append) {
                this.xtag.calObj.addDate(newDateObj, append);
                this.chosen = this.chosen;
            },
            toggleDateOff: function(dateObj) {
                this.xtag.calObj.removeDate(dateObj);
                this.chosen = this.chosen;
            },
            toggleDate: function(dateObj, appendIfAdd) {
                if (this.xtag.calObj.hasChosenDate(dateObj)) {
                    this.toggleDateOff(dateObj);
                } else {
                    this.toggleDateOn(dateObj, appendIfAdd);
                }
            },
            hasVisibleDate: function(dateObj, excludeBadMonths) {
                return this.xtag.calObj.hasVisibleDate(dateObj, excludeBadMonths);
            }
        }
    });
})();

(function() {
    var BEFORE_ANIM_ATTR = "_before-animation";
    function HistoryStack(validatorFn, itemCap) {
        this._historyStack = [];
        this.currIndex = -1;
        this._itemCap = undefined;
        this.itemCap = itemCap;
        this._validatorFn = validatorFn ? validatorFn : function(x) {
            return true;
        };
    }
    var HISTORYSTACK_PROTOTYPE = HistoryStack.prototype;
    HISTORYSTACK_PROTOTYPE.pushState = function(newState) {
        if (this.canRedo) {
            this._historyStack.splice(this.currIndex + 1, this._historyStack.length - (this.currIndex + 1));
        }
        this._historyStack.push(newState);
        this.currIndex = this._historyStack.length - 1;
        this.sanitizeStack();
        if (this._itemCap !== "none" && this._historyStack.length > this._itemCap) {
            var len = this._historyStack.length;
            this._historyStack.splice(0, len - this._itemCap);
            this.currIndex = this._historyStack.length - 1;
        }
    };
    HISTORYSTACK_PROTOTYPE.sanitizeStack = function() {
        var validatorFn = this._validatorFn;
        var lastValidState;
        var i = 0;
        while (i < this._historyStack.length) {
            var state = this._historyStack[i];
            if (state !== lastValidState && validatorFn(state)) {
                lastValidState = state;
                i++;
            } else {
                this._historyStack.splice(i, 1);
                if (i <= this.currIndex) {
                    this.currIndex--;
                }
            }
        }
    };
    HISTORYSTACK_PROTOTYPE.forwards = function() {
        if (this.canRedo) {
            this.currIndex++;
        }
        this.sanitizeStack();
    };
    HISTORYSTACK_PROTOTYPE.backwards = function() {
        if (this.canUndo) {
            this.currIndex--;
        }
        this.sanitizeStack();
    };
    Object.defineProperties(HISTORYSTACK_PROTOTYPE, {
        DEFAULT_CAP: {
            value: 10
        },
        itemCap: {
            get: function() {
                return this._itemCap;
            },
            set: function(newCap) {
                if (newCap === undefined) {
                    this._itemCap = this.DEFAULT_CAP;
                } else if (newCap === "none") {
                    this._itemCap = "none";
                } else {
                    var num = parseInt(newCap, 10);
                    if (isNaN(newCap) || newCap <= 0) {
                        throw "attempted to set invalid item cap: " + newCap;
                    }
                    this._itemCap = num;
                }
            }
        },
        canUndo: {
            get: function() {
                return this.currIndex > 0;
            }
        },
        canRedo: {
            get: function() {
                return this.currIndex < this._historyStack.length - 1;
            }
        },
        numStates: {
            get: function() {
                return this._historyStack.length;
            }
        },
        currState: {
            get: function() {
                var index = this.currIndex;
                if (0 <= index && index < this._historyStack.length) {
                    return this._historyStack[index];
                }
                return null;
            }
        }
    });
    function getDurationStr(elem) {
        var style = window.getComputedStyle(elem);
        var browserDurationName = xtag.prefix.js + "TransitionDuration";
        if (style.transitionDuration) {
            return style.transitionDuration;
        } else {
            return style[browserDurationName];
        }
    }
    function durationStrToMs(str) {
        if (typeof str !== typeof "") {
            return 0;
        }
        var reg = /^(\d*\.?\d+)(m?s)$/;
        var matchInfo = str.toLowerCase().match(reg);
        if (matchInfo) {
            var strVal = matchInfo[1];
            var unit = matchInfo[2];
            var val = parseFloat(strVal);
            if (isNaN(val)) {
                throw "value error";
            }
            if (unit === "s") {
                return val * 1e3;
            } else if (unit === "ms") {
                return val;
            } else {
                throw "unit error";
            }
        } else {
            return 0;
        }
    }
    function posModulo(x, divisor) {
        return (x % divisor + divisor) % divisor;
    }
    function _getAllCards(elem) {
        return xtag.queryChildren(elem, "x-card");
    }
    function _getCardAt(deck, targetIndex) {
        var cards = _getAllCards(deck);
        return isNaN(parseInt(targetIndex, 10)) || targetIndex < 0 || targetIndex >= cards.length ? null : cards[targetIndex];
    }
    function _getCardIndex(deck, card) {
        var allCards = _getAllCards(deck);
        return allCards.indexOf(card);
    }
    function _animateCardReplacement(deck, oldCard, newCard, cardAnimName, isReverse) {
        deck.xtag._selectedCard = newCard;
        var animTimeStamp = new Date();
        deck.xtag._lastAnimTimestamp = animTimeStamp;
        var _onComplete = function() {
            if (animTimeStamp === deck.xtag._lastAnimTimestamp) {
                _sanitizeCardAttrs(deck);
                xtag.fireEvent(deck, "shuffleend", {
                    detail: {
                        oldCard: oldCard,
                        newCard: newCard
                    }
                });
            }
        };
        if (newCard === oldCard) {
            _onComplete();
            return;
        }
        var oldCardAnimReady = false;
        var newCardAnimReady = false;
        var animationStarted = false;
        var _attemptBeforeCallback = function() {
            if (oldCardAnimReady && newCardAnimReady) {
                _getAllCards(deck).forEach(function(card) {
                    card.removeAttribute("selected");
                    card.removeAttribute("leaving");
                });
                oldCard.setAttribute("leaving", true);
                newCard.setAttribute("selected", true);
                deck.xtag._selectedCard = newCard;
                deck.selectedIndex = _getCardIndex(deck, newCard);
                if (isReverse) {
                    oldCard.setAttribute("reverse", true);
                    newCard.setAttribute("reverse", true);
                }
                xtag.fireEvent(deck, "shufflestart", {
                    detail: {
                        oldCard: oldCard,
                        newCard: newCard
                    }
                });
            }
        };
        var _attemptAnimation = function() {
            if (animationStarted) {
                return;
            }
            if (!(oldCardAnimReady && newCardAnimReady)) {
                return;
            }
            _doAnimation();
        };
        var _doAnimation = function() {
            animationStarted = true;
            var oldCardDone = false;
            var newCardDone = false;
            var animationComplete = false;
            var onTransitionComplete = function(e) {
                if (animationComplete) {
                    return;
                }
                if (e.target === oldCard) {
                    oldCardDone = true;
                    oldCard.removeEventListener("transitionend", onTransitionComplete);
                } else if (e.target === newCard) {
                    newCardDone = true;
                    newCard.removeEventListener("transitionend", onTransitionComplete);
                }
                if (oldCardDone && newCardDone) {
                    animationComplete = true;
                    _onComplete();
                }
            };
            oldCard.addEventListener("transitionend", onTransitionComplete);
            newCard.addEventListener("transitionend", onTransitionComplete);
            var oldDuration = durationStrToMs(getDurationStr(oldCard));
            var newDuration = durationStrToMs(getDurationStr(newCard));
            var maxDuration = Math.max(oldDuration, newDuration);
            var waitMultiplier = 1.15;
            var timeoutDuration = cardAnimName.toLowerCase() === "none" ? 0 : Math.ceil(maxDuration * waitMultiplier);
            if (timeoutDuration === 0) {
                animationComplete = true;
                oldCard.removeEventListener("transitionend", onTransitionComplete);
                newCard.removeEventListener("transitionend", onTransitionComplete);
                oldCard.removeAttribute(BEFORE_ANIM_ATTR);
                newCard.removeAttribute(BEFORE_ANIM_ATTR);
                _onComplete();
            } else {
                oldCard.removeAttribute(BEFORE_ANIM_ATTR);
                newCard.removeAttribute(BEFORE_ANIM_ATTR);
                window.setTimeout(function() {
                    if (animationComplete) {
                        return;
                    }
                    animationComplete = true;
                    oldCard.removeEventListener("transitionend", onTransitionComplete);
                    newCard.removeEventListener("transitionend", onTransitionComplete);
                    _onComplete();
                }, timeoutDuration);
            }
        };
        xtag.skipTransition(oldCard, function() {
            oldCard.setAttribute("card-anim-type", cardAnimName);
            oldCard.setAttribute(BEFORE_ANIM_ATTR, true);
            oldCardAnimReady = true;
            _attemptBeforeCallback();
            return _attemptAnimation;
        }, this);
        xtag.skipTransition(newCard, function() {
            newCard.setAttribute("card-anim-type", cardAnimName);
            newCard.setAttribute(BEFORE_ANIM_ATTR, true);
            newCardAnimReady = true;
            _attemptBeforeCallback();
            return _attemptAnimation;
        }, this);
    }
    function _replaceCurrCard(deck, newCard, transitionType, progressType, ignoreHistory) {
        var oldCard = deck.xtag._selectedCard;
        if (oldCard === newCard) {
            var eDetail = {
                detail: {
                    oldCard: oldCard,
                    newCard: newCard
                }
            };
            xtag.fireEvent(deck, "shufflestart", eDetail);
            xtag.fireEvent(deck, "shuffleend", eDetail);
            return;
        }
        _sanitizeCardAttrs(deck);
        if (transitionType === undefined) {
            console.log("defaulting to none transition");
            transitionType = "none";
        }
        var isReverse;
        switch (progressType) {
          case "forward":
            isReverse = false;
            break;

          case "reverse":
            isReverse = true;
            break;

          default:
            if (!oldCard) {
                isReverse = false;
            }
            var allCards = _getAllCards(deck);
            if (allCards.indexOf(newCard) < allCards.indexOf(oldCard)) {
                isReverse = true;
            } else {
                isReverse = false;
            }
            break;
        }
        if (newCard.hasAttribute("transition-override")) {
            transitionType = newCard.getAttribute("transition-override");
        }
        if (!ignoreHistory) {
            deck.xtag.history.pushState(newCard);
        }
        _animateCardReplacement(deck, oldCard, newCard, transitionType, isReverse);
    }
    function _replaceWithIndex(deck, targetIndex, transitionType, progressType) {
        var newCard = _getCardAt(deck, targetIndex);
        if (!newCard) {
            throw "no card at index " + targetIndex;
        }
        _replaceCurrCard(deck, newCard, transitionType, progressType);
    }
    function _sanitizeCardAttrs(deck) {
<<<<<<< HEAD
        if (!deck.xtag._initialized) return;
=======
        if (!deck.xtag._initialized) {
            return;
        }
>>>>>>> default skin wip
        var cards = _getAllCards(deck);
        var currCard = deck.xtag._selectedCard;
        if (!currCard || currCard.parentNode !== deck) {
            if (cards.length > 0) {
                if (deck.xtag.history && deck.xtag.history.numStates > 0) {
                    currCard = deck.xtag.history.currState;
                } else {
                    currCard = cards[0];
                }
            } else {
                currCard = null;
            }
        }
        cards.forEach(function(card) {
            card.removeAttribute("leaving");
            card.removeAttribute(BEFORE_ANIM_ATTR);
            card.removeAttribute("card-anim-type");
            card.removeAttribute("reverse");
            if (card !== currCard) {
                card.removeAttribute("selected");
            } else {
                card.setAttribute("selected", true);
            }
        });
        deck.xtag._selectedCard = currCard;
        deck.selectedIndex = _getCardIndex(deck, currCard);
    }
    xtag.register("x-deck", {
        lifecycle: {
            created: function() {
                var self = this;
                self.xtag._initialized = true;
                var _historyValidator = function(card) {
                    return card.parentNode === self;
                };
                self.xtag.history = new HistoryStack(_historyValidator, HistoryStack.DEFAULT_CAP);
                self.xtag._selectedCard = self.xtag._selectedCard ? self.xtag._selectedCard : null;
                self.xtag._lastAnimTimestamp = null;
                self.xtag.transitionType = "scrollLeft";
                var initCard = self.getCardAt(self.getAttribute("selected-index"));
                if (initCard) {
                    self.xtag._selectedCard = initCard;
                }
                _sanitizeCardAttrs(self);
                var currCard = self.xtag._selectedCard;
                if (currCard) {
                    self.xtag.history.pushState(currCard);
                }
            }
        },
        events: {
            "show:delegate(x-card)": function(e) {
                var card = this;
                card.show();
            }
        },
        accessors: {
            transitionType: {
                attribute: {
                    name: "transition-type"
                },
                get: function() {
                    return this.xtag.transitionType;
                },
                set: function(newType) {
                    this.xtag.transitionType = newType;
                }
            },
            selectedIndex: {
                attribute: {
                    skip: true,
                    name: "selected-index"
                },
                get: function() {
                    return _getCardIndex(this, this.xtag._selectedCard);
                },
                set: function(newIndex) {
                    if (this.selectedIndex !== newIndex) {
                        _replaceWithIndex(this, newIndex, "none");
                    }
                    this.setAttribute("selected-index", newIndex);
                }
            },
            historyCap: {
                attribute: {
                    name: "history-cap"
                },
                get: function() {
                    return this.xtag.history.itemCap;
                },
                set: function(itemCap) {
                    this.xtag.history.itemCap = itemCap;
                }
            },
            numCards: {
                get: function() {
                    return this.getAllCards().length;
                }
            },
            currHistorySize: {
                get: function() {
                    return this.xtag.history.numStates;
                }
            },
            currHistoryIndex: {
                get: function() {
                    return this.xtag.history.currIndex;
                }
            },
            cards: {
                get: function() {
                    return this.getAllCards();
                }
            },
            selectedCard: {
                get: function() {
                    return this.getSelectedCard();
                }
            }
        },
        methods: {
            shuffleTo: function(index, progressType) {
                var targetCard = _getCardAt(this, index);
                if (!targetCard) {
                    throw "invalid shuffleTo index " + index;
                }
                var transitionType = this.xtag.transitionType;
                _replaceWithIndex(this, index, transitionType, progressType);
            },
            shuffleNext: function(progressType) {
                progressType = progressType ? progressType : "auto";
                var cards = _getAllCards(this);
                var currCard = this.xtag._selectedCard;
                var currIndex = cards.indexOf(currCard);
                if (currIndex > -1) {
                    this.shuffleTo(posModulo(currIndex + 1, cards.length), progressType);
                }
            },
            shufflePrev: function(progressType) {
                progressType = progressType ? progressType : "auto";
                var cards = _getAllCards(this);
                var currCard = this.xtag._selectedCard;
                var currIndex = cards.indexOf(currCard);
                if (currIndex > -1) {
                    this.shuffleTo(posModulo(currIndex - 1, cards.length), progressType);
                }
            },
            getAllCards: function() {
                return _getAllCards(this);
            },
            getSelectedCard: function() {
                return this.xtag._selectedCard;
            },
            getCardIndex: function(card) {
                return _getCardIndex(this, card);
            },
            getCardAt: function(index) {
                return _getCardAt(this, index);
            },
            historyBack: function(progressType) {
                var history = this.xtag.history;
                var deck = this;
                if (history.canUndo) {
                    history.backwards();
                    var newCard = history.currState;
                    if (newCard) {
                        _replaceCurrCard(this, newCard, this.transitionType, progressType, true);
                    }
                }
            },
            historyForward: function(progressType) {
                var history = this.xtag.history;
                var deck = this;
                if (history.canRedo) {
                    history.forwards();
                    var newCard = history.currState;
                    if (newCard) {
                        _replaceCurrCard(this, newCard, this.transitionType, progressType, true);
                    }
                }
            }
        }
    });
    xtag.register("x-card", {
        lifecycle: {
            inserted: function() {
                var self = this;
                var deckContainer = self.parentNode;
                if (deckContainer) {
                    if (deckContainer.tagName.toLowerCase() === "x-deck") {
                        _sanitizeCardAttrs(deckContainer);
                        self.xtag.parentDeck = deckContainer;
                        xtag.fireEvent(deckContainer, "cardadd", {
                            detail: {
                                card: self
                            }
                        });
                    }
                }
            },
            created: function() {
                var deckContainer = this.parentNode;
                if (deckContainer && deckContainer.tagName.toLowerCase() === "x-deck") {
                    this.xtag.parentDeck = deckContainer;
                }
            },
            removed: function() {
                var self = this;
                if (!self.xtag.parentDeck) {
                    return;
                }
                var deck = self.xtag.parentDeck;
                deck.xtag.history.sanitizeStack();
                _sanitizeCardAttrs(deck);
                xtag.fireEvent(deck, "cardremove", {
                    detail: {
                        card: self
                    }
                });
            }
        },
        accessors: {
            transitionOverride: {
                attribute: {
                    name: "transition-override"
                }
            }
        },
        methods: {
            show: function() {
                var deck = this.parentNode;
                if (deck === this.xtag.parentDeck) {
                    deck.shuffleTo(deck.getCardIndex(this));
                }
            }
        }
    });
})();

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

(function() {
    function getLayoutElements(layout) {
        var first = layout.firstElementChild;
        if (!first) return {
            header: null,
            section: null,
            footer: null
        };
        var second = first.nextElementSibling;
        return {
            header: first.nodeName == "HEADER" ? first : null,
            section: first.nodeName == "SECTION" ? first : second && second.nodeName == "SECTION" ? second : null,
            footer: layout.lastElementChild.nodeName == "FOOTER" ? layout.lastElementChild : null
        };
    }
    function getLayoutScroll(layout, element) {
        var scroll = element.__layoutScroll__ = element.__layoutScroll__ || Object.defineProperty(element, "__layoutScroll__", {
            value: {
                last: element.scrollTop
            }
        }).__layoutScroll__;
        var now = element.scrollTop, buffer = layout.scrollBuffer;
        scroll.max = scroll.max || Math.max(now + buffer, buffer);
        scroll.min = scroll.min || Math.max(now - buffer, buffer);
        return scroll;
    }
    function maxContent(layout, elements) {
        layout.setAttribute("content-maximizing", null);
        if (elements.section) {
            if (elements.header) elements.section.style.marginTop = "-" + elements.header.getBoundingClientRect().height + "px";
            if (elements.footer) elements.section.style.marginBottom = "-" + elements.footer.getBoundingClientRect().height + "px";
        }
    }
    function minContent(layout, elements) {
        layout.removeAttribute("content-maximized");
        layout.removeAttribute("content-maximizing");
        if (elements.section) {
            elements.section.style.marginTop = "";
            elements.section.style.marginBottom = "";
        }
    }
    function evaluateScroll(event) {
        if (!event.currentTarget.hasAttribute("content-maximizing")) {
            var target = event.target, layout = event.currentTarget;
            if (this.scrollhide && (target.parentNode == layout || xtag.matchSelector(target, layout.scrollTarget))) {
                var now = target.scrollTop, buffer = layout.scrollBuffer, elements = getLayoutElements(layout), scroll = getLayoutScroll(layout, target);
                if (now > scroll.last) scroll.min = Math.max(now - buffer, buffer); else if (now < scroll.last) scroll.max = Math.max(now + buffer, buffer);
                if (!layout.maxcontent) {
                    if (now > scroll.max && !layout.hasAttribute("content-maximized")) maxContent(layout, elements); else if (now < scroll.min) minContent(layout, elements);
                }
                scroll.last = now;
            }
        }
    }
    xtag.register("x-layout", {
        lifecycle: {
            created: function() {}
        },
        events: {
            scroll: evaluateScroll,
            transitionend: function(e) {
                var elements = getLayoutElements(this);
                if (this.hasAttribute("content-maximizing") && (e.target == elements.header || e.target == elements.section || e.target == elements.footer)) {
                    this.setAttribute("content-maximized", null);
                    this.removeAttribute("content-maximizing");
                }
            },
            "tap:delegate(section)": function(e) {
                var layout = e.currentTarget;
                if (layout.taphide && this.parentNode == layout) {
                    var elements = getLayoutElements(layout);
                    if (layout.hasAttribute("content-maximizing") || layout.hasAttribute("content-maximized")) {
                        if (!layout.maxcontent) minContent(layout, elements);
                    } else maxContent(layout, elements);
                }
            },
            "mouseover:delegate(section)": function(e) {
                var layout = e.currentTarget;
                if (layout.hoverhide && this.parentNode == layout && !layout.hasAttribute("content-maximized") && !layout.hasAttribute("content-maximizing") && (!e.relatedTarget || this.contains(e.target))) {
                    maxContent(layout, getLayoutElements(layout));
                }
            },
            "mouseout:delegate(section)": function(e) {
                var layout = e.currentTarget;
                if (layout.hoverhide && this.parentNode == layout && (layout.hasAttribute("content-maximized") || layout.hasAttribute("content-maximizing")) && (layout == e.relatedTarget || !layout.contains(e.relatedTarget))) {
                    minContent(layout, getLayoutElements(layout));
                }
            }
        },
        accessors: {
            scrollTarget: {
                attribute: {
                    name: "scroll-target"
                }
            },
            scrollBuffer: {
                attribute: {
                    name: "scroll-buffer"
                },
                get: function() {
                    return Number(this.getAttribute("scroll-buffer")) || 30;
                }
            },
            taphide: {
                attribute: {
                    "boolean": true
                }
            },
            hoverhide: {
                attribute: {
                    "boolean": true
                }
            },
            scrollhide: {
                attribute: {
                    "boolean": true
                }
            },
            maxcontent: {
                attribute: {
                    "boolean": true
                },
                set: function(value) {
                    var elements = getLayoutElements(this);
                    if (value) maxContent(this, elements); else if (!this.hasAttribute("content-maximizing")) minContent(this, elements);
                }
            }
        }
    });
})();

(function() {
    var transform = xtag.prefix.js + "Transform";
    function getState(el) {
        var selected = xtag.query(el, "x-slides > x-slide[selected]")[0] || 0;
        return [ selected ? xtag.query(el, "x-slides > x-slide").indexOf(selected) : selected, el.firstElementChild.children.length - 1 ];
    }
    function slide(el, index) {
        var slides = xtag.toArray(el.firstElementChild.children);
        slides.forEach(function(slide) {
            slide.removeAttribute("selected");
        });
        slides[index || 0].setAttribute("selected", true);
        var translate = "translate" + (el.getAttribute("orientation") || "x") + "(" + (index || 0) * (-100 / slides.length) + "%)";
        el.firstElementChild.style[transform] = translate;
        el.firstElementChild.style.transform = translate;
    }
    function init(toSelected) {
        var slides = this.firstElementChild;
        if (!slides || !slides.children.length || slides.tagName.toLowerCase() != "x-slides") return;
        var children = xtag.toArray(slides.children), size = 100 / (children.length || 1), orient = this.getAttribute("orientation") || "x", style = orient == "x" ? [ "width", "height" ] : [ "height", "width" ];
        slides.style[style[1]] = "100%";
        slides.style[style[0]] = children.length * 100 + "%";
        slides.style[transform] = "translate" + orient + "(0%)";
        slides.style.transform = "translate" + orient + "(0%)";
        children.forEach(function(slide) {
            slide.style[style[0]] = size + "%";
            slide.style[style[1]] = "100%";
        });
        if (toSelected) {
            var selected = slides.querySelector("[selected]");
            if (selected) slide(this, children.indexOf(selected) || 0);
        }
    }
    xtag.register("x-slidebox", {
        lifecycle: {
            created: function() {
                init();
            }
        },
        events: {
            transitionend: function(e) {
                if (e.target == this.firstElementChild) {
                    xtag.fireEvent(this, "slideend");
                }
            },
            "show:delegate(x-slide)": function(e) {
                var slide = e.target;
                if (slide.parentNode.nodeName.toLowerCase() === "x-slides" && slide.parentNode.parentNode.nodeName.toLowerCase() === "x-slidebox") {
                    var slideWrap = slide.parentNode;
                    var box = slideWrap.parentNode;
                    var slides = xtag.query(slideWrap, "x-slide");
                    box.slideTo(slides.indexOf(slide));
                }
            }
        },
        accessors: {
            orientation: {
                get: function() {
                    return this.getAttribute("orientation");
                },
                set: function(value) {
                    var slidebox = this;
                    xtag.skipTransition(slidebox.firstElementChild, function() {
                        slidebox.setAttribute("orientation", value.toLowerCase());
                        init.call(slidebox, true);
                    });
                }
            }
        },
        methods: {
            slideTo: function(index) {
                slide(this, index);
            },
            slideNext: function() {
                var shift = getState(this);
                shift[0]++;
                slide(this, shift[0] > shift[1] ? 0 : shift[0]);
            },
            slidePrevious: function() {
                var shift = getState(this);
                shift[0]--;
                slide(this, shift[0] < 0 ? shift[1] : shift[0]);
            }
        }
    });
    xtag.register("x-slide", {
        lifecycle: {
            inserted: function() {
                var ancestor = this.parentNode.parentNode;
                if (ancestor.tagName.toLowerCase() == "x-slidebox") init.call(ancestor, true);
            },
            created: function(e) {
                if (this.parentNode) {
                    var ancestor = this.parentNode.parentNode;
                    if (ancestor.tagName.toLowerCase() == "x-slidebox") init.call(ancestor, true);
                }
            }
        }
    });
})();

(function() {
    var KEYCODES = {
        33: "PAGE_UP",
        34: "PAGE_DOWN",
        35: "END",
        36: "HOME",
        37: "LEFT_ARROW",
        38: "UP_ARROW",
        39: "RIGHT_ARROW",
        40: "DOWN_ARROW"
    };
    var LEFT_MOUSE_BTN = 0;
    function isNum(num) {
        return !isNaN(parseFloat(num));
    }
    function hasNumAttr(elem, attrName) {
        return elem.hasAttribute(attrName) && isNum(elem.getAttribute(attrName));
    }
    function roundToStep(rawRangeVal, step, rangeMin, roundFn) {
        roundFn = roundFn ? roundFn : Math.round;
        rangeMin = isNum(rangeMin) ? rangeMin : 0;
        if (!isNum(rawRangeVal)) {
            throw "invalid value " + rawRangeVal;
        }
        if (!isNum(step) || +step <= 0) {
            throw "invalid step " + step;
        }
        return roundFn((rawRangeVal - rangeMin) / step) * step + rangeMin;
    }
    function constrainToSteppedRange(value, min, max, step) {
        if (value < min) {
            return min;
        } else if (value > max) {
            return Math.max(min, roundToStep(max, step, min, Math.floor));
        } else {
            return value;
        }
    }
    function getDefaultVal(min, max, step) {
        var roundedVal = roundToStep((max - min) / 2 + min, step, min);
        return constrainToSteppedRange(roundedVal, min, max, step);
    }
    function _rawValToFraction(slider, value) {
        var min = slider.min;
        var max = slider.max;
        return (value - min) / (max - min);
    }
    function _fractionToRawVal(slider, fraction) {
        var min = slider.min;
        var max = slider.max;
        return (max - min) * fraction + min;
    }
    function _fractionToCorrectedVal(slider, sliderFraction) {
        sliderFraction = Math.min(Math.max(0, sliderFraction), 1);
        var rawVal = _fractionToRawVal(slider, sliderFraction);
        var roundedVal = roundToStep(rawVal, slider.step, slider.min);
        return constrainToSteppedRange(roundedVal, slider.min, slider.max, slider.step);
    }
    function _positionThumb(slider, value) {
        var thumb = slider.xtag.polyFillSliderThumb;
        if (!thumb) {
            return;
        }
        var sliderRect = slider.getBoundingClientRect();
        var thumbRect = thumb.getBoundingClientRect();
        var fraction = _rawValToFraction(slider, value);
        var availableWidth = Math.max(sliderRect.width - thumbRect.width, 0);
        var newThumbX = availableWidth * fraction;
        var finalPercentage = newThumbX / sliderRect.width;
        thumb.style.left = finalPercentage * 100 + "%";
    }
    function _redraw(slider) {
        _positionThumb(slider, slider.value);
    }
    function _onMouseInput(slider, pageX, pageY) {
        var inputEl = slider.xtag.rangeInputEl;
        var inputOffsets = inputEl.getBoundingClientRect();
        var inputClickX = pageX - inputOffsets.left;
        var oldValue = slider.value;
        var newValue = _fractionToCorrectedVal(slider, inputClickX / inputOffsets.width);
        slider.value = newValue;
        xtag.fireEvent(slider, "input");
        _redraw(slider);
    }
    function _onDragStart(slider, pageX, pageY) {
        slider.xtag.dragInitVal = slider.value;
        _onMouseInput(slider, pageX, pageY);
        var callbacks = slider.xtag.callbackFns;
        var _addBodyListener = function(event, listener) {
            document.body.addEventListener(event, listener);
        };
        _addBodyListener("mousemove", callbacks.onMouseDragMove);
        _addBodyListener("touchmove", callbacks.onTouchDragMove);
        _addBodyListener("mouseup", callbacks.onDragEnd);
        _addBodyListener("touchend", callbacks.onDragEnd);
        var thumb = slider.xtag.polyFillSliderThumb;
        if (thumb) {
            thumb.setAttribute("active", true);
        }
    }
    function _onDragMove(slider, pageX, pageY) {
        _onMouseInput(slider, pageX, pageY);
    }
    function _makeCallbackFns(slider) {
        return {
            onMouseDragStart: function(e) {
                if (e.button !== LEFT_MOUSE_BTN) {
                    return;
                }
                _onDragStart(slider, e.pageX, e.pageY);
                e.preventDefault();
            },
            onTouchDragStart: function(e) {
                var touches = e.targetTouches;
                if (touches.length !== 1) {
                    return;
                }
                _onDragStart(slider, touches[0].pageX, touches[0].pageY);
                e.preventDefault();
            },
            onMouseDragMove: function(e) {
                _onDragMove(slider, e.pageX, e.pageY);
                e.preventDefault();
            },
            onTouchDragMove: function(e) {
                var touches = e.targetTouches;
                if (touches.length !== 1) {
                    return;
                }
                _onDragMove(slider, touches[0].pageX, touches[0].pageY);
                e.preventDefault();
            },
            onDragEnd: function(e) {
                var callbacks = slider.xtag.callbackFns;
                var _removeBodyListener = function(event, listener) {
                    document.body.removeEventListener(event, listener);
                };
                _removeBodyListener("mousemove", callbacks.onMouseDragMove);
                _removeBodyListener("touchmove", callbacks.onTouchDragMove);
                _removeBodyListener("mouseup", callbacks.onDragEnd);
                _removeBodyListener("touchend", callbacks.onDragEnd);
                var thumb = slider.xtag.polyFillSliderThumb;
                if (thumb) {
                    thumb.removeAttribute("active");
                }
                if (slider.value !== slider.xtag.dragInitVal) {
                    xtag.fireEvent(slider, "change");
                }
                slider.xtag.dragInitVal = null;
                e.preventDefault();
            },
            onKeyDown: function(e) {
                var keyCode = e.keyCode;
                if (keyCode in KEYCODES) {
                    var oldVal = this.value;
                    var min = this.min;
                    var max = this.max;
                    var step = this.step;
                    var rangeSize = Math.max(0, max - min);
                    var largeStep = Math.max(rangeSize / 10, step);
                    switch (KEYCODES[keyCode]) {
                      case "LEFT_ARROW":
                      case "DOWN_ARROW":
                        this.value = Math.max(oldVal - step, min);
                        break;

                      case "RIGHT_ARROW":
                      case "UP_ARROW":
                        this.value = Math.min(oldVal + step, max);
                        break;

                      case "HOME":
                        this.value = min;
                        break;

                      case "END":
                        this.value = max;
                        break;

                      case "PAGE_DOWN":
                        this.value = Math.max(oldVal - largeStep, min);
                        break;

                      case "PAGE_UP":
                        this.value = Math.min(oldVal + largeStep, max);
                        break;

                      default:
                        break;
                    }
                    if (this.value !== oldVal) {
                        xtag.fireEvent(this, "change");
                    }
                    e.preventDefault();
                }
            }
        };
    }
    xtag.register("x-slider", {
        lifecycle: {
            created: function() {
                var self = this;
                self.xtag.callbackFns = _makeCallbackFns(self);
                self.xtag.dragInitVal = null;
                var input = document.createElement("input");
                xtag.addClass(input, "input");
                input.setAttribute("type", "range");
                var initMax = hasNumAttr(self, "max") ? +self.getAttribute("max") : 100;
                var initMin = hasNumAttr(self, "min") ? +self.getAttribute("min") : 0;
                var initStep = hasNumAttr(self, "step") ? +self.getAttribute("step") : 1;
                initStep = initStep > 0 ? initStep : 1;
                var initVal = hasNumAttr(self, "value") ? +self.getAttribute("value") : getDefaultVal(initMin, initMax, initStep);
                input.setAttribute("max", initMax);
                input.setAttribute("min", initMin);
                input.setAttribute("step", initStep);
                input.setAttribute("value", initVal);
                self.xtag.rangeInputEl = input;
                self.appendChild(self.xtag.rangeInputEl);
                self.xtag.polyFillSliderThumb = null;
                if (input.type !== "range" || self.hasAttribute("polyfill")) {
                    self.setAttribute("polyfill", true);
                } else {
                    self.removeAttribute("polyfill");
                }
                _redraw(self);
            },
            attributeChanged: function() {
                _redraw(this);
            }
        },
        events: {
            "change:delegate(input[type=range])": function(e) {
                e.stopPropagation();
                xtag.fireEvent(e.currentTarget, "change");
            },
            "input:delegate(input[type=range])": function(e) {
                e.stopPropagation();
                xtag.fireEvent(e.currentTarget, "input");
            },
            "focus:delegate(input[type=range])": function(e) {
                var slider = e.currentTarget;
                xtag.fireEvent(slider, "focus", {}, {
                    bubbles: false
                });
            },
            "blur:delegate(input[type=range])": function(e) {
                var slider = e.currentTarget;
                xtag.fireEvent(slider, "blur", {}, {
                    bubbles: false
                });
            }
        },
        accessors: {
            polyfill: {
                attribute: {
                    "boolean": true
                },
                set: function(isPolyfill) {
                    var callbackFns = this.xtag.callbackFns;
                    if (isPolyfill) {
                        this.setAttribute("tabindex", 0);
                        this.xtag.rangeInputEl.setAttribute("tabindex", -1);
                        this.xtag.rangeInputEl.setAttribute("readonly", true);
<<<<<<< HEAD
=======
                        if (!this.xtag.polyFillSliderTrack) {
                            var sliderTrack = document.createElement("div");
                            xtag.addClass(sliderTrack, "slider-track");
                            this.xtag.polyFillSliderTrack = sliderTrack;
                            this.appendChild(sliderTrack);
                        }
>>>>>>> default skin wip
                        if (!this.xtag.polyFillSliderThumb) {
                            var sliderThumb = document.createElement("span");
                            xtag.addClass(sliderThumb, "slider-thumb");
                            this.xtag.polyFillSliderThumb = sliderThumb;
                            this.appendChild(sliderThumb);
                        }
                        _redraw(this);
                        this.addEventListener("mousedown", callbackFns.onMouseDragStart);
                        this.addEventListener("touchstart", callbackFns.onTouchDragStart);
                        this.addEventListener("keydown", callbackFns.onKeyDown);
                    } else {
                        this.removeAttribute("tabindex");
                        this.xtag.rangeInputEl.removeAttribute("tabindex");
                        this.xtag.rangeInputEl.removeAttribute("readonly");
                        this.removeEventListener("mousedown", callbackFns.onMouseDragStart);
                        this.removeEventListener("touchstart", callbackFns.onTouchDragStart);
                        this.removeEventListener("keydown", callbackFns.onKeyDown);
                    }
                }
            },
            max: {
                attribute: {
                    selector: "input[type=range]"
                },
                get: function() {
                    return +this.xtag.rangeInputEl.getAttribute("max");
                }
            },
            min: {
                attribute: {
                    selector: "input[type=range]"
                },
                get: function() {
                    return +this.xtag.rangeInputEl.getAttribute("min");
                }
            },
            step: {
                attribute: {
                    selector: "input[type=range]"
                },
                get: function() {
                    return +this.xtag.rangeInputEl.getAttribute("step");
                }
            },
            name: {
                attribute: {
                    selector: "input[type=range]"
                },
                set: function(newName) {
                    var input = this.xtag.rangeInputEl;
                    if (newName === null || newName === undefined) {
                        input.removeAttribute("name");
                    } else {
                        input.setAttribute("name", newName);
                    }
                }
            },
            value: {
                attribute: {
                    selector: "input[type=range]"
                },
                get: function() {
                    return +this.xtag.rangeInputEl.value;
                },
                set: function(rawVal) {
                    if (!isNum(rawVal)) {
                        rawVal = getDefaultVal(this.min, this.max, this.step);
                    }
                    rawVal = +rawVal;
                    var min = this.min;
                    var max = this.max;
                    var step = this.step;
                    var roundedVal = roundToStep(rawVal, step, min);
                    var finalVal = constrainToSteppedRange(roundedVal, min, max, step);
                    this.xtag.rangeInputEl.value = finalVal;
                    _redraw(this);
                }
            },
            inputElem: {
                get: function() {
                    return this.xtag.rangeInputEl;
                }
            }
        },
        methods: {}
    });
})();

(function() {
    function getWindowViewport() {
        var docElem = document.documentElement;
        var rect = {
            left: docElem.scrollLeft || document.body.scrollLeft || 0,
            top: docElem.scrollTop || document.body.scrollTop || 0,
            width: docElem.clientWidth,
            height: docElem.clientHeight
        };
        rect.right = rect.left + rect.width;
        rect.bottom = rect.top + rect.height;
        return rect;
    }
    function getRect(el) {
        var rect = el.getBoundingClientRect();
        var viewport = getWindowViewport();
        var docScrollLeft = viewport.left;
        var docScrollTop = viewport.top;
        return {
            left: rect.left + docScrollLeft,
            right: rect.right + docScrollLeft,
            top: rect.top + docScrollTop,
            bottom: rect.bottom + docScrollTop,
            width: rect.width,
            height: rect.height
        };
    }
    function _pointIsInRect(x, y, rect) {
        return rect.left <= x && x <= rect.right && rect.top <= y && y <= rect.bottom;
    }
    xtag.register("x-tabbar", {
        lifecycle: {
            created: function() {
                this.xtag.overallEventToFire = "show";
            }
        },
        events: {
            "tap:delegate(x-tabbar-tab)": function(e) {
                var activeTab = xtag.query(this.parentNode, "x-tabbar-tab[selected]");
                if (activeTab.length) {
                    activeTab.forEach(function(t) {
                        t.removeAttribute("selected");
                    });
                }
                this.setAttribute("selected", true);
            }
        },
        accessors: {
            tabs: {
                get: function() {
                    return xtag.queryChildren(this, "x-tabbar-tab");
                }
            },
            targetEvent: {
                attribute: {
                    name: "target-event"
                },
                get: function() {
                    return this.xtag.overallEventToFire;
                },
                set: function(newEventType) {
                    this.xtag.overallEventToFire = newEventType;
                }
            }
        },
        methods: {}
    });
    function _onTabbarTabTap(tabEl) {
        if (tabEl.parentNode.nodeName.toLowerCase() === "x-tabbar") {
            var targetEvent = tabEl.targetEvent;
            var targets = tabEl.targetSelector ? xtag.query(document, tabEl.targetSelector) : tabEl.targetElems;
            targets.forEach(function(targ) {
                xtag.fireEvent(targ, targetEvent);
            });
        }
    }
    xtag.register("x-tabbar-tab", {
        lifecycle: {
            created: function() {
                this.xtag.targetSelector = null;
                this.xtag.overrideTargetElems = null;
                this.xtag.targetEvent = null;
            }
        },
        events: {
            tap: function(e) {
                var tabEl = e.currentTarget;
                if (e.changedTouches && e.changedTouches.length > 0) {
                    var releasedTouch = e.changedTouches[0];
                    var tabRect = getRect(tabEl);
                    if (_pointIsInRect(releasedTouch.pageX, releasedTouch.pageY, tabRect)) {
                        _onTabbarTabTap(tabEl);
                    }
                } else {
                    _onTabbarTabTap(tabEl);
                }
            }
        },
        accessors: {
            targetSelector: {
                attribute: {
                    name: "target-selector"
                },
                get: function() {
                    return this.xtag.targetSelector;
                },
                set: function(newTargetSelector) {
                    this.xtag.targetSelector = newTargetSelector;
                    if (newTargetSelector) {
                        this.xtag.overrideTargetElems = null;
                    }
                }
            },
            targetElems: {
                get: function() {
                    if (this.targetSelector) {
                        return xtag.query(document, this.targetSelector);
                    } else if (this.xtag.overrideTargetElems !== null) {
                        return this.xtag.overrideTargetElems;
                    } else {
                        return [];
                    }
                },
                set: function(newElems) {
                    this.removeAttribute("target-selector");
                    this.xtag.overrideTargetElems = newElems;
                }
            },
            targetEvent: {
                attribute: {
                    name: "target-event"
                },
                get: function() {
                    if (this.xtag.targetEvent) {
                        return this.xtag.targetEvent;
                    } else if (this.parentNode.nodeName.toLowerCase() === "x-tabbar") {
                        return this.parentNode.targetEvent;
                    } else {
                        throw "tabbar-tab is missing event to fire";
                    }
                },
                set: function(newEvent) {
                    this.xtag.targetEvent = newEvent;
                }
            }
        },
        methods: {}
    });
})();

(function() {
    function setScope(toggle) {
        var form = toggle.xtag.inputEl.form;
        if (form) toggle.removeAttribute("x-toggle-no-form"); else toggle.setAttribute("x-toggle-no-form", "");
        toggle.xtag.scope = toggle.parentNode ? form || document : null;
    }
    function updateScope(scope) {
        var names = {}, docSelector = scope == document ? "[x-toggle-no-form]" : "";
        xtag.query(scope, "x-toggle[name]" + docSelector).forEach(function(toggle) {
            var name = toggle.name;
            if (name && !names[name]) {
                var named = xtag.query(scope, 'x-toggle[name="' + name + '"]' + docSelector), type = named.length > 1 ? "radio" : "checkbox";
                named.forEach(function(toggle) {
                    if (toggle.xtag && toggle.xtag.inputEl) {
                        toggle.type = type;
                    }
                });
                names[name] = true;
            }
        });
    }
    var shifted = false;
    xtag.addEvents(document, {
        DOMComponentsLoaded: function() {
            updateScope(document);
            xtag.toArray(document.forms).forEach(updateScope);
        },
        WebComponentsReady: function() {
            updateScope(document);
            xtag.toArray(document.forms).forEach(updateScope);
        },
        keydown: function(e) {
            shifted = e.shiftKey;
        },
        keyup: function(e) {
            shifted = e.shiftKey;
        },
        "focus:delegate(x-toggle)": function(e) {
            this.setAttribute("focus", "");
        },
        "blur:delegate(x-toggle)": function(e) {
            this.removeAttribute("focus");
        },
        "tap:delegate(x-toggle)": function(e) {
            if (shifted && this.group) {
                var toggles = this.groupToggles, active = this.xtag.scope.querySelector('x-toggle[group="' + this.group + '"][active]');
                if (active && this != active) {
                    var self = this, state = active.checked, index = toggles.indexOf(this), activeIndex = toggles.indexOf(active), minIndex = Math.min(index, activeIndex), maxIndex = Math.max(index, activeIndex);
                    toggles.slice(minIndex, maxIndex).forEach(function(toggler) {
                        if (toggler != self) toggler.checked = state;
                    });
                }
            }
        },
        "change:delegate(x-toggle)": function(e) {
            var active = this.xtag.scope.querySelector('x-toggle[group="' + this.group + '"][active]');
            this.checked = shifted && active && this != active ? active.checked : this.xtag.inputEl.checked;
            if (this.group) {
                this.groupToggles.forEach(function(toggle) {
                    toggle.active = false;
                });
                this.active = true;
            }
        }
    });
    xtag.register("x-toggle", {
        lifecycle: {
            created: function() {
                this.innerHTML = '<label class="x-toggle-input-wrap">' + '<input type="checkbox"></input>' + "</label>" + '<div class="x-toggle-check"></div>' + '<div class="x-toggle-content"></div>';
                this.xtag.inputWrapEl = this.querySelector(".x-toggle-input-wrap");
                this.xtag.inputEl = this.xtag.inputWrapEl.querySelector("input");
                this.xtag.contentWrapEl = this.querySelector(".x-toggle-content-wrap");
                this.xtag.checkEl = this.querySelector(".x-toggle-check");
                this.xtag.contentEl = this.querySelector(".x-toggle-content");
                this.type = "checkbox";
                setScope(this);
                var name = this.getAttribute("name");
                if (name) this.xtag.inputEl.name = this.getAttribute("name");
                if (this.hasAttribute("checked")) this.checked = true;
            },
            inserted: function() {
                setScope(this);
                if (this.parentNode && this.parentNode.nodeName.toLowerCase() === "x-togglegroup") {
                    if (this.parentNode.hasAttribute("name")) {
                        this.name = this.parentNode.getAttribute("name");
                    }
                    if (this.parentNode.hasAttribute("group")) {
                        this.group = this.parentNode.getAttribute("group");
                    }
                    this.setAttribute("no-box", true);
                }
                if (this.name) updateScope(this.xtag.scope);
            },
            removed: function() {
                updateScope(this.xtag.scope);
                setScope(this);
            }
        },
        accessors: {
            noBox: {
                attribute: {
                    name: "no-box",
                    "boolean": true
                },
                set: function() {}
            },
            type: {
                attribute: {},
                set: function(newType) {
                    this.xtag.inputEl.type = newType;
                }
            },
            label: {
                attribute: {},
                get: function() {
                    return this.xtag.contentEl.innerHTML;
                },
                set: function(newLabelContent) {
                    this.xtag.contentEl.innerHTML = newLabelContent;
                }
            },
            active: {
                attribute: {
                    "boolean": true
                }
            },
            group: {
                attribute: {}
            },
            groupToggles: {
                get: function() {
                    return xtag.query(this.xtag.scope, 'x-toggle[group="' + this.group + '"]');
                }
            },
            name: {
                attribute: {
                    skip: true
                },
                get: function() {
                    return this.getAttribute("name");
                },
                set: function(name) {
                    if (name === null) {
                        this.removeAttribute("name");
                        this.type = "checkbox";
                    } else {
                        this.setAttribute("name", name);
                    }
                    this.xtag.inputEl.name = name;
                    updateScope(this.xtag.scope);
                }
            },
            checked: {
                get: function() {
                    return this.xtag.inputEl.checked;
                },
                set: function(value) {
                    var name = this.name, state = value === "true" || value === true;
                    if (name) {
                        var scopeSelector = this.xtag.scope == document ? "[x-toggle-no-form]" : "";
                        var selector = 'x-toggle[checked][name="' + name + '"]' + scopeSelector;
                        var previous = this.xtag.scope.querySelector(selector);
                        if (previous) previous.removeAttribute("checked");
                    }
                    this.xtag.inputEl.checked = state;
                    if (state) this.setAttribute("checked", ""); else this.removeAttribute("checked");
                }
            },
            value: {
                attribute: {},
                get: function() {
                    return this.xtag.inputEl.value;
                },
                set: function(newVal) {
                    this.xtag.inputEl.value = newVal;
                }
            }
        }
    });
})();

(function() {
    var TIP_ORIENT_ARROW_DIR_MAP = {
        top: "down",
        bottom: "up",
        left: "right",
        right: "left"
    };
    var OUTER_TRIGGER_MANAGER;
    var PRESET_STYLE_LISTENERFNS;
    var PREV_SIB_SELECTOR = "_previousSibling";
    var NEXT_SIB_SELECTOR = "_nextSibling";
    var ARROW_DIR_ATTR = "arrow-direction";
    var AUTO_ORIENT_ATTR = "_auto-orientation";
    function isValidOrientation(orient) {
        return orient in TIP_ORIENT_ARROW_DIR_MAP;
    }
    function getWindowViewport() {
        var docElem = document.documentElement;
        var rect = {
            left: docElem.scrollLeft || document.body.scrollLeft || 0,
            top: docElem.scrollTop || document.body.scrollTop || 0,
            width: docElem.clientWidth,
            height: docElem.clientHeight
        };
        rect.right = rect.left + rect.width;
        rect.bottom = rect.top + rect.height;
        return rect;
    }
    function getRect(el) {
        var rect = el.getBoundingClientRect();
        var viewport = getWindowViewport();
        var docScrollLeft = viewport.left;
        var docScrollTop = viewport.top;
        return {
            left: rect.left + docScrollLeft,
            right: rect.right + docScrollLeft,
            top: rect.top + docScrollTop,
            bottom: rect.bottom + docScrollTop,
            width: rect.width,
            height: rect.height
        };
    }
    function getScale(el, rect) {
        rect = rect !== undefined ? rect : getRect(el);
        return {
            x: el.offsetWidth ? rect.width / el.offsetWidth : 1,
            y: el.offsetHeight ? rect.height / el.offsetHeight : 1
        };
    }
    function getRectIntersection(rectA, rectB) {
        if (rectA.right < rectB.left || rectB.right < rectA.left || rectA.bottom < rectB.top || rectB.bottom < rectA.top) {
            return null;
        }
        var intersection = {
            left: Math.max(rectA.left, rectB.left),
            top: Math.max(rectA.top, rectB.top),
            right: Math.min(rectA.right, rectB.right),
            bottom: Math.min(rectA.bottom, rectB.bottom)
        };
        intersection.width = intersection.right - intersection.left;
        intersection.height = intersection.bottom - intersection.top;
        if (intersection.width < 0 || intersection.height < 0) {
            return null;
        }
        return intersection;
    }
    function CachedListener(elem, eventType, listenerFn) {
        this.eventType = eventType;
        this.listenerFn = listenerFn;
        this.elem = elem;
        this._attachedFn = null;
    }
    CachedListener.prototype.attachListener = function() {
        if (!this._attachedFn) {
            this._attachedFn = xtag.addEvent(this.elem, this.eventType, this.listenerFn);
        }
    };
    CachedListener.prototype.removeListener = function() {
        if (this._attachedFn) {
            xtag.removeEvent(this.elem, this.eventType, this._attachedFn);
            this._attachedFn = null;
        }
    };
    function OuterTriggerEventStruct(eventType) {
        this._cachedListener = null;
        this._tooltips = [];
        var struct = this;
        var outerTriggerListener = function(e) {
            struct._tooltips.forEach(function(tooltip) {
                if (!tooltip.xtag._skipOuterClick && tooltip.hasAttribute("visible") && !tooltip.ignoreOuterTrigger && !hasParentNode(e.target, tooltip)) {
                    _hideTooltip(tooltip);
                }
                tooltip.xtag._skipOuterClick = false;
            });
        };
        var cachedListener = this._cachedListener = new CachedListener(document, eventType, outerTriggerListener);
        cachedListener.attachListener();
    }
    OuterTriggerEventStruct.prototype.destroy = function() {
        this._cachedListener.removeListener();
        this._cachedListener = null;
        this._tooltips = null;
    };
    OuterTriggerEventStruct.prototype.containsTooltip = function(tooltip) {
        return this._tooltips.indexOf(tooltip) !== -1;
    };
    OuterTriggerEventStruct.prototype.addTooltip = function(tooltip) {
        if (!this.containsTooltip(tooltip)) {
            this._tooltips.push(tooltip);
        }
    };
    OuterTriggerEventStruct.prototype.removeTooltip = function(tooltip) {
        if (this.containsTooltip(tooltip)) {
            this._tooltips.splice(this._tooltips.indexOf(tooltip), 1);
        }
    };
    Object.defineProperties(OuterTriggerEventStruct.prototype, {
        numTooltips: {
            get: function() {
                return this._tooltips.length;
            }
        }
    });
    function OuterTriggerManager() {
        this.eventStructDict = {};
    }
    OuterTriggerManager.prototype.registerTooltip = function(eventType, tooltip) {
        if (eventType in this.eventStructDict) {
            var eventStruct = this.eventStructDict[eventType];
            if (!eventStruct.containsTooltip(tooltip)) {
                eventStruct.addTooltip(tooltip);
            }
        } else {
            this.eventStructDict[eventType] = new OuterTriggerEventStruct(eventType);
            this.eventStructDict[eventType].addTooltip(tooltip);
        }
    };
    OuterTriggerManager.prototype.unregisterTooltip = function(eventType, tooltip) {
        if (eventType in this.eventStructDict && this.eventStructDict[eventType].containsTooltip(tooltip)) {
            var eventStruct = this.eventStructDict[eventType];
            eventStruct.removeTooltip(tooltip);
            if (eventStruct.numTooltips === 0) {
                eventStruct.destroy();
                delete this.eventStructDict[eventType];
            }
        }
    };
    OUTER_TRIGGER_MANAGER = new OuterTriggerManager();
    function _mkPrevSiblingTargetListener(tooltip, eventName, callback) {
        var filteredCallback = function(e) {
            if (callback && hasParentNode(e.target, tooltip.previousElementSibling)) {
                callback.call(tooltip.previousElementSibling, e);
            }
        };
        return new CachedListener(document.documentElement, eventName, filteredCallback);
    }
    function _mkNextSiblingTargetListener(tooltip, eventName, callback) {
        var eventDelegateStr = eventName + ":delegate(x-tooltip+*)";
        var filteredCallback = function(e) {
            if (callback && this === tooltip.nextElementSibling) {
                callback.call(this, e);
            }
        };
        return new CachedListener(document.documentElement, eventDelegateStr, filteredCallback);
    }
    function _getTargetDelegatedListener(tooltip, targetSelector, eventName, targetCallback) {
        if (targetSelector === PREV_SIB_SELECTOR) {
            return _mkPrevSiblingTargetListener(tooltip, eventName, targetCallback);
        } else if (targetSelector === NEXT_SIB_SELECTOR) {
            return _mkNextSiblingTargetListener(tooltip, eventName, targetCallback);
        } else {
            var delegateEventStr = eventName + ":delegate(" + targetSelector + ")";
            return new CachedListener(document.documentElement, delegateEventStr, function(e) {
                var delegatedElem = this;
                if (!hasParentNode(delegatedElem, tooltip)) {
                    targetCallback.call(delegatedElem, e);
                }
            });
        }
    }
    PRESET_STYLE_LISTENERFNS = {
        custom: function(tooltip, targetSelector) {
            return [];
        },
        hover: function(tooltip, targetSelector) {
            var createdListeners = [];
            var hoverOutTimer = null;
            var hideDelay = 200;
            var cancelTimerFn = function() {
                if (hoverOutTimer) {
                    window.clearTimeout(hoverOutTimer);
                }
                hoverOutTimer = null;
            };
            var showTipTargetFn = mkIgnoreSubchildrenFn(function(e) {
                cancelTimerFn();
                var delegatedElem = this;
                var fromElem = e.relatedTarget || e.toElement;
                if (!hasParentNode(fromElem, tooltip)) {
                    _showTooltip(tooltip, delegatedElem);
                }
            });
            var hideTipTargetFn = mkIgnoreSubchildrenFn(function(e) {
                cancelTimerFn();
                var toElem = e.relatedTarget || e.toElement;
                if (!hasParentNode(toElem, tooltip)) {
                    hoverOutTimer = window.setTimeout(function() {
                        if (tooltip.triggerStyle === "hover") {
                            _hideTooltip(tooltip);
                        }
                    }, hideDelay);
                }
            });
            var targetEnterListener = _getTargetDelegatedListener(tooltip, targetSelector, "enter", showTipTargetFn);
            var targetExitListener = _getTargetDelegatedListener(tooltip, targetSelector, "leave", hideTipTargetFn);
            createdListeners.push(targetEnterListener);
            createdListeners.push(targetExitListener);
            var showTipTooltipFn = mkIgnoreSubchildrenFn(function(e) {
                cancelTimerFn();
                var fromElem = e.relatedTarget || e.toElement;
                var lastTarget = tooltip.xtag.lastTargetElem;
                if (!tooltip.hasAttribute("visible") && lastTarget && !hasParentNode(fromElem, lastTarget)) {
                    _showTooltip(tooltip, lastTarget);
                }
            });
            var hideTipTooltipFn = mkIgnoreSubchildrenFn(function(e) {
                cancelTimerFn();
                var toElem = e.relatedTarget || e.toElement;
                var lastTarget = tooltip.xtag.lastTargetElem;
                if (lastTarget && !hasParentNode(toElem, lastTarget)) {
                    hoverOutTimer = window.setTimeout(function() {
                        if (tooltip.triggerStyle === "hover") {
                            _hideTooltip(tooltip);
                        }
                    }, hideDelay);
                }
            });
            createdListeners.push(new CachedListener(tooltip, "enter", showTipTooltipFn));
            createdListeners.push(new CachedListener(tooltip, "leave", hideTipTooltipFn));
            return createdListeners;
        }
    };
    function mkGenericListeners(tooltip, targetSelector, eventName) {
        var createdListeners = [];
        var targetTriggerFn = function(e) {
            var delegatedElem = this;
            tooltip.xtag._skipOuterClick = true;
            if (tooltip.hasAttribute("visible")) {
                if (delegatedElem === tooltip.xtag.lastTargetElem) {
                    _hideTooltip(tooltip);
                } else {
                    _showTooltip(tooltip, delegatedElem);
                }
            } else {
                _showTooltip(tooltip, delegatedElem);
            }
        };
        var delegatedTargetListener = _getTargetDelegatedListener(tooltip, targetSelector, eventName, targetTriggerFn);
        createdListeners.push(delegatedTargetListener);
        return createdListeners;
    }
    function searchAncestors(elem, conditionFn) {
        while (elem) {
            if (conditionFn(elem)) {
                return elem;
            }
            elem = elem.parentNode;
        }
        return null;
    }
    function hasParentNode(elem, parent) {
        if (parent.contains) {
            return parent.contains(elem);
        } else {
            var condition = function(el) {
                return el === parent;
            };
            return !!searchAncestors(elem, condition);
        }
    }
    function mkIgnoreSubchildrenFn(callback) {
        return function(e) {
            var containerElem = this;
            var relElem = e.relatedTarget || e.toElement;
            if (relElem) {
                if (!hasParentNode(relElem, containerElem)) {
                    callback.call(this, e);
                }
            } else {
                callback.call(this, e);
            }
        };
    }
    function _selectorToElems(tooltip, selector) {
        var elems = [];
        if (selector === PREV_SIB_SELECTOR) {
            elems = tooltip.previousElementSibling ? [ tooltip.previousElementSibling ] : [];
        } else if (selector === NEXT_SIB_SELECTOR) {
            elems = tooltip.nextElementSibling ? [ tooltip.nextElementSibling ] : [];
        } else {
            elems = xtag.query(document, selector);
        }
        var i = 0;
        while (i < elems.length) {
            var elem = elems[i];
            if (hasParentNode(elem, tooltip)) {
                elems.splice(i, 1);
            } else {
                i++;
            }
        }
        return elems;
    }
    function overlaps(elemA, elemB) {
        var _pointIsInRect = function(x, y, rect) {
            return rect.left <= x && x <= rect.right && rect.top <= y && y <= rect.bottom;
        };
        var rectA = getRect(elemA);
        var rectB = getRect(elemB);
        var _cornersOverlapBox = function(rectA, rectB) {
            return _pointIsInRect(rectA.left, rectA.top, rectB) || _pointIsInRect(rectA.right, rectA.top, rectB) || _pointIsInRect(rectA.right, rectA.bottom, rectB) || _pointIsInRect(rectA.left, rectA.bottom, rectB);
        };
        var _isCrossIntersect = function(rectA, rectB) {
            return rectA.top <= rectB.top && rectB.bottom <= rectA.bottom && rectB.left <= rectA.left && rectA.right <= rectB.right;
        };
        return _cornersOverlapBox(rectA, rectB) || _cornersOverlapBox(rectB, rectA) || _isCrossIntersect(rectA, rectB) || _isCrossIntersect(rectB, rectA);
    }
    function getRotationDims(width, height, degrees) {
        var radians = degrees * (Math.PI / 180);
        var rotatedHeight = width * Math.sin(radians) + height * Math.cos(radians);
        var rotatedWidth = width * Math.cos(radians) + height * Math.sin(radians);
        return {
            height: rotatedHeight,
            width: rotatedWidth
        };
    }
    function constrainNum(num, min, max) {
        var output = num;
        output = min !== undefined && min !== null ? Math.max(min, output) : output;
        output = max !== undefined && max !== null ? Math.min(max, output) : output;
        return output;
    }
    function _coordsRelToNewContext(x, y, oldContext, newContext, contextScale) {
        var viewportX, viewportY;
        if (oldContext === window) {
            viewportX = x;
            viewportY = y;
        } else {
            var oldContextRect = getRect(oldContext);
            viewportX = x - oldContextRect.left;
            viewportY = y - oldContextRect.top;
        }
        var newContextRect = getRect(newContext);
        contextScale = contextScale ? contextScale : getScale(newContext, newContextRect);
        var borderTop = newContext.clientTop * contextScale.y;
        var borderLeft = newContext.clientLeft * contextScale.x;
        var scrollTop = newContext.scrollTop * contextScale.y;
        var scrollLeft = newContext.scrollLeft * contextScale.x;
        var translatedCoords = {
            left: viewportX - newContextRect.left - borderLeft,
            top: viewportY - newContextRect.top - borderTop
        };
        if (!hasParentNode(document.body, newContext) && hasParentNode(newContext, document.body)) {
            translatedCoords.top += scrollTop;
            translatedCoords.left += scrollLeft;
        }
        return translatedCoords;
    }
    function _getTooltipConstraints(tooltip, contextRect) {
        if (!contextRect) {
            contextRect = getRect(tooltip.offsetParent || tooltip.parentNode);
        }
        var viewport = getWindowViewport();
        var bounds = viewport;
        if (!tooltip.allowOverflow) {
            bounds = getRectIntersection(viewport, contextRect);
            if (!bounds) bounds = contextRect;
        }
        return bounds;
    }
    function _pickBestTooltipOrient(tooltip, validPositionDataList) {
        if (validPositionDataList.length === 0) return null;
        var bounds = _getTooltipConstraints(tooltip);
        var minX = bounds.left;
        var minY = bounds.top;
        var maxX = bounds.right;
        var maxY = bounds.bottom;
        var inContextData = [];
        var notInContextData = [];
        for (var i = 0; i < validPositionDataList.length; i++) {
            var data = validPositionDataList[i];
            var rect = data.rect;
            if (rect.left < minX || rect.top < minY || rect.right > maxX || rect.bottom > maxY) {
                notInContextData.push(data);
            } else {
                inContextData.push(data);
            }
        }
        var filterDataList = inContextData.length > 0 ? inContextData : notInContextData;
        return filterDataList[0].orient;
    }
    function _forceDisplay(elem) {
        elem.setAttribute("_force-display", true);
    }
    function _unforceDisplay(elem) {
        elem.removeAttribute("_force-display");
    }
    function _autoPositionTooltip(tooltip, targetElem) {
        tooltip.removeAttribute(AUTO_ORIENT_ATTR);
        var arrow = tooltip.xtag.arrowEl, positionRect = null;
        var validOrientDataList = [];
        for (var tmpOrient in TIP_ORIENT_ARROW_DIR_MAP) {
            arrow.setAttribute(ARROW_DIR_ATTR, TIP_ORIENT_ARROW_DIR_MAP[tmpOrient]);
            positionRect = _positionTooltip(tooltip, targetElem, tmpOrient);
            if (!positionRect) {
                continue;
            }
            _forceDisplay(tooltip);
            if (!overlaps(tooltip, targetElem)) {
                validOrientDataList.push({
                    orient: tmpOrient,
                    rect: positionRect
                });
            }
            _unforceDisplay(tooltip);
        }
        var bestOrient = _pickBestTooltipOrient(tooltip, validOrientDataList);
        if (!bestOrient) bestOrient = "top";
        tooltip.setAttribute(AUTO_ORIENT_ATTR, bestOrient);
        arrow.setAttribute(ARROW_DIR_ATTR, TIP_ORIENT_ARROW_DIR_MAP[bestOrient]);
        if (isValidOrientation(bestOrient) && bestOrient !== tmpOrient) {
            return _positionTooltip(tooltip, targetElem, bestOrient);
        } else {
            return positionRect;
        }
    }
    function _positionTooltip(tooltip, targetElem, orientation, reattemptDepth) {
        if (!tooltip.parentNode) {
            tooltip.left = "";
            tooltip.top = "";
            return null;
        }
        reattemptDepth = reattemptDepth === undefined ? 0 : reattemptDepth;
        var arrow = tooltip.xtag.arrowEl;
        if (!isValidOrientation(orientation)) {
            return _autoPositionTooltip(tooltip, targetElem);
        }
        var tipContext = tooltip.offsetParent ? tooltip.offsetParent : tooltip.parentNode;
        if (!reattemptDepth) {
            tooltip.style.top = "";
            tooltip.style.left = "";
            arrow.style.top = "";
            arrow.style.left = "";
        }
        _forceDisplay(tooltip);
        var viewport = getWindowViewport();
        var contextRect = getRect(tipContext);
        var contextScale = getScale(tipContext, contextRect);
        var contextViewWidth = tipContext.clientWidth * contextScale.x;
        var contextViewHeight = tipContext.clientHeight * contextScale.y;
        var targetRect = getRect(targetElem);
        var targetWidth = targetRect.width;
        var targetHeight = targetRect.height;
        var tooltipRect = getRect(tooltip);
        var tooltipScale = getScale(tooltip, tooltipRect);
        var origTooltipWidth = tooltipRect.width;
        var origTooltipHeight = tooltipRect.height;
        var renderedTooltipWidth = tooltipRect.width;
        var renderedTooltipHeight = tooltipRect.height;
        var tipPlacementOffsetX = (renderedTooltipWidth - origTooltipWidth) / 2;
        var tipPlacementOffsetY = (renderedTooltipHeight - origTooltipHeight) / 2;
        var arrowWidth = arrow.offsetWidth * tooltipScale.x;
        var arrowHeight = arrow.offsetHeight * tooltipScale.y;
        var arrowRotationDegs = 45;
        var arrowDims = getRotationDims(arrowWidth, arrowHeight, arrowRotationDegs);
        arrowWidth = arrowDims.width;
        arrowHeight = arrowDims.height;
        if (orientation === "top" || orientation === "bottom") {
            arrowHeight /= 2;
        } else {
            arrowWidth /= 2;
        }
        var bounds = _getTooltipConstraints(tooltip, contextRect);
        var minRawLeft = bounds.left;
        var minRawTop = bounds.top;
        var maxRawLeft = bounds.right - origTooltipWidth;
        var maxRawTop = bounds.bottom - origTooltipHeight;
        var idealTipCenterAlignCoords = {
            left: targetRect.left + (targetWidth - origTooltipWidth) / 2,
            top: targetRect.top + (targetHeight - origTooltipHeight) / 2
        };
        var idealRawLeft = idealTipCenterAlignCoords.left;
        var idealRawTop = idealTipCenterAlignCoords.top;
        if (orientation === "top") {
            idealRawTop = targetRect.top - renderedTooltipHeight - arrowHeight;
            maxRawTop -= arrowHeight;
        } else if (orientation === "bottom") {
            idealRawTop = targetRect.top + targetHeight + arrowHeight;
            maxRawTop -= arrowHeight;
        } else if (orientation === "left") {
            idealRawLeft = targetRect.left - renderedTooltipWidth - arrowWidth;
            maxRawLeft -= arrowWidth;
        } else if (orientation === "right") {
            idealRawLeft = targetRect.left + targetWidth + arrowWidth;
            maxRawLeft -= arrowWidth;
        } else {
            throw "invalid orientation " + orientation;
        }
        var rawLeft = constrainNum(idealRawLeft, minRawLeft, maxRawLeft);
        var rawTop = constrainNum(idealRawTop, minRawTop, maxRawTop);
        rawLeft += tipPlacementOffsetX;
        rawTop += tipPlacementOffsetY;
        var _isFixed = function(el) {
            if (!window.getComputedStyle || el === document || el === document.documentElement) {
                return false;
            }
            var styles;
            try {
                styles = window.getComputedStyle(el);
            } catch (e) {
                return false;
            }
            return styles && styles.position === "fixed";
        };
        var newLeft;
        var newTop;
        var fixedAncestor = searchAncestors(targetElem, _isFixed);
        if (fixedAncestor && !hasParentNode(tooltip, fixedAncestor)) {
            newLeft = rawLeft - viewport.left;
            newTop = rawTop - viewport.top;
            tooltip.setAttribute("_target-fixed", true);
        } else {
            var relativeCoords = _coordsRelToNewContext(rawLeft, rawTop, window, tipContext, contextScale);
            newLeft = relativeCoords.left;
            newTop = relativeCoords.top;
            tooltip.removeAttribute("_target-fixed");
        }
        tooltip.style.top = newTop + "px";
        tooltip.style.left = newLeft + "px";
        var maxVal;
        var arrowParentSize;
        var arrowStyleProp;
        var rawArrowCenter;
        var tipTargetDiff;
        if (orientation === "top" || orientation === "bottom") {
            rawArrowCenter = (targetWidth - arrowWidth) / 2;
            tipTargetDiff = targetRect.left - rawLeft;
            maxVal = origTooltipWidth - arrowWidth;
            arrowParentSize = origTooltipWidth;
            arrowStyleProp = "left";
        } else {
            rawArrowCenter = (targetHeight - arrowHeight) / 2;
            tipTargetDiff = targetRect.top - rawTop;
            maxVal = origTooltipHeight - arrowHeight;
            arrowParentSize = origTooltipHeight;
            arrowStyleProp = "top";
        }
        var arrowVal = constrainNum(rawArrowCenter + tipTargetDiff, 0, maxVal);
        var arrowFrac = arrowParentSize ? arrowVal / arrowParentSize : 0;
        arrow.style[arrowStyleProp] = arrowFrac * 100 + "%";
        var newTooltipWidth = tooltip.offsetWidth * tooltipScale.x;
        var newTooltipHeight = tooltip.offsetHeight * tooltipScale.y;
        var newContextViewWidth = tipContext.clientWidth * contextScale.x;
        var newContextViewHeight = tipContext.clientHeight * contextScale.y;
        _unforceDisplay(tooltip);
        var recursionLimit = 2;
        if (reattemptDepth < recursionLimit && (origTooltipWidth !== newTooltipWidth || origTooltipHeight !== newTooltipHeight || contextViewWidth !== newContextViewWidth || contextViewHeight !== newContextViewHeight)) {
            return _positionTooltip(tooltip, targetElem, orientation, reattemptDepth + 1);
        } else {
            return {
                left: rawLeft,
                top: rawTop,
                width: newTooltipWidth,
                height: newTooltipHeight,
                right: rawLeft + newTooltipWidth,
                bottom: rawTop + newTooltipHeight
            };
        }
    }
    function _showTooltip(tooltip, triggerElem) {
        if (triggerElem === tooltip) {
            console.warn("The tooltip's target element is the tooltip itself!" + " Is this intentional?");
        }
        var arrow = tooltip.xtag.arrowEl;
        if (!arrow.parentNode) {
            console.warn("The inner component DOM of the tooltip " + "appears to be missing. Make sure to edit tooltip" + " contents through the .contentEl property instead of" + "directly on the x-tooltip to avoid " + "clobbering the component's internals.");
        }
        var targetOrient = tooltip.orientation;
        var _readyToShowFn = function() {
            _unforceDisplay(tooltip);
            tooltip.setAttribute("visible", true);
            xtag.fireEvent(tooltip, "tooltipshown", {
                triggerElem: triggerElem
            });
        };
        if (triggerElem) {
            tooltip.xtag.lastTargetElem = triggerElem;
            xtag.skipTransition(tooltip, function() {
                _positionTooltip(tooltip, triggerElem, targetOrient);
                return _readyToShowFn;
            });
        } else {
            tooltip.style.top = "";
            tooltip.style.left = "";
            arrow.style.top = "";
            arrow.style.left = "";
            _readyToShowFn();
        }
    }
    function _hideTooltip(tooltip) {
        if (isValidOrientation(tooltip.orientation)) {
            tooltip.removeAttribute(AUTO_ORIENT_ATTR);
        }
        if (tooltip.hasAttribute("visible")) {
            _forceDisplay(tooltip);
            tooltip.xtag._hideTransitionFlag = true;
            tooltip.removeAttribute("visible");
        }
    }
    function _destroyListeners(tooltip) {
        var cachedListeners = tooltip.xtag.cachedListeners;
        cachedListeners.forEach(function(cachedListener) {
            cachedListener.removeListener();
        });
        tooltip.xtag.cachedListeners = [];
        OUTER_TRIGGER_MANAGER.unregisterTooltip(tooltip.triggerStyle, tooltip);
    }
    function _updateTriggerListeners(tooltip, newTargetSelector, newTriggerStyle) {
        if (!tooltip.parentNode) {
            return;
        }
        if (newTargetSelector === undefined || newTargetSelector === null) {
            newTargetSelector = tooltip.targetSelector;
        }
        if (newTriggerStyle === undefined || newTriggerStyle === null) {
            newTriggerStyle = tooltip.triggerStyle;
        }
        var newTriggerElems = _selectorToElems(tooltip, newTargetSelector);
        if (newTriggerElems.indexOf(tooltip.xtag.lastTargetElem) === -1) {
            tooltip.xtag.lastTargetElem = newTriggerElems.length > 0 ? newTriggerElems[0] : null;
            _positionTooltip(tooltip, tooltip.xtag.lastTargetElem, tooltip.orientation);
        }
        _destroyListeners(tooltip);
        var listeners;
        if (newTriggerStyle in PRESET_STYLE_LISTENERFNS) {
            var getListenersFn = PRESET_STYLE_LISTENERFNS[newTriggerStyle];
            listeners = getListenersFn(tooltip, newTargetSelector);
        } else {
            listeners = mkGenericListeners(tooltip, newTargetSelector, newTriggerStyle);
            OUTER_TRIGGER_MANAGER.registerTooltip(newTriggerStyle, tooltip);
        }
        listeners.forEach(function(listener) {
            listener.attachListener();
        });
        tooltip.xtag.cachedListeners = listeners;
        _hideTooltip(tooltip);
    }
    xtag.register("x-tooltip", {
        lifecycle: {
            created: function() {
                var self = this;
                self.xtag.contentEl = document.createElement("div");
                self.xtag.arrowEl = document.createElement("span");
                xtag.addClass(self.xtag.contentEl, "tooltip-content");
                xtag.addClass(self.xtag.arrowEl, "tooltip-arrow");
                self.xtag.contentEl.innerHTML = self.innerHTML;
                self.innerHTML = "";
                self.appendChild(self.xtag.contentEl);
                self.appendChild(self.xtag.arrowEl);
                self.xtag._orientation = "auto";
                self.xtag._targetSelector = PREV_SIB_SELECTOR;
                self.xtag._triggerStyle = "click";
                var triggeringElems = _selectorToElems(self, self.xtag._targetSelector);
                self.xtag.lastTargetElem = triggeringElems.length > 0 ? triggeringElems[0] : null;
                self.xtag.cachedListeners = [];
                self.xtag._hideTransitionFlag = false;
                self.xtag._skipOuterClick = false;
            },
            inserted: function() {
                _updateTriggerListeners(this, this.xtag._targetSelector, this.xtag._triggerStyle);
            },
            removed: function() {
                _destroyListeners(this);
            }
        },
        events: {
            transitionend: function(e) {
                var tooltip = e.currentTarget;
                if (tooltip.xtag._hideTransitionFlag && !tooltip.hasAttribute("visible")) {
                    tooltip.xtag._hideTransitionFlag = false;
                    xtag.fireEvent(tooltip, "tooltiphidden");
                }
                _unforceDisplay(tooltip);
            }
        },
        accessors: {
            orientation: {
                attribute: {},
                get: function() {
                    return this.xtag._orientation;
                },
                set: function(newOrientation) {
                    newOrientation = newOrientation.toLowerCase();
                    var arrow = this.querySelector(".tooltip-arrow");
                    var newArrowDir = null;
                    if (isValidOrientation(newOrientation)) {
                        newArrowDir = TIP_ORIENT_ARROW_DIR_MAP[newOrientation];
                        arrow.setAttribute(ARROW_DIR_ATTR, newArrowDir);
                        this.removeAttribute(AUTO_ORIENT_ATTR);
                    } else {
                        arrow.removeAttribute(ARROW_DIR_ATTR);
                    }
                    this.xtag._orientation = newOrientation;
                    this.refreshPosition();
                }
            },
            triggerStyle: {
                attribute: {
                    name: "trigger-style"
                },
                get: function() {
                    return this.xtag._triggerStyle;
                },
                set: function(newTriggerStyle) {
                    _updateTriggerListeners(this, this.targetSelector, newTriggerStyle);
                    this.xtag._triggerStyle = newTriggerStyle;
                }
            },
            targetSelector: {
                attribute: {
                    name: "target-selector"
                },
                get: function() {
                    return this.xtag._targetSelector;
                },
                set: function(newSelector) {
                    var newTriggerElems = _selectorToElems(this, newSelector);
                    _updateTriggerListeners(this, newSelector, this.triggerStyle);
                    this.xtag._targetSelector = newSelector;
                }
            },
            ignoreOuterTrigger: {
                attribute: {
                    "boolean": true,
                    name: "ignore-outer-trigger"
                }
            },
            ignoreTooltipPointerEvents: {
                attribute: {
                    "boolean": true,
                    name: "ignore-tooltip-pointer-events"
                }
            },
            allowOverflow: {
                attribute: {
                    "boolean": true,
                    name: "allow-overflow"
                },
                set: function(allowsOverflow) {
                    this.refreshPosition();
                }
            },
            contentEl: {
                get: function() {
                    return this.xtag.contentEl;
                },
                set: function(newContentElem) {
                    var oldContent = this.xtag.contentEl;
                    xtag.addClass(newContentElem, "tooltip-content");
                    this.replaceChild(newContentElem, oldContent);
                    this.xtag.contentEl = newContentElem;
                    this.refreshPosition();
                }
            },
            presetTriggerStyles: {
                get: function() {
                    var output = [];
                    for (var presetName in PRESET_STYLE_LISTENERFNS) {
                        output.push(presetName);
                    }
                    return output;
                }
            },
            targetElems: {
                get: function() {
                    return _selectorToElems(this, this.targetSelector);
                }
            }
        },
        methods: {
            refreshPosition: function() {
                if (this.xtag.lastTargetElem) {
                    _positionTooltip(this, this.xtag.lastTargetElem, this.orientation);
                }
            },
            show: function() {
                _showTooltip(this, this.xtag.lastTargetElem);
            },
            hide: function() {
                _hideTooltip(this);
            },
            toggle: function() {
                if (this.hasAttribute("visible")) {
                    this.hide();
                } else {
                    this.show();
                }
            }
        }
    });
<<<<<<< HEAD
})();
=======
window.Platform={};var logFlags={};!function(){function a(a){if(this._element=a,a.className!=this._classCache){if(this._classCache=a.className,!this._classCache)return;var b,c=this._classCache.replace(/^\s+|\s+$/g,"").split(/\s+/);for(b=0;b<c.length;b++)g.call(this,c[b])}}function b(a,b){a.className=b.join(" ")}function c(a,b,c){Object.defineProperty?Object.defineProperty(a,b,{get:c}):a.__defineGetter__(b,c)}if(!("undefined"==typeof window.Element||"classList"in document.documentElement)){var d=Array.prototype,e=d.indexOf,f=d.slice,g=d.push,h=d.splice,i=d.join;a.prototype={add:function(a){this.contains(a)||(g.call(this,a),b(this._element,f.call(this,0)))},contains:function(a){return-1!==e.call(this,a)},item:function(a){return this[a]||null},remove:function(a){var c=e.call(this,a);-1!==c&&(h.call(this,c,1),b(this._element,f.call(this,0)))},toString:function(){return i.call(this," ")},toggle:function(a){-1===e.call(this,a)?this.add(a):this.remove(a)}},window.DOMTokenList=a,c(Element.prototype,"classList",function(){return new a(this)})}}(),"undefined"==typeof WeakMap&&!function(){var a=Object.defineProperty,b=Date.now()%1e9,c=function(){this.name="__st"+(1e9*Math.random()>>>0)+(b++ +"__")};c.prototype={set:function(b,c){var d=b[this.name];d&&d[0]===b?d[1]=c:a(b,this.name,{value:[b,c],writable:!0})},get:function(a){var b;return(b=a[this.name])&&b[0]===a?b[1]:void 0},"delete":function(a){this.set(a,void 0)}},window.WeakMap=c}();var SideTable;if("undefined"!=typeof WeakMap&&navigator.userAgent.indexOf("Firefox/")<0?SideTable=WeakMap:!function(){var a=Object.defineProperty,b=Date.now()%1e9;SideTable=function(){this.name="__st"+(1e9*Math.random()>>>0)+(b++ +"__")},SideTable.prototype={set:function(b,c){var d=b[this.name];d&&d[0]===b?d[1]=c:a(b,this.name,{value:[b,c],writable:!0})},get:function(a){var b;return(b=a[this.name])&&b[0]===a?b[1]:void 0},"delete":function(a){this.set(a,void 0)}}}(),function(a){function b(a){u.push(a),t||(t=!0,q(d))}function c(a){return window.ShadowDOMPolyfill&&window.ShadowDOMPolyfill.wrapIfNeeded(a)||a}function d(){t=!1;var a=u;u=[],a.sort(function(a,b){return a.uid_-b.uid_});var b=!1;a.forEach(function(a){var c=a.takeRecords();e(a),c.length&&(a.callback_(c,a),b=!0)}),b&&d()}function e(a){a.nodes_.forEach(function(b){var c=p.get(b);c&&c.forEach(function(b){b.observer===a&&b.removeTransientObservers()})})}function f(a,b){for(var c=a;c;c=c.parentNode){var d=p.get(c);if(d)for(var e=0;e<d.length;e++){var f=d[e],g=f.options;if(c===a||g.subtree){var h=b(g);h&&f.enqueue(h)}}}}function g(a){this.callback_=a,this.nodes_=[],this.records_=[],this.uid_=++v}function h(a,b){this.type=a,this.target=b,this.addedNodes=[],this.removedNodes=[],this.previousSibling=null,this.nextSibling=null,this.attributeName=null,this.attributeNamespace=null,this.oldValue=null}function i(a){var b=new h(a.type,a.target);return b.addedNodes=a.addedNodes.slice(),b.removedNodes=a.removedNodes.slice(),b.previousSibling=a.previousSibling,b.nextSibling=a.nextSibling,b.attributeName=a.attributeName,b.attributeNamespace=a.attributeNamespace,b.oldValue=a.oldValue,b}function j(a,b){return w=new h(a,b)}function k(a){return x?x:(x=i(w),x.oldValue=a,x)}function l(){w=x=void 0}function m(a){return a===x||a===w}function n(a,b){return a===b?a:x&&m(a)?x:null}function o(a,b,c){this.observer=a,this.target=b,this.options=c,this.transientObservedNodes=[]}var p=new SideTable,q=window.msSetImmediate;if(!q){var r=[],s=String(Math.random());window.addEventListener("message",function(a){if(a.data===s){var b=r;r=[],b.forEach(function(a){a()})}}),q=function(a){r.push(a),window.postMessage(s,"*")}}var t=!1,u=[],v=0;g.prototype={observe:function(a,b){if(a=c(a),!b.childList&&!b.attributes&&!b.characterData||b.attributeOldValue&&!b.attributes||b.attributeFilter&&b.attributeFilter.length&&!b.attributes||b.characterDataOldValue&&!b.characterData)throw new SyntaxError;var d=p.get(a);d||p.set(a,d=[]);for(var e,f=0;f<d.length;f++)if(d[f].observer===this){e=d[f],e.removeListeners(),e.options=b;break}e||(e=new o(this,a,b),d.push(e),this.nodes_.push(a)),e.addListeners()},disconnect:function(){this.nodes_.forEach(function(a){for(var b=p.get(a),c=0;c<b.length;c++){var d=b[c];if(d.observer===this){d.removeListeners(),b.splice(c,1);break}}},this),this.records_=[]},takeRecords:function(){var a=this.records_;return this.records_=[],a}};var w,x;o.prototype={enqueue:function(a){var c=this.observer.records_,d=c.length;if(c.length>0){var e=c[d-1],f=n(e,a);if(f)return c[d-1]=f,void 0}else b(this.observer);c[d]=a},addListeners:function(){this.addListeners_(this.target)},addListeners_:function(a){var b=this.options;b.attributes&&a.addEventListener("DOMAttrModified",this,!0),b.characterData&&a.addEventListener("DOMCharacterDataModified",this,!0),b.childList&&a.addEventListener("DOMNodeInserted",this,!0),(b.childList||b.subtree)&&a.addEventListener("DOMNodeRemoved",this,!0)},removeListeners:function(){this.removeListeners_(this.target)},removeListeners_:function(a){var b=this.options;b.attributes&&a.removeEventListener("DOMAttrModified",this,!0),b.characterData&&a.removeEventListener("DOMCharacterDataModified",this,!0),b.childList&&a.removeEventListener("DOMNodeInserted",this,!0),(b.childList||b.subtree)&&a.removeEventListener("DOMNodeRemoved",this,!0)},addTransientObserver:function(a){if(a!==this.target){this.addListeners_(a),this.transientObservedNodes.push(a);var b=p.get(a);b||p.set(a,b=[]),b.push(this)}},removeTransientObservers:function(){var a=this.transientObservedNodes;this.transientObservedNodes=[],a.forEach(function(a){this.removeListeners_(a);for(var b=p.get(a),c=0;c<b.length;c++)if(b[c]===this){b.splice(c,1);break}},this)},handleEvent:function(a){switch(a.stopImmediatePropagation(),a.type){case"DOMAttrModified":var b=a.attrName,c=a.relatedNode.namespaceURI,d=a.target,e=new j("attributes",d);e.attributeName=b,e.attributeNamespace=c;var g=a.attrChange===MutationEvent.ADDITION?null:a.prevValue;f(d,function(a){return!a.attributes||a.attributeFilter&&a.attributeFilter.length&&-1===a.attributeFilter.indexOf(b)&&-1===a.attributeFilter.indexOf(c)?void 0:a.attributeOldValue?k(g):e});break;case"DOMCharacterDataModified":var d=a.target,e=j("characterData",d),g=a.prevValue;f(d,function(a){return a.characterData?a.characterDataOldValue?k(g):e:void 0});break;case"DOMNodeRemoved":this.addTransientObserver(a.target);case"DOMNodeInserted":var h,i,d=a.relatedNode,m=a.target;"DOMNodeInserted"===a.type?(h=[m],i=[]):(h=[],i=[m]);var n=m.previousSibling,o=m.nextSibling,e=j("childList",d);e.addedNodes=h,e.removedNodes=i,e.previousSibling=n,e.nextSibling=o,f(d,function(a){return a.childList?e:void 0})}l()}},a.JsMutationObserver=g}(this),!window.MutationObserver&&(window.MutationObserver=window.WebKitMutationObserver||window.JsMutationObserver,!MutationObserver))throw new Error("no mutation observer support");!function(a){function b(b,f){var g=f||{};if(!b)throw new Error("document.register: first argument `name` must not be empty");if(b.indexOf("-")<0)throw new Error("document.register: first argument ('name') must contain a dash ('-'). Argument provided was '"+String(b)+"'.");if(g.name=b,!g.prototype)throw new Error("Options missing required prototype property");return g.lifecycle=g.lifecycle||{},g.ancestry=c(g.extends),d(g),e(g),k(g.prototype),m(b,g),g.ctor=n(g),g.ctor.prototype=g.prototype,g.prototype.constructor=g.ctor,a.ready&&a.upgradeAll(document),g.ctor}function c(a){var b=v[a];return b?c(b.extends).concat([b]):[]}function d(a){for(var b,c=a.extends,d=0;b=a.ancestry[d];d++)c=b.is&&b.tag;a.tag=c||a.name,c&&(a.is=a.name)}function e(a){if(!Object.__proto__){var b=HTMLElement.prototype;if(a.is){var c=document.createElement(a.tag);b=Object.getPrototypeOf(c)}for(var d,e=a.prototype;e&&e!==b;){var d=Object.getPrototypeOf(e);e.__proto__=d,e=d}}a.native=b}function f(a){return g(w(a.tag),a)}function g(b,c){return c.is&&b.setAttribute("is",c.is),h(b,c),b.__upgraded__=!0,a.upgradeSubtree(b),j(b),b}function h(a,b){Object.__proto__?a.__proto__=b.prototype:(i(a,b.prototype,b.native),a.__proto__=b.prototype)}function i(a,b,c){for(var d={},e=b;e!==c&&e!==HTMLUnknownElement.prototype;){for(var f,g=Object.getOwnPropertyNames(e),h=0;f=g[h];h++)d[f]||(Object.defineProperty(a,f,Object.getOwnPropertyDescriptor(e,f)),d[f]=1);e=Object.getPrototypeOf(e)}}function j(a){a.createdCallback&&a.createdCallback()}function k(a){var b=a.setAttribute;a.setAttribute=function(a,c){l.call(this,a,c,b)};var c=a.removeAttribute;a.removeAttribute=function(a,b){l.call(this,a,b,c)}}function l(a,b,c){var d=this.getAttribute(a);c.apply(this,arguments),this.attributeChangedCallback&&this.getAttribute(a)!==d&&this.attributeChangedCallback(a,d)}function m(a,b){v[a]=b}function n(a){return function(){return f(a)}}function o(a,b){var c=v[b||a];return c?new c.ctor:w(a)}function p(a){if(!a.__upgraded__&&a.nodeType===Node.ELEMENT_NODE){var b=a.getAttribute("is")||a.localName,c=v[b];return c&&g(a,c)}}function q(b){var c=x.call(this,b);return a.upgradeAll(c),c}a||(a=window.CustomElements={flags:{}});var r=a.flags,s=Boolean(document.register),t=!r.register&&s;if(t){var u=function(){};a.registry={},a.upgradeElement=u,a.watchShadow=u,a.upgrade=u,a.upgradeAll=u,a.upgradeSubtree=u,a.observeDocument=u,a.upgradeDocument=u,a.takeRecords=u}else{var v={},w=document.createElement.bind(document),x=Node.prototype.cloneNode;document.register=b,document.createElement=o,Node.prototype.cloneNode=q,a.registry=v,a.upgrade=p}a.hasNative=s,a.useNative=t}(window.CustomElements),function(a){function b(a,c,d){var e=a.firstElementChild;if(!e)for(e=a.firstChild;e&&e.nodeType!==Node.ELEMENT_NODE;)e=e.nextSibling;for(;e;)c(e,d)!==!0&&b(e,c,d),e=e.nextElementSibling;return null}function c(a,b){for(var c=a.shadowRoot;c;)d(c,b),c=c.olderShadowRoot}function d(a,d){b(a,function(a){return d(a)?!0:(c(a,d),void 0)}),c(a,d)}function e(a){return h(a)?(i(a),!0):(l(a),void 0)}function f(a){d(a,function(a){return e(a)?!0:void 0})}function g(a){return e(a)||f(a)}function h(b){if(!b.__upgraded__&&b.nodeType===Node.ELEMENT_NODE){var c=b.getAttribute("is")||b.localName,d=a.registry[c];if(d)return y.dom&&console.group("upgrade:",b.localName),a.upgrade(b),y.dom&&console.groupEnd(),!0}}function i(a){l(a),p(a)&&d(a,function(a){l(a)})}function j(a){if(B.push(a),!A){A=!0;var b=window.Platform&&window.Platform.endOfMicrotask||setTimeout;b(k)}}function k(){A=!1;for(var a,b=B,c=0,d=b.length;d>c&&(a=b[c]);c++)a();B=[]}function l(a){z?j(function(){m(a)}):m(a)}function m(a){(a.enteredViewCallback||a.__upgraded__&&y.dom)&&(y.dom&&console.group("inserted:",a.localName),p(a)&&(a.__inserted=(a.__inserted||0)+1,a.__inserted<1&&(a.__inserted=1),a.__inserted>1?y.dom&&console.warn("inserted:",a.localName,"insert/remove count:",a.__inserted):a.enteredViewCallback&&(y.dom&&console.log("inserted:",a.localName),a.enteredViewCallback())),y.dom&&console.groupEnd())}function n(a){o(a),d(a,function(a){o(a)})}function o(a){z?j(function(){_removed(a)}):_removed(a)}function o(a){(a.leftViewCallback||a.__upgraded__&&y.dom)&&(y.dom&&console.log("removed:",a.localName),p(a)||(a.__inserted=(a.__inserted||0)-1,a.__inserted>0&&(a.__inserted=0),a.__inserted<0?y.dom&&console.warn("removed:",a.localName,"insert/remove count:",a.__inserted):a.leftViewCallback&&a.leftViewCallback()))}function p(a){for(var b=a,c=window.ShadowDOMPolyfill&&window.ShadowDOMPolyfill.wrapIfNeeded(document)||document;b;){if(b==c)return!0;b=b.parentNode||b.host}}function q(a){if(a.shadowRoot&&!a.shadowRoot.__watched){y.dom&&console.log("watching shadow-root for: ",a.localName);for(var b=a.shadowRoot;b;)r(b),b=b.olderShadowRoot}}function r(a){a.__watched||(v(a),a.__watched=!0)}function s(a){switch(a.localName){case"style":case"script":case"template":case void 0:return!0}}function t(a){if(y.dom){var b=a[0];if(b&&"childList"===b.type&&b.addedNodes&&b.addedNodes){for(var c=b.addedNodes[0];c&&c!==document&&!c.host;)c=c.parentNode;var d=c&&(c.URL||c._URL||c.host&&c.host.localName)||"";d=d.split("/?").shift().split("/").pop()}console.group("mutations (%d) [%s]",a.length,d||"")}a.forEach(function(a){"childList"===a.type&&(D(a.addedNodes,function(a){s(a)||g(a)}),D(a.removedNodes,function(a){s(a)||n(a)}))}),y.dom&&console.groupEnd()}function u(){t(C.takeRecords()),k()}function v(a){C.observe(a,{childList:!0,subtree:!0})}function w(a){v(a)}function x(a){y.dom&&console.group("upgradeDocument: ",(a.URL||a._URL||"").split("/").pop()),g(a),y.dom&&console.groupEnd()}var y=window.logFlags||{},z=!window.MutationObserver||window.MutationObserver===window.JsMutationObserver;a.hasPolyfillMutations=z;var A=!1,B=[],C=new MutationObserver(t),D=Array.prototype.forEach.call.bind(Array.prototype.forEach);a.watchShadow=q,a.upgradeAll=g,a.upgradeSubtree=f,a.observeDocument=w,a.upgradeDocument=x,a.takeRecords=u}(window.CustomElements),function(){function a(a){return"link"===a.localName&&a.getAttribute("rel")===b}var b=window.HTMLImports?HTMLImports.IMPORT_LINK_TYPE:"none",c={selectors:["link[rel="+b+"]"],map:{link:"parseLink"},parse:function(a){if(!a.__parsed){a.__parsed=!0;var b=a.querySelectorAll(c.selectors);d(b,function(a){c[c.map[a.localName]](a)}),CustomElements.upgradeDocument(a),CustomElements.observeDocument(a)}},parseLink:function(b){a(b)&&this.parseImport(b)},parseImport:function(a){a.content&&c.parse(a.content)}},d=Array.prototype.forEach.call.bind(Array.prototype.forEach);CustomElements.parser=c}(),function(){function a(){CustomElements.parser.parse(document),CustomElements.upgradeDocument(document);var a=window.Platform&&Platform.endOfMicrotask?Platform.endOfMicrotask:setTimeout;a(function(){CustomElements.ready=!0,CustomElements.readyTime=Date.now(),window.HTMLImports&&(CustomElements.elapsed=CustomElements.readyTime-HTMLImports.readyTime),document.body.dispatchEvent(new CustomEvent("WebComponentsReady",{bubbles:!0}))})}if("function"!=typeof window.CustomEvent&&(window.CustomEvent=function(a){var b=document.createEvent("HTMLEvents");return b.initEvent(a,!0,!0),b}),"complete"===document.readyState)a();else{var b=window.HTMLImports?"HTMLImportsLoaded":"DOMContentLoaded";window.addEventListener(b,a)}}(),function(){function a(a){var b=K.call(a);return J[b]||(J[b]=b.match(L)[1].toLowerCase())}function b(c,d){var e=b[d||a(c)];return e?e(c):c}function c(b){return-1==M.indexOf(a(b))?Array.prototype.slice.call(b,0):[b]}function d(a,b){return(b||N).length?c(a.querySelectorAll(b)):[]}function e(a,b){var c={added:[],removed:[]};b.forEach(function(b){b._mutation=!0;for(var d in c)for(var e=a._records["added"==d?"inserted":"removed"],f=b[d+"Nodes"],g=f.length,h=0;g>h&&-1==c[d].indexOf(f[h]);h++)c[d].push(f[h]),e.forEach(function(a){a(f[h],b)})})}function f(c,d,e){var f=a(e);return"object"==f&&"object"==a(c[d])?S.merge(c[d],e):c[d]=b(e,f),c}function g(a,b,c,d,e){e[b]="function"!=typeof e[b]?d:S.wrap(e[b],S.applyPseudos(c,d,a.pseudos))}function h(a,b,c,d){if(d){var e={};for(var f in c)e[f.split(":")[0]]=f;for(f in b)g(a,e[f.split(":")[0]]||f,f,b[f],c)}else for(var h in b)g(a,h+":__mixin__("+O++ +")",h,b[h],c)}function i(a){return a.mixins.forEach(function(b){var c=S.mixins[b];for(var d in c){var e=c[d],f=a[d];if(f)switch(d){case"accessors":case"prototype":for(var g in e)f[g]?h(a,e[g],f[g],!0):f[g]=e[g];break;default:h(a,e,f,"events"!=d)}else a[d]=e}}),a}function j(a,b){var c,d=b.target;if(S.matchSelector(d,a.value))c=d;else if(S.matchSelector(d,a.value+" *"))for(var e=d.parentNode;!c;)S.matchSelector(e,a.value)&&(c=e),e=e.parentNode;return c?a.listener=a.listener.bind(c):null}function k(a){if(a.type.match("touch"))a.target.__touched__=!0;else if(a.target.__touched__&&a.type.match("mouse"))return delete a.target.__touched__,void 0;return!0}function l(a){var b="over"==a;return{attach:"OverflowEvent"in y?"overflowchanged":[],condition:function(c){return c.flow=a,c.type==a+"flow"||0===c.orient&&c.horizontalOverflow==b||1==c.orient&&c.verticalOverflow==b||2==c.orient&&c.horizontalOverflow==b&&c.verticalOverflow==b}}}function m(a,b,c,d){d?b[a]=c[a]:Object.defineProperty(b,a,{writable:!0,enumerable:!0,value:c[a]})}function n(a,b){var c=Object.getOwnPropertyDescriptor(a,"target");for(var d in b)P[d]||m(d,a,b,c);a.baseEvent=b}function o(a,b){return{value:a.boolean?"":b,method:a.boolean&&!b?"removeAttribute":"setAttribute"}}function p(a,b,c,d){var e=o(b,d);a[e.method](c,e.value)}function q(a,b,c,d,e){for(var f=b.property?[a.xtag[b.property]]:b.selector?S.query(a,b.selector):[],g=f.length;g--;)f[g][e](c,d)}function r(a,b,c){a.__view__&&a.__view__.updateBindingValue(a,b,c)}function s(a,b,c,d,e,f){var g=c.split(":"),h=g[0];if("get"==h)g[0]=b,a.prototype[b].get=S.applyPseudos(g.join(":"),d[c],a.pseudos);else if("set"==h){g[0]=b;var i=a.prototype[b].set=S.applyPseudos(g.join(":"),e?function(a){this.xtag._skipSet=!0,this.xtag._skipAttr||p(this,e,f,a),this.xtag._skipAttr&&e.skip&&delete this.xtag._skipAttr,d[c].call(this,e.boolean?!!a:a),r(this,f,a),delete this.xtag._skipSet}:d[c]?function(a){d[c].call(this,a),r(this,f,a)}:null,a.pseudos);e&&(e.setter=i)}else a.prototype[b][c]=d[c]}function t(a,b){a.prototype[b]={};var c=a.accessors[b],d=c.attribute,e=d&&d.name?d.name.toLowerCase():b;d&&(d.key=b,a.attributes[e]=d);for(var f in c)s(a,b,f,c,d,e);if(d){if(!a.prototype[b].get){var g=(d.boolean?"has":"get")+"Attribute";a.prototype[b].get=function(){return this[g](e)}}a.prototype[b].set||(a.prototype[b].set=function(a){p(this,d,e,a),r(this,e,a)})}}function u(a){R[a]=(R[a]||[]).filter(function(b){return(b.tags=b.tags.filter(function(b){return b!=a&&!S.tags[b]})).length||b.fn()})}function v(a,b,c){a.__tap__||(a.__tap__={click:"mousedown"==c.type},a.__tap__.click?a.addEventListener("click",b.observer):(a.__tap__.scroll=b.observer.bind(a),window.addEventListener("scroll",a.__tap__.scroll,!0),a.addEventListener("touchmove",b.observer),a.addEventListener("touchcancel",b.observer),a.addEventListener("touchend",b.observer))),a.__tap__.click||(a.__tap__.x=c.touches[0].pageX,a.__tap__.y=c.touches[0].pageY)}function w(a,b){a.__tap__&&(a.__tap__.click?a.removeEventListener("click",b.observer):(window.removeEventListener("scroll",a.__tap__.scroll,!0),a.removeEventListener("touchmove",b.observer),a.removeEventListener("touchcancel",b.observer),a.removeEventListener("touchend",b.observer)),delete a.__tap__)}function x(a,b,c){var d=c.changedTouches[0],e=b.gesture.tolerance;return d.pageX<a.__tap__.x+e&&d.pageX>a.__tap__.x-e&&d.pageY<a.__tap__.y+e&&d.pageY>a.__tap__.y-e?!0:void 0}var y=window,z=document,A=function(){},B=function(){return!0},C=/([\w-]+(?:\([^\)]+\))?)/g,D=/(\w*)(?:\(([^\)]*)\))?/,E=/(\d+)/g,F={action:function(a,b){return a.value.match(E).indexOf(String(b.keyCode))>-1==("keypass"==a.name)||null}},G=function(){var a=y.getComputedStyle(z.documentElement,""),b=(Array.prototype.slice.call(a).join("").match(/-(moz|webkit|ms)-/)||""===a.OLink&&["","o"])[1];return{dom:"ms"==b?"MS":b,lowercase:b,css:"-"+b+"-",js:"ms"==b?b:b[0].toUpperCase()+b.substr(1)}}(),H=Element.prototype.matchesSelector||Element.prototype[G.lowercase+"MatchesSelector"],I=y.MutationObserver||y[G.js+"MutationObserver"],J={},K=J.toString,L=/\s([a-zA-Z]+)/;b.object=function(a){var c={};for(var d in a)c[d]=b(a[d]);return c},b.array=function(a){for(var c=a.length,d=new Array(c);c--;)d[c]=b(a[c]);return d};var M=["undefined","null","number","boolean","string","function"],N="",O=0,P={};for(var Q in document.createEvent("CustomEvent"))P[Q]=1;var R={},S={tags:{},defaultOptions:{pseudos:[],mixins:[],events:{},methods:{},accessors:{},lifecycle:{},attributes:{},prototype:{xtag:{get:function(){return this.__xtag__?this.__xtag__:this.__xtag__={data:{}}}}}},register:function(a,b){var d;if("string"==typeof a){d=a.toLowerCase();var e=b.prototype;delete b.prototype;var f=S.tags[d]=i(S.merge({},S.defaultOptions,b));for(var g in f.events)f.events[g]=S.parseEvent(g,f.events[g]);for(g in f.lifecycle)f.lifecycle[g.split(":")[0]]=S.applyPseudos(g,f.lifecycle[g],f.pseudos);for(g in f.methods)f.prototype[g.split(":")[0]]={value:S.applyPseudos(g,f.methods[g],f.pseudos),enumerable:!0};for(g in f.accessors)t(f,g);var h=f.lifecycle.created||f.lifecycle.ready;f.prototype.createdCallback={enumerable:!0,value:function(){var a=this;S.addEvents(this,f.events),f.mixins.forEach(function(b){S.mixins[b].events&&S.addEvents(a,S.mixins[b].events)});var b=h?h.apply(this,c(arguments)):null;for(var d in f.attributes){var e=f.attributes[d],g=this.hasAttribute(d);(g||e.boolean)&&(this[e.key]=e.boolean?g:this.getAttribute(d))}return f.pseudos.forEach(function(b){b.onAdd.call(a,b)}),b}},f.lifecycle.inserted&&(f.prototype.enteredViewCallback={value:f.lifecycle.inserted,enumerable:!0}),f.lifecycle.removed&&(f.prototype.leftDocumentCallback={value:f.lifecycle.removed,enumerable:!0}),f.lifecycle.attributeChanged&&(f.prototype.attributeChangedCallback={value:f.lifecycle.attributeChanged,enumerable:!0});var j=f.prototype.setAttribute||HTMLElement.prototype.setAttribute;f.prototype.setAttribute={writable:!0,enumberable:!0,value:function(a,b){var c=f.attributes[a.toLowerCase()];this.xtag._skipAttr||j.call(this,a,c&&c.boolean?"":b),c&&(c.setter&&!this.xtag._skipSet&&(this.xtag._skipAttr=!0,c.setter.call(this,c.boolean?!0:b)),b=c.skip?c.boolean?this.hasAttribute(a):this.getAttribute(a):b,q(this,c,a,c.boolean?"":b,"setAttribute")),delete this.xtag._skipAttr}};var k=f.prototype.removeAttribute||HTMLElement.prototype.removeAttribute;f.prototype.removeAttribute={writable:!0,enumberable:!0,value:function(a){var b=f.attributes[a.toLowerCase()];this.xtag._skipAttr||k.call(this,a),b&&(b.setter&&!this.xtag._skipSet&&(this.xtag._skipAttr=!0,b.setter.call(this,b.boolean?!1:void 0)),q(this,b,a,void 0,"removeAttribute")),delete this.xtag._skipAttr}};var l=e?e:b["extends"]?Object.create(z.createElement(b["extends"]).constructor).prototype:y.HTMLElement.prototype,m={prototype:Object.create(l,f.prototype)};b["extends"]&&(m["extends"]=b["extends"]);var n=z.register(d,m);return u(d),n}},ready:function(a,b){var d={tags:c(a),fn:b};d.tags.reduce(function(a,b){return S.tags[b]?a:((R[b]=R[b]||[]).push(d),void 0)},!0)&&b()},mixins:{},prefix:G,captureEvents:["focus","blur","scroll","underflow","overflow","overflowchanged","DOMMouseScroll"],customEvents:{overflow:l("over"),underflow:l("under"),animationstart:{attach:[G.dom+"AnimationStart"]},animationend:{attach:[G.dom+"AnimationEnd"]},transitionend:{attach:[G.dom+"TransitionEnd"]},move:{attach:["mousemove","touchmove"],condition:k},enter:{attach:["mouseover","touchenter"],condition:k},leave:{attach:["mouseout","touchleave"],condition:k},scrollwheel:{attach:["DOMMouseScroll","mousewheel"],condition:function(a){return a.delta=a.wheelDelta?a.wheelDelta/40:Math.round(-1*(a.detail/3.5)),!0}},tapstart:{observe:{mousedown:z,touchstart:z},condition:k},tapend:{observe:{mouseup:z,touchend:z},condition:k},tapmove:{attach:["tapstart","dragend","touchcancel"],condition:function(a,b){switch(a.type){case"move":return!0;case"dragover":var c=b.lastDrag||{};return b.lastDrag=a,c.pageX!=a.pageX&&c.pageY!=a.pageY||null;case"tapstart":b.move||(b.current=this,b.move=S.addEvents(this,{move:b.listener,dragover:b.listener}),b.tapend=S.addEvent(z,"tapend",b.listener));break;case"tapend":case"dragend":case"touchcancel":a.touches.length||(b.move&&S.removeEvents(b.current,b.move||{}),b.tapend&&S.removeEvent(z,b.tapend||{}),delete b.lastDrag,delete b.current,delete b.tapend,delete b.move)}}}},pseudos:{__mixin__:{},keypass:F,keyfail:F,delegate:{action:j},within:{action:j,onAdd:function(a){var b=a.source.condition;b&&(a.source.condition=function(c,d){return S.query(this,a.value).filter(function(a){return a==c.target||a.contains?a.contains(c.target):null})[0]?b.call(this,c,d):null})}},preventable:{action:function(a,b){return!b.defaultPrevented}}},clone:b,typeOf:a,toArray:c,wrap:function(a,b){return function(){var d=c(arguments),e=a.apply(this,d);return b.apply(this,d),e}},merge:function(b,c,d){if("string"==a(c))return f(b,c,d);for(var e=1,g=arguments.length;g>e;e++){var h=arguments[e];for(var i in h)f(b,i,h[i])}return b},uid:function(){return Math.random().toString(36).substr(2,10)},query:d,skipTransition:function(a,b){var c=G.js+"TransitionProperty";a.style[c]=a.style.transitionProperty="none";var d=b();return S.requestFrame(function(){S.requestFrame(function(){a.style[c]=a.style.transitionProperty="",d&&S.requestFrame(d)})})},requestFrame:function(){var a=y.requestAnimationFrame||y[G.lowercase+"RequestAnimationFrame"]||function(a){return y.setTimeout(a,20)};return function(b){return a(b)}}(),cancelFrame:function(){var a=y.cancelAnimationFrame||y[G.lowercase+"CancelAnimationFrame"]||y.clearTimeout;return function(b){return a(b)}}(),matchSelector:function(a,b){return H.call(a,b)},set:function(a,b,c){a[b]=c,window.CustomElements&&CustomElements.upgradeAll(a)},innerHTML:function(a,b){S.set(a,"innerHTML",b)},hasClass:function(a,b){return a.className.split(" ").indexOf(b.trim())>-1},addClass:function(a,b){var c=a.className.trim().split(" ");return b.trim().split(" ").forEach(function(a){~c.indexOf(a)||c.push(a)}),a.className=c.join(" ").trim(),a},removeClass:function(a,b){var c=b.trim().split(" ");return a.className=a.className.trim().split(" ").filter(function(a){return a&&!~c.indexOf(a)}).join(" "),a},toggleClass:function(a,b){return S[S.hasClass(a,b)?"removeClass":"addClass"].call(null,a,b)},queryChildren:function(a,b){var d=a.id,e=a.id=d||"x_"+S.uid(),f="#"+e+" > ";b=f+(b+"").replace(",",","+f,"g");var g=a.parentNode.querySelectorAll(b);return d||a.removeAttribute("id"),c(g)},createFragment:function(a){var b=z.createDocumentFragment();if(a){for(var d=b.appendChild(z.createElement("div")),e=c(a.nodeName?arguments:!(d.innerHTML=a)||d.children),f=e.length,g=0;f>g;)b.insertBefore(e[g++],d);b.removeChild(d)}return b},manipulate:function(a,b){var c=a.nextSibling,d=a.parentNode,e=z.createDocumentFragment(),f=b.call(e.appendChild(a),e)||a;c?d.insertBefore(f,c):d.appendChild(f)},applyPseudos:function(a,b,d,e){var f=b,g={};if(a.match(":"))for(var h=a.match(C),i=h.length;--i;)h[i].replace(D,function(b,j,k){if(!S.pseudos[j])throw"pseudo not found: "+j+" "+h;var l=g[i]=Object.create(S.pseudos[j]);l.key=a,l.name=j,l.value=k,l.arguments=(k||"").split(","),l.action=l.action||B,l.source=e;var m=f;f=function(){var b=c(arguments),d={key:a,name:j,value:k,source:e,arguments:l.arguments,listener:m},f=l.action.apply(this,[d].concat(b));return null===f||f===!1?f:d.listener.apply(this,b)},d&&l.onAdd&&(d.nodeName?l.onAdd.call(d,l):d.push(l))});for(var j in g)g[j].onCompiled&&(f=g[j].onCompiled(f,g[j])||f);return f},removePseudos:function(a,b){b.forEach(function(b){b.onRemove&&b.onRemove.call(a,b)})},parseEvent:function(a,b){var d=a.split(":"),e=d.shift(),f=S.customEvents[e],g=S.merge({type:e,stack:A,condition:B,attach:[],_attach:[],pseudos:"",_pseudos:[],onAdd:A,onRemove:A},f||{});g.attach=c(g.base||g.attach),g.chain=e+(g.pseudos.length?":"+g.pseudos:"")+(d.length?":"+d.join(":"):"");var h=g.condition;g.condition=function(a){return a.touches,a.targetTouches,h.apply(this,c(arguments))};var i=S.applyPseudos(g.chain,b,g._pseudos,g);if(g.stack=function(a){a.touches,a.targetTouches;var b=a.detail||{};return b.__stack__?b.__stack__==i?(a.stopPropagation(),a.cancelBubble=!0,i.apply(this,c(arguments))):void 0:i.apply(this,c(arguments))},g.listener=function(a){var b=c(arguments),d=g.condition.apply(this,b.concat([g]));return d?a.type==e?g.stack.apply(this,b):(S.fireEvent(a.target,e,{baseEvent:a,detail:d!==!0&&(d.__stack__=i)?d:{__stack__:i}}),void 0):d},g.attach.forEach(function(a){g._attach.push(S.parseEvent(a,g.listener))}),f&&f.observe&&!f.__observing__){f.observer=function(a){var b=g.condition.apply(this,c(arguments).concat([f]));return b?(S.fireEvent(a.target,e,{baseEvent:a,detail:b!==!0?b:{}}),void 0):b};for(var j in f.observe)S.addEvent(f.observe[j]||document,j,f.observer,!0);f.__observing__=!0}return g},addEvent:function(a,b,c,d){var e="function"==typeof c?S.parseEvent(b,c):c;return e._pseudos.forEach(function(b){b.onAdd.call(a,b)}),e._attach.forEach(function(b){S.addEvent(a,b.type,b)}),e.onAdd.call(a,e,e.listener),a.addEventListener(e.type,e.stack,d||S.captureEvents.indexOf(e.type)>-1),e},addEvents:function(a,b){var c={};for(var d in b)c[d]=S.addEvent(a,d,b[d]);return c},removeEvent:function(a,b,c){c=c||b,c.onRemove.call(a,c,c.listener),S.removePseudos(a,c._pseudos),c._attach.forEach(function(b){S.removeEvent(a,b)}),a.removeEventListener(c.type,c.stack)},removeEvents:function(a,b){for(var c in b)S.removeEvent(a,b[c])},fireEvent:function(a,b,c,d){var e=z.createEvent("CustomEvent");c=c||{},d&&console.warn("fireEvent has been modified"),e.initCustomEvent(b,c.bubbles!==!1,c.cancelable!==!1,c.detail),c.baseEvent&&n(e,c.baseEvent);try{a.dispatchEvent(e)}catch(f){console.warn("This error may have been caused by a change in the fireEvent method",f)}},addObserver:function(a,b,c){a._records||(a._records={inserted:[],removed:[]},I?(a._observer=new I(function(b){e(a,b)}),a._observer.observe(a,{subtree:!0,childList:!0,attributes:!1,characterData:!1})):["Inserted","Removed"].forEach(function(b){a.addEventListener("DOMNode"+b,function(c){c._mutation=!0,a._records[b.toLowerCase()].forEach(function(a){a(c.target,c)})},!1)})),-1==a._records[b].indexOf(c)&&a._records[b].push(c)},removeObserver:function(a,b,c){var d=a._records;d&&c?d[b].splice(d[b].indexOf(c),1):d[b]=[]}},T=!1,U=null;z.addEventListener("mousedown",function(a){T=!0,U=a.target},!0),z.addEventListener("mouseup",function(){T=!1,U=null},!0),z.addEventListener("dragend",function(){T=!1,U=null},!0);var V={touches:{configurable:!0,get:function(){return this.__touches__||(this.identifier=0)||(this.__touches__=T?[this]:[])}},targetTouches:{configurable:!0,get:function(){return this.__targetTouches__||(this.__targetTouches__=T&&this.currentTarget&&(this.currentTarget==U||this.currentTarget.contains&&this.currentTarget.contains(U))?(this.identifier=0)||[this]:[])}},changedTouches:{configurable:!0,get:function(){return this.__changedTouches__||(this.identifier=0)||(this.__changedTouches__=[this])}}};for(Q in V)UIEvent.prototype[Q]=V[Q],Object.defineProperty(UIEvent.prototype,Q,V[Q]);var W={value:null,writable:!0,configurable:!0},X={touches:W,targetTouches:W,changedTouches:W};if(y.TouchEvent)for(Q in X){var Y=Object.getOwnPropertyDescriptor(y.TouchEvent.prototype,Q);Y?y.TouchEvent.prototype[Q]=X[Q]:Object.defineProperty(y.TouchEvent.prototype,Q,X[Q])}S.customEvents.tap={observe:{mousedown:document,touchstart:document},gesture:{tolerance:8},condition:function(a,b){var c=a.target;switch(a.type){case"touchstart":return c.__tap__&&c.__tap__.click&&w(c,b),v(c,b,a),void 0;case"mousedown":return c.__tap__||v(c,b,a),void 0;case"scroll":case"touchcancel":return w(this,b),void 0;case"touchmove":case"touchend":return this.__tap__&&!x(this,b,a)?(w(this,b),void 0):"touchend"==a.type||null;case"click":return w(this,b),!0}}},y.xtag=S,"function"==typeof define&&define.amd&&define(S),z.addEventListener("WebComponentsReady",function(){S.fireEvent(z.body,"DOMComponentsLoaded")})}(),function(){xtag.register("x-appbar",{lifecycle:{created:function(){var a=xtag.queryChildren(this,"header")[0];a||(a=document.createElement("header"),this.appendChild(a)),this.xtag.data.header=a,this.subheading=this.subheading}},accessors:{heading:{attribute:{},get:function(){return this.xtag.data.header.innerHTML},set:function(a){this.xtag.data.header.innerHTML=a}},subheading:{attribute:{},get:function(){return this.getAttribute("subheading")||""},set:function(a){this.xtag.data.header.setAttribute("subheading",a)}}}})}(),function(){function a(a){var b=new Date(a.valueOf());return b.setHours(0),b.setMinutes(0),b.setSeconds(0),b.setMilliseconds(0),b}function b(a,b){a.appendChild(b)}function c(a){return parseInt(a,10)}function d(a){var b=c(a);return b===a&&!isNaN(b)&&b>=0&&6>=b}function e(a){return a instanceof Date&&!!a.getTime&&!isNaN(a.getTime())}function f(a){return a&&a.isArray?a.isArray():"[object Array]"===Object.prototype.toString.call(a)}function g(a){var b=a.split("."),c=b.shift(),d=document.createElement(c);
return d[W]=b.join(" "),d}function h(){var a=document.documentElement,b={left:a.scrollLeft||document.body.scrollLeft||0,top:a.scrollTop||document.body.scrollTop||0,width:a.clientWidth,height:a.clientHeight};return b.right=b.left+b.width,b.bottom=b.top+b.height,b}function i(a){var b=a.getBoundingClientRect(),c=h(),d=c.left,e=c.top;return{left:b.left+d,right:b.right+d,top:b.top+e,bottom:b.bottom+e,width:b.width,height:b.height}}function j(a,b){xtag.addClass(a,b)}function k(a,b){xtag.removeClass(a,b)}function l(a,b){return xtag.hasClass(a,b)}function m(a){return a.getFullYear()}function n(a){return a.getMonth()}function o(a){return a.getDate()}function p(a){return a.getDay()}function q(a,b){var c=a.toString(),d=new Array(b).join("0");return(d+c).substr(-b)}function r(a){return[q(m(a),4),q(n(a)+1,2),q(o(a),2)].join("-")}function s(b){if(e(b))return b;var c=X.exec(b);return c?a(new Date(c[1],c[2]-1,c[3])):null}function t(b){if(e(b))return b;var c=s(b);if(c)return c;var d=Date.parse(b);return isNaN(d)?null:a(new Date(d))}function u(a){var b;if(f(a))b=a.slice(0);else{if(e(a))return[a];if(!("string"==typeof a&&a.length>0))return null;try{if(b=JSON.parse(a),!f(b))return console.warn("invalid list of ranges",a),null}catch(c){var d=t(a);return d?[d]:(console.warn("unable to parse",a,"as JSON or single date"),null)}}for(var g=0;g<b.length;g++){var h=b[g];if(!e(h))if("string"==typeof h){var i=t(h);if(!i)return console.warn("unable to parse date",h),null;b[g]=i}else{if(!f(h)||2!==h.length)return console.warn("invalid range value: ",h),null;var j=t(h[0]);if(!j)return console.warn("unable to parse start date",h[0],"from range",h),null;var k=t(h[1]);if(!k)return console.warn("unable to parse end date",h[1],"from range",h),null;if(j.valueOf()>k.valueOf())return console.warn("invalid range",h,": start date is after end date"),null;b[g]=[j,k]}}return b}function v(b,c,d,e){return void 0===c&&(c=m(b)),void 0===d&&(d=n(b)),void 0===e&&(e=o(b)),a(new Date(c,d,e))}function w(a,b){return b||(b=(new Date).getFullYear()),new Date(b,a+1,0).getDate()}function x(a,b,c,d){return v(a,m(a)+b,n(a)+c,o(a)+d)}function y(a){var b=a.getDate(),c=w(a.getMonth()+1,a.getFullYear());return b>c&&(b=c),console.log(new Date(a.getFullYear(),a.getMonth()+1,b).toString()),new Date(a.getFullYear(),a.getMonth()+1,b)}function z(a){var b=a.getDate(),c=w(a.getMonth()-1,a.getFullYear());return b>c&&(b=c),new Date(a.getFullYear(),a.getMonth()-1,b)}function A(a,b){b=c(b),d(b)||(b=0);for(var e=0;7>e;e++){if(p(a)===b)return a;a=F(a)}throw"unable to find week start"}function B(a,b){b=c(b),d(b)||(b=6);for(var e=0;7>e;e++){if(p(a)===b)return a;a=E(a)}throw"unable to find week end"}function C(b){return b=new Date(b.valueOf()),b.setDate(1),a(b)}function D(a){return F(x(a,0,1,0))}function E(a){return x(a,0,0,1)}function F(a){return x(a,0,0,-1)}function G(a,b){if(b){b=void 0===b.length?[b]:b;var c=!1;return b.forEach(function(b){2===b.length?H(b[0],b[1],a)&&(c=!0):r(b)===r(a)&&(c=!0)}),c}}function H(a,b,c){return r(a)<=r(c)&&r(c)<=r(b)}function I(a){a.sort(function(a,b){var c=e(a)?a:a[0],d=e(b)?b:b[0];return c.valueOf()-d.valueOf()})}function J(a){var c=g("div.controls"),d=g("span.prev"),e=g("span.next");return d.innerHTML=a.prev,e.innerHTML=a.next,b(c,d),b(c,e),c}function K(a){var b=this;a=a||{},b._span=a.span||1,b._multiple=a.multiple||!1,b._viewDate=b._sanitizeViewDate(a.view,a.chosen),b._chosenRanges=b._sanitizeChosenRanges(a.chosen,a.view),b._firstWeekdayNum=a.firstWeekdayNum||0,b._el=g("div.calendar"),b._labels=R(),b._customRenderFn=null,b._renderRecursionFlag=!1,b.render(!0)}function L(a){a=a.slice(0),I(a);for(var b=[],c=0;c<a.length;c++){var d,f,g,h,i=a[c],j=b.length>0?b[b.length-1]:null;if(e(i)?d=f=i:(d=i[0],f=i[1]),i=G(d,f)?d:[d,f],e(j))g=h=j;else{if(!j){b.push(i);continue}g=j[0],h=j[1]}if(G(d,[j])||G(F(d),[j])){var k=g.valueOf()<d.valueOf()?g:d,l=h.valueOf()>f.valueOf()?h:f,m=G(k,l)?k:[k,l];b[b.length-1]=m}else b.push(i)}return b}function M(a,b){var c,d=b.getAttribute("data-date"),e=t(d);l(b,V)?(a.xtag.dragType=U,c="datetoggleoff"):(a.xtag.dragType=T,c="datetoggleon"),a.xtag.dragStartEl=b,a.xtag.dragAllowTap=!0,a.noToggle||xtag.fireEvent(a,c,{detail:{date:e,iso:d}}),a.setAttribute("active",!0),b.setAttribute("active",!0)}function N(a,b){var c=b.getAttribute("data-date"),d=t(c);b!==a.xtag.dragStartEl&&(a.xtag.dragAllowTap=!1),a.noToggle||(a.xtag.dragType!==T||l(b,V)?a.xtag.dragType===U&&l(b,V)&&xtag.fireEvent(a,"datetoggleoff",{detail:{date:d,iso:c}}):xtag.fireEvent(a,"datetoggleon",{detail:{date:d,iso:c}})),a.xtag.dragType&&b.setAttribute("active",!0)}function O(){for(var a=xtag.query(document,"x-calendar"),b=0;b<a.length;b++){var c=a[b];c.xtag.dragType=null,c.xtag.dragStartEl=null,c.xtag.dragAllowTap=!1,c.removeAttribute("active")}for(var d=xtag.query(document,"x-calendar .day[active]"),e=0;e<d.length;e++)d[e].removeAttribute("active")}function P(a,b,c){return c.left<=a&&a<=c.right&&c.top<=b&&b<=c.bottom}var Q=0,R=function(){return{prev:"←",next:"→",months:["January","February","March","April","May","June","July","August","September","October","November","December"],weekdays:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]}},S=a(new Date),T="add",U="remove",V="chosen",W="className",X=/(\d{4})[^\d]?(\d{2})[^\d]?(\d{2})/,Y=K.prototype;Y.makeMonth=function(a){if(!e(a))throw"Invalid view date!";var c=this.firstWeekdayNum,d=this.chosen,f=this.labels,h=n(a),i=A(C(a),c),k=g("div.month"),l=g("div.month-label");l.textContent=f.months[h]+" "+m(a),b(k,l);for(var p=g("div.weekday-labels"),q=0;7>q;q++){var s=(c+q)%7,t=g("span.weekday-label");t.textContent=f.weekdays[s],b(p,t)}b(k,p);var u=g("div.week"),v=i,w=42;for(q=0;w>q;q++){var x=g("span.day");if(x.setAttribute("data-date",r(v)),x.textContent=o(v),n(v)!==h&&j(x,"badmonth"),G(v,d)&&j(x,V),G(v,S)&&j(x,"today"),b(u,x),v=E(v),0===(q+1)%7){b(k,u),u=g("div.week");var y=n(v)>h||n(v)<h&&m(v)>m(i);if(y)break}}return k},Y._sanitizeViewDate=function(a,b){b=void 0===b?this.chosen:b;var c;if(e(a))c=a;else if(e(b))c=b;else if(f(b)&&b.length>0){var d=b[0];c=e(d)?d:d[0]}else c=S;return c},Y._sanitizeChosenRanges=function(a,b){b=void 0===b?this.view:b;var c;c=e(a)?[a]:f(a)?a:null!==a&&void 0!==a&&b?[b]:[];var d=L(c);if(!this.multiple&&d.length>0){var g=d[0];return e(g)?[g]:[g[0]]}return d},Y.addDate=function(a,b){e(a)&&(b?(this.chosen.push(a),this.chosen=this.chosen):this.chosen=[a])},Y.removeDate=function(a){if(e(a))for(var b=this.chosen.slice(0),c=0;c<b.length;c++){var d=b[c];if(G(a,[d])){if(b.splice(c,1),f(d)){var g=d[0],h=d[1],i=F(a),j=E(a);G(i,[d])&&b.push([g,i]),G(j,[d])&&b.push([j,h])}this.chosen=L(b);break}}},Y.hasChosenDate=function(a){return G(a,this._chosenRanges)},Y.hasVisibleDate=function(a,b){var c=b?this.firstVisibleMonth:this.firstVisibleDate,d=b?D(this.lastVisibleMonth):this.lastVisibleDate;return G(a,[[c,d]])},Y.render=function(a){var c,d=this._span;if(a){var e,f=xtag.query(this.el,".day");for(c=0;c<f.length;c++)if(e=f[c],e.hasAttribute("data-date")){var g=e.getAttribute("data-date"),h=s(g);h&&(G(h,this._chosenRanges)?j(e,V):k(e,V),G(h,[S])?j(e,"today"):k(e,"today"))}}else{this.el.innerHTML="";var i=this.firstVisibleMonth;for(c=0;d>c;c++)b(this.el,this.makeMonth(i)),i=x(i,0,1,0)}this._callCustomRenderer()},Y._callCustomRenderer=function(){if(this._customRenderFn){if(this._renderRecursionFlag)throw"Error: customRenderFn causes recursive loop of rendering calendar; make sure your custom rendering function doesn't modify attributes of the x-calendar that would require a re-render!";for(var a=xtag.query(this.el,".day"),b=0;b<a.length;b++){var c=a[b],d=c.getAttribute("data-date"),e=s(d);this._renderRecursionFlag=!0,this._customRenderFn(c,e?e:null,d),this._renderRecursionFlag=!1}}},Object.defineProperties(Y,{el:{get:function(){return this._el}},multiple:{get:function(){return this._multiple},set:function(a){this._multiple=a,this.chosen=this._sanitizeChosenRanges(this.chosen),this.render(!0)}},span:{get:function(){return this._span},set:function(a){var b=c(a);this._span=!isNaN(b)&&b>=0?b:0,this.render(!1)}},view:{attribute:{},get:function(){return this._viewDate},set:function(a){var b=this._sanitizeViewDate(a),c=this._viewDate;this._viewDate=b,this.render(n(c)===n(b)&&m(c)===m(b))}},chosen:{get:function(){return this._chosenRanges},set:function(a){this._chosenRanges=this._sanitizeChosenRanges(a),this.render(!0)}},firstWeekdayNum:{get:function(){return this._firstWeekdayNum},set:function(a){a=c(a),d(a)||(a=0),this._firstWeekdayNum=a,this.render(!1)}},lastWeekdayNum:{get:function(){return(this._firstWeekdayNum+6)%7}},customRenderFn:{get:function(){return this._customRenderFn},set:function(a){this._customRenderFn=a,this.render(!0)}},chosenString:{get:function(){if(this.multiple){for(var a=this.chosen.slice(0),b=0;b<a.length;b++){var c=a[b];a[b]=e(c)?r(c):[r(c[0]),r(c[1])]}return JSON.stringify(a)}return this.chosen.length>0?r(this.chosen[0]):""}},firstVisibleMonth:{get:function(){return C(this.view)}},lastVisibleMonth:{get:function(){return x(this.firstVisibleMonth,0,Math.max(0,this.span-1),0)}},firstVisibleDate:{get:function(){return A(this.firstVisibleMonth,this.firstWeekdayNum)}},lastVisibleDate:{get:function(){return B(D(this.lastVisibleMonth),this.lastWeekdayNum)}},labels:{get:function(){return this._labels},set:function(a){var b=this.labels;for(var c in b)if(c in a){var d=this._labels[c],e=a[c];if(f(d)){if(!f(e)||d.length!==e.length)throw"invalid label given for '"+c+"': expected array of "+d.length+" labels, got "+JSON.stringify(e);e=e.slice(0);for(var g=0;g<e.length;g++)e[g]=e[g].toString?e[g].toString():String(e[g])}else e=String(e);b[c]=e}this.render(!1)}}});var Z=null,$=null;xtag.register("x-calendar",{lifecycle:{created:function(){this.innerHTML="";var a=this.getAttribute("chosen");this.xtag.calObj=new K({span:this.getAttribute("span"),view:t(this.getAttribute("view")),chosen:u(a),multiple:this.hasAttribute("multiple"),firstWeekdayNum:this.getAttribute("first-weekday-num")}),b(this,this.xtag.calObj.el),this.xtag.calControls=null,this.xtag.dragType=null,this.xtag.dragStartEl=null,this.xtag.dragAllowTap=!1},inserted:function(){Z||(Z=xtag.addEvent(document,"mouseup",O)),$||($=xtag.addEvent(document,"touchend",O)),this.render(!1)},removed:function(){0===xtag.query(document,"x-calendar").length&&(Z&&(xtag.removeEvent(document,"mouseup",Z),Z=null),$&&(xtag.removeEvent(document,"touchend",$),$=null))}},events:{"tap:delegate(.next)":function(a){var b=a.currentTarget;b.nextMonth(),xtag.fireEvent(b,"nextmonth")},"tap:delegate(.prev)":function(a){var b=a.currentTarget;b.prevMonth(),xtag.fireEvent(b,"prevmonth")},"tapstart:delegate(.day)":function(a){(a.touches||!a.button||a.button===Q)&&(a.preventDefault(),a.baseEvent&&a.baseEvent.preventDefault(),M(a.currentTarget,this))},touchmove:function(a){if(a.touches&&a.touches.length>0){var b=a.currentTarget;if(b.xtag.dragType)for(var c=a.touches[0],d=xtag.query(b,".day"),e=0;e<d.length;e++){var f=d[e];P(c.pageX,c.pageY,i(f))?N(b,f):f.removeAttribute("active")}}},"mouseover:delegate(.day)":function(a){var b=a.currentTarget,c=this;N(b,c)},"mouseout:delegate(.day)":function(){var a=this;a.removeAttribute("active")},"tapend:delegate(.day)":function(a){var b=a.currentTarget;if(b.xtag.dragAllowTap){var c=this,d=c.getAttribute("data-date"),e=t(d);xtag.fireEvent(b,"datetap",{detail:{date:e,iso:d}})}},datetoggleon:function(a){var b=this;b.toggleDateOn(a.detail.date,b.multiple)},datetoggleoff:function(a){var b=this;b.toggleDateOff(a.detail.date)}},accessors:{controls:{attribute:{"boolean":!0},set:function(a){a&&!this.xtag.calControls&&(this.xtag.calControls=J(this.xtag.calObj.labels),b(this,this.xtag.calControls))}},multiple:{attribute:{"boolean":!0},get:function(){return this.xtag.calObj.multiple},set:function(a){this.xtag.calObj.multiple=a,this.chosen=this.chosen}},span:{attribute:{},get:function(){return this.xtag.calObj.span},set:function(a){this.xtag.calObj.span=a}},view:{attribute:{},get:function(){return this.xtag.calObj.view},set:function(a){var b=t(a);b&&(this.xtag.calObj.view=b)}},chosen:{attribute:{skip:!0},get:function(){var a=this.xtag.calObj.chosen;if(this.multiple)return this.xtag.calObj.chosen;if(a.length>0){var b=a[0];return e(b)?b:b[0]}return null},set:function(a){var b=this.multiple?u(a):t(a);this.xtag.calObj.chosen=b?b:null,this.xtag.calObj.chosenString?this.setAttribute("chosen",this.xtag.calObj.chosenString):this.removeAttribute("chosen")}},firstWeekdayNum:{attribute:{name:"first-weekday-num"},set:function(a){this.xtag.calObj.firstWeekdayNum=a}},noToggle:{attribute:{"boolean":!0,name:"notoggle"},set:function(a){a&&(this.chosen=null)}},firstVisibleMonth:{get:function(){return this.xtag.calObj.firstVisibleMonth}},lastVisibleMonth:{get:function(){return this.xtag.calObj.lastVisibleMonth}},firstVisibleDate:{get:function(){return this.xtag.calObj.firstVisibleDate}},lastVisibleDate:{get:function(){return this.xtag.calObj.lastVisibleDate}},customRenderFn:{get:function(){return this.xtag.calObj.customRenderFn},set:function(a){this.xtag.calObj.customRenderFn=a}},labels:{get:function(){return JSON.parse(JSON.stringify(this.xtag.calObj.labels))},set:function(a){this.xtag.calObj.labels=a;var b=this.xtag.calObj.labels,c=this.querySelector(".controls > .prev");c&&(c.textContent=b.prev);var d=this.querySelector(".controls > .next");d&&(d.textContent=b.next)}}},methods:{render:function(a){this.xtag.calObj.render(a)},prevMonth:function(){var a=this.xtag.calObj;a.view=z(a.view)},nextMonth:function(){var a=this.xtag.calObj;a.view=y(a.view)},toggleDateOn:function(a,b){this.xtag.calObj.addDate(a,b),this.chosen=this.chosen},toggleDateOff:function(a){this.xtag.calObj.removeDate(a),this.chosen=this.chosen},toggleDate:function(a,b){this.xtag.calObj.hasChosenDate(a)?this.toggleDateOff(a):this.toggleDateOn(a,b)},hasVisibleDate:function(a,b){return this.xtag.calObj.hasVisibleDate(a,b)}}})}(),function(){function a(a){return JSON.parse(JSON.stringify(a))}function b(a){var b;return 0===a.getUTCHours()?b=new Date(a.valueOf()):(b=new Date,b.setUTCHours(0),b.setUTCFullYear(a.getFullYear()),b.setUTCMonth(a.getMonth()),b.setUTCDate(a.getDate())),b.setUTCMinutes(0),b.setUTCSeconds(0),b.setUTCMilliseconds(0),b}function c(a){return a instanceof Date&&!!a.getTime&&!isNaN(a.getTime())}function d(a){return a.getUTCFullYear()}function e(a){return a.getUTCMonth()}function f(a){return a.getUTCDate()}function g(a,b){var c=a.toString(),d=new Array(b).join("0");return(d+c).substr(-b)}function h(a){return[g(d(a),4),g(e(a)+1,2),g(f(a),2)].join("-")}function i(a){if(c(a))return a;var d=q.exec(a);return d?b(new Date(d[1],d[2]-1,d[3])):null}function j(a){if(c(a))return a;var d=i(a);if(d)return d;var e=Date.parse(a);return isNaN(e)?null:b(new Date(e))}function k(a){var b=a.polyfill?a.xtag.polyfillInput:a.xtag.dateInput,c=j(b.value);return c?a.removeAttribute("invalid"):a.setAttribute("invalid",!0),!!c}function l(a,b){var c=a.polyfill?a.xtag.polyfillInput:a.xtag.dateInput,d=c.value,e=j(d);a.value=b&&e?e:d}function m(a,b,c){var d=a.submitValue,e=a.value;b();var f=a.submitValue,g=a.value;(d!==f||c&&e!==g)&&xtag.fireEvent(a,"change")}function n(a){var b=a.xtag._labels;return new Array(5).join(b.yearAbbr)+"-"+new Array(3).join(b.monthAbbr)+"-"+new Array(3).join(b.dayAbbr)}var o=13,p=document.createElement("x-calendar").labels,q=/(\d{4})[^\d]?(\d{2})[^\d]?(\d{2})/;xtag.register("x-datepicker",{lifecycle:{created:function(){this.innerHTML="";var b=document.createElement("input");b.setAttribute("type","date"),xtag.addClass(b,"x-datepicker-input"),this.appendChild(b),this.xtag.dateInput=b,this.xtag._labels={yearAbbr:"Y",monthAbbr:"M",dayAbbr:"D"},this.xtag._polyfillCalLabels=a(p),this.xtag.polyfillInput=null,this.xtag.polyfillUI=null,this.polyfill=this.hasAttribute("polyfill")||"date"!==b.type.toLowerCase()}},events:{"datetoggleon:delegate(x-calendar)":function(a){var b=a.currentTarget;if(a.detail&&a.detail.date){var c=j(a.detail.date);m(b,function(){b.value=c?h(c):"",xtag.fireEvent(b,"input")})}},"datetoggleoff:delegate(x-calendar)":function(a){a.currentTarget.value=null},focus:function(a){a.currentTarget.setAttribute("focused",!0)},"blur:delegate(.x-datepicker-input)":function(a){a.currentTarget.removeAttribute("focused")},"blur:delegate(.x-datepicker-polyfill-input)":function(a){var b=a.currentTarget;b.removeAttribute("focused"),m(b,function(){l(b,!0)},!0)},"touchstart:delegate(.x-datepicker-polyfill-input)":function(){this.setAttribute("readonly",!0)},"tapstart:delegate(x-calendar)":function(a){a.preventDefault(),a.baseEvent&&a.baseEvent.preventDefault()},"keypress:delegate(.x-datepicker-polyfill-input)":function(a){var b=a.keyCode,c=a.currentTarget;b===o&&m(c,function(){l(c,!0)},!0)},"input:delegate(.x-datepicker-input)":function(a){var b=a.currentTarget;m(b,function(){l(b,!0),a.stopPropagation(),xtag.fireEvent(b,"input")})},"input:delegate(.x-datepicker-polyfill-input)":function(a){var b=a.currentTarget;m(b,function(){l(b,!1),a.stopPropagation(),xtag.fireEvent(b,"input")})},"change:delegate(.x-datepicker-input)":function(a){a.stopPropagation(),xtag.fireEvent(a.currentTarget,"change")},"change:delegate(.x-datepicker-polyfill-input)":function(a){a.stopPropagation();var b=a.currentTarget;m(b,function(){l(b,!1)})}},accessors:{name:{attribute:{selector:".x-datepicker-input"},set:function(a){var b=this.xtag.dateInput;null===a||void 0===a?b.removeAttribute("name"):b.setAttribute("name",a)}},submitValue:{get:function(){return this.xtag.dateInput.value}},value:{attribute:{skip:!0},get:function(){return this.polyfill?this.xtag.polyfillInput.value:this.xtag.dateInput.value},set:function(a){var b=j(a),c=b?h(b):null,d=this.xtag.dateInput,e=this.xtag.polyfillInput,f=this.xtag.polyfillUI;if(null===a||void 0===a)this.removeAttribute("value"),d.value="",e&&(e.value=""),f&&(f.chosen=null);else{var g,i=c?c:a;e?a!==e.value?(e.value=i,g=i):g=a:g=i,this.setAttribute("value",g),c?(d.value=c,f&&(f.chosen=b,f.view=b)):(d.value="",f&&(f.chosen=null))}k(this)}},polyfill:{attribute:{"boolean":!0},set:function(a){var b=this.xtag.dateInput;if(a){if(b.setAttribute("type","hidden"),b.setAttribute("readonly",!0),!this.xtag.polyfillInput){var c=document.createElement("input");xtag.addClass(c,"x-datepicker-polyfill-input"),c.setAttribute("type","text"),c.setAttribute("placeholder",n(this)),c.value=this.xtag.dateInput.value,this.xtag.polyfillInput=c,this.appendChild(c)}if(this.xtag.polyfillInput.removeAttribute("disabled"),!this.xtag.polyfillUI){var d=document.createElement("x-calendar");xtag.addClass(d,"x-datepicker-polyfill-ui"),d.chosen=this.value,d.view=this.xtag.dateInput.value,d.controls=!0,d.labels=this.xtag._polyfillCalLabels,this.xtag.polyfillUI=d,this.appendChild(d)}}else{"date"!==b.getAttribute("type")&&b.setAttribute("type","date"),b.removeAttribute("readonly");var e=this.xtag.polyfillInput;e&&e.setAttribute("disabled",!0)}}},labels:{get:function(){var b={},c=this.xtag._labels,d=this.xtag._polyfillCalLabels;for(var e in c)b[e]=c[e];for(e in d)b[e]=d[e];return a(b)},set:function(a){var b=this.xtag.polyfillUI,c=this.xtag.polyfillInput,d=null;if(b)b.labels=a,this.xtag._polyfillCalLabels=b.labels;else{var e=this.xtag._polyfillCalLabels;for(d in e)d in a&&(e[d]=a[d])}var f=this.xtag._labels;for(d in f)d in a&&(f[d]=a[d]);c&&c.setAttribute("placeholder",n(this))}}}})}(),function(){function a(a,b){this._historyStack=[],this.currIndex=-1,this._itemCap=void 0,this.itemCap=b,this._validatorFn=a?a:function(){return!0}}function b(a){var b=window.getComputedStyle(a),c=xtag.prefix.js+"TransitionDuration";return b.transitionDuration?b.transitionDuration:b[c]}function c(a){if("string"!=typeof a)return 0;var b=/^(\d*\.?\d+)(m?s)$/,c=a.toLowerCase().match(b);if(c){var d=c[1],e=c[2],f=parseFloat(d);if(isNaN(f))throw"value error";if("s"===e)return 1e3*f;if("ms"===e)return f;throw"unit error"}return 0}function d(a,b){return(a%b+b)%b}function e(a){return xtag.queryChildren(a,"x-card")}function f(a,b){var c=e(a);return isNaN(parseInt(b,10))||0>b||b>=c.length?null:c[b]}function g(a,b){var c=e(a);return c.indexOf(b)}function h(a,d,f,h,i){a.xtag._selectedCard=f;var j=new Date;a.xtag._lastAnimTimestamp=j;var m=function(){j===a.xtag._lastAnimTimestamp&&(k(a),xtag.fireEvent(a,"shuffleend",{detail:{oldCard:d,newCard:f}}))};if(f===d)return m(),void 0;var n=!1,o=!1,p=!1,q=function(){n&&o&&(e(a).forEach(function(a){a.removeAttribute("selected"),a.removeAttribute("leaving")}),d.setAttribute("leaving",!0),f.setAttribute("selected",!0),a.xtag._selectedCard=f,a.selectedIndex=g(a,f),i&&(d.setAttribute("reverse",!0),f.setAttribute("reverse",!0)),xtag.fireEvent(a,"shufflestart",{detail:{oldCard:d,newCard:f}}))},r=function(){p||n&&o&&s()},s=function(){p=!0;var a=!1,e=!1,g=!1,i=function(b){g||(b.target===d?(a=!0,d.removeEventListener("transitionend",i)):b.target===f&&(e=!0,f.removeEventListener("transitionend",i)),a&&e&&(g=!0,m()))};d.addEventListener("transitionend",i),f.addEventListener("transitionend",i);var j=c(b(d)),k=c(b(f)),n=Math.max(j,k),o=1.15,q="none"===h.toLowerCase()?0:Math.ceil(n*o);0===q?(g=!0,d.removeEventListener("transitionend",i),f.removeEventListener("transitionend",i),d.removeAttribute(l),f.removeAttribute(l),m()):(d.removeAttribute(l),f.removeAttribute(l),window.setTimeout(function(){g||(g=!0,d.removeEventListener("transitionend",i),f.removeEventListener("transitionend",i),m())},q))};xtag.skipTransition(d,function(){return d.setAttribute("card-anim-type",h),d.setAttribute(l,!0),n=!0,q(),r},this),xtag.skipTransition(f,function(){return f.setAttribute("card-anim-type",h),f.setAttribute(l,!0),o=!0,q(),r},this)}function i(a,b,c,d,f){var g=a.xtag._selectedCard;if(g===b){var i={detail:{oldCard:g,newCard:b}};return xtag.fireEvent(a,"shufflestart",i),xtag.fireEvent(a,"shuffleend",i),void 0}k(a),void 0===c&&(console.log("defaulting to none transition"),c="none");var j;switch(d){case"forward":j=!1;break;case"reverse":j=!0;break;default:g||(j=!1);var l=e(a);j=l.indexOf(b)<l.indexOf(g)?!0:!1}b.hasAttribute("transition-override")&&(c=b.getAttribute("transition-override")),f||a.xtag.history.pushState(b),h(a,g,b,c,j)}function j(a,b,c,d){var e=f(a,b);if(!e)throw"no card at index "+b;i(a,e,c,d)}function k(a){if(a.xtag._initialized){var b=e(a),c=a.xtag._selectedCard;c&&c.parentNode===a||(c=b.length>0?a.xtag.history&&a.xtag.history.numStates>0?a.xtag.history.currState:b[0]:null),b.forEach(function(a){a.removeAttribute("leaving"),a.removeAttribute(l),a.removeAttribute("card-anim-type"),a.removeAttribute("reverse"),a!==c?a.removeAttribute("selected"):a.setAttribute("selected",!0)}),a.xtag._selectedCard=c,a.selectedIndex=g(a,c)}}var l="_before-animation",m=a.prototype;m.pushState=function(a){if(this.canRedo&&this._historyStack.splice(this.currIndex+1,this._historyStack.length-(this.currIndex+1)),this._historyStack.push(a),this.currIndex=this._historyStack.length-1,this.sanitizeStack(),"none"!==this._itemCap&&this._historyStack.length>this._itemCap){var b=this._historyStack.length;this._historyStack.splice(0,b-this._itemCap),this.currIndex=this._historyStack.length-1}},m.sanitizeStack=function(){for(var a,b=this._validatorFn,c=0;c<this._historyStack.length;){var d=this._historyStack[c];d!==a&&b(d)?(a=d,c++):(this._historyStack.splice(c,1),c<=this.currIndex&&this.currIndex--)}},m.forwards=function(){this.canRedo&&this.currIndex++,this.sanitizeStack()},m.backwards=function(){this.canUndo&&this.currIndex--,this.sanitizeStack()},Object.defineProperties(m,{DEFAULT_CAP:{value:10},itemCap:{get:function(){return this._itemCap},set:function(a){if(void 0===a)this._itemCap=this.DEFAULT_CAP;else if("none"===a)this._itemCap="none";else{var b=parseInt(a,10);if(isNaN(a)||0>=a)throw"attempted to set invalid item cap: "+a;this._itemCap=b}}},canUndo:{get:function(){return this.currIndex>0}},canRedo:{get:function(){return this.currIndex<this._historyStack.length-1}},numStates:{get:function(){return this._historyStack.length}},currState:{get:function(){var a=this.currIndex;return a>=0&&a<this._historyStack.length?this._historyStack[a]:null}}}),xtag.register("x-deck",{lifecycle:{created:function(){var b=this;b.xtag._initialized=!0;var c=function(a){return a.parentNode===b};b.xtag.history=new a(c,a.DEFAULT_CAP),b.xtag._selectedCard=b.xtag._selectedCard?b.xtag._selectedCard:null,b.xtag._lastAnimTimestamp=null,b.xtag.transitionType="scrollLeft";var d=b.getCardAt(b.getAttribute("selected-index"));d&&(b.xtag._selectedCard=d),k(b);var e=b.xtag._selectedCard;e&&b.xtag.history.pushState(e)}},events:{"show:delegate(x-card)":function(){var a=this;a.show()}},accessors:{transitionType:{attribute:{name:"transition-type"},get:function(){return this.xtag.transitionType},set:function(a){this.xtag.transitionType=a}},selectedIndex:{attribute:{skip:!0,name:"selected-index"},get:function(){return g(this,this.xtag._selectedCard)},set:function(a){this.selectedIndex!==a&&j(this,a,"none"),this.setAttribute("selected-index",a)}},historyCap:{attribute:{name:"history-cap"},get:function(){return this.xtag.history.itemCap},set:function(a){this.xtag.history.itemCap=a}},numCards:{get:function(){return this.getAllCards().length}},currHistorySize:{get:function(){return this.xtag.history.numStates}},currHistoryIndex:{get:function(){return this.xtag.history.currIndex}},cards:{get:function(){return this.getAllCards()}},selectedCard:{get:function(){return this.getSelectedCard()}}},methods:{shuffleTo:function(a,b){var c=f(this,a);if(!c)throw"invalid shuffleTo index "+a;var d=this.xtag.transitionType;j(this,a,d,b)},shuffleNext:function(a){a=a?a:"auto";var b=e(this),c=this.xtag._selectedCard,f=b.indexOf(c);f>-1&&this.shuffleTo(d(f+1,b.length),a)},shufflePrev:function(a){a=a?a:"auto";var b=e(this),c=this.xtag._selectedCard,f=b.indexOf(c);f>-1&&this.shuffleTo(d(f-1,b.length),a)},getAllCards:function(){return e(this)},getSelectedCard:function(){return this.xtag._selectedCard},getCardIndex:function(a){return g(this,a)},getCardAt:function(a){return f(this,a)},historyBack:function(a){var b=this.xtag.history;if(b.canUndo){b.backwards();var c=b.currState;c&&i(this,c,this.transitionType,a,!0)}},historyForward:function(a){var b=this.xtag.history;if(b.canRedo){b.forwards();var c=b.currState;c&&i(this,c,this.transitionType,a,!0)}}}}),xtag.register("x-card",{lifecycle:{inserted:function(){var a=this,b=a.parentNode;b&&"x-deck"===b.tagName.toLowerCase()&&(k(b),a.xtag.parentDeck=b,xtag.fireEvent(b,"cardadd",{detail:{card:a}}))},created:function(){var a=this.parentNode;a&&"x-deck"===a.tagName.toLowerCase()&&(this.xtag.parentDeck=a)},removed:function(){var a=this;if(a.xtag.parentDeck){var b=a.xtag.parentDeck;b.xtag.history.sanitizeStack(),k(b),xtag.fireEvent(b,"cardremove",{detail:{card:a}})}}},accessors:{transitionOverride:{attribute:{name:"transition-override"}}},methods:{show:function(){var a=this.parentNode;a===this.xtag.parentDeck&&a.shuffleTo(a.getCardIndex(this))}}})}(),function(){xtag.register("x-flipbox",{lifecycle:{created:function(){this.firstElementChild&&xtag.skipTransition(this.firstElementChild,function(){}),this.lastElementChild&&xtag.skipTransition(this.lastElementChild,function(){}),this.hasAttribute("direction")||(this.xtag._direction="right")}},events:{"transitionend:delegate(*:first-child)":function(a){var b=a.target,c=b.parentNode;"x-flipbox"===c.nodeName.toLowerCase()&&xtag.fireEvent(c,"flipend")},"show:delegate(*:first-child)":function(a){var b=a.target,c=b.parentNode;"x-flipbox"===c.nodeName.toLowerCase()&&(c.flipped=!1)},"show:delegate(*:last-child)":function(a){var b=a.target,c=b.parentNode;"x-flipbox"===c.nodeName.toLowerCase()&&(c.flipped=!0)}},accessors:{direction:{attribute:{},get:function(){return this.xtag._direction},set:function(a){xtag.skipTransition(this.firstElementChild,function(){this.setAttribute("_anim-direction",a)},this),xtag.skipTransition(this.lastElementChild,function(){this.setAttribute("_anim-direction",a)},this),this.xtag._direction=a}},flipped:{attribute:{"boolean":!0}}},methods:{toggle:function(){this.flipped=!this.flipped},showFront:function(){this.flipped=!1},showBack:function(){this.flipped=!0}}})}(),function(){function a(a,b){a.xtag.iconEl.nodeName===g?(b=void 0!==b?b:a.xtag.iconEl.src,b||(a.xtag.iconEl.src=f),a.xtag.iconEl.style.display=b&&b!==f?"":"none"):a.xtag.iconEl.style.display=a.xtag.iconEl.innerHTML?"":"none",a.xtag.contentEl.style.display=a.xtag.contentEl.innerHTML?"":"none"}function b(a){var b=a.xtag.iconEl,c=a.xtag.contentEl;if(c&&b){var d=b.parentNode;if(!d||c.parentNode!==d)throw"invalid parent node of iconbutton's icon / label";switch(a.iconAnchor){case"right":case"bottom":d.insertBefore(c,b);break;default:d.insertBefore(b,c)}}}function c(){xtag.query(document,"x-iconbutton[active]").forEach(function(a){a.removeAttribute("active")})}function d(){xtag.query(document,"x-iconbutton:focus").forEach(function(a){a.blur()})}function e(a){c(a),d()}var f="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",g=document.createElement("img").nodeName,h=function(a){return a.xtag.contentEl.textContent},i=function(a,b){a.xtag.contentEl.textContent=b},j=32,k=13,l=null;xtag.register("x-iconbutton",{lifecycle:{created:function(){var c=this.innerHTML;this.innerHTML="<div class='x-iconbutton-content-wrap'><img class='x-iconbutton-icon'      src='"+f+"'/>"+"<span class='x-iconbutton-content'></span>"+"</div>"+"<div class='x-iconbutton-ghost'></div>",this.xtag.iconEl=this.querySelector(".x-iconbutton-icon"),this.xtag.contentEl=this.querySelector(".x-iconbutton-content"),this.xtag.contentEl.innerHTML=c,this.textGetter||(this.textGetter=h),this.textSetter||(this.textSetter=i),b(this),a(this),this.hasAttribute("tabindex")||this.setAttribute("tabindex",0)},inserted:function(){l||(l={tapend:xtag.addEvent(document,"tapend",e),dragend:xtag.addEvent(document,"dragend",e),keyup:xtag.addEvent(document,"keyup",c)}),b(this),a(this)},removed:function(){if(l&&!document.query("x-calendar")){for(var a in l)xtag.removeEvent(document,a,l[a]);l=null}},attributeChanged:function(){var c=this.iconEl,d=this.contentEl;c.parentNode&&c.parentNode.parentNode===this&&d.parentNode&&d.parentNode.parentNode===this||console.warn("inner DOM of the iconbutton appears to be out of sync; make sure that editing innerHTML or textContent is done through .contentEl, not directly on the iconbutton itself"),b(this),a(this)}},events:{tapstart:function(a){a.currentTarget.setAttribute("active",!0)},keypress:function(a){var b=a.key||a.keyCode;(b===j||b===k)&&a.currentTarget.click()},keydown:function(a){var b=a.key||a.keyCode;(b===j||b===k)&&a.currentTarget.setAttribute("active",!0)}},accessors:{src:{attribute:{},get:function(){return this.xtag.iconEl.getAttribute("src")},set:function(b){this.xtag.iconEl.setAttribute("src",b),this.xtag.iconEl.src=b,a(this,b)}},active:{attribute:{}},iconAnchor:{attribute:{name:"icon-anchor"},set:function(){b(this)}},iconEl:{get:function(){return this.xtag.iconEl}},contentEl:{get:function(){return this.xtag.contentEl}}}})}(),function(){function a(a){var b=a.firstElementChild;if(!b)return{header:null,section:null,footer:null};var c=b.nextElementSibling;return{header:"HEADER"==b.nodeName?b:null,section:"SECTION"==b.nodeName?b:c&&"SECTION"==c.nodeName?c:null,footer:"FOOTER"==a.lastElementChild.nodeName?a.lastElementChild:null}}function b(a,b){var c=b.__layoutScroll__=b.__layoutScroll__||Object.defineProperty(b,"__layoutScroll__",{value:{last:b.scrollTop}}).__layoutScroll__,d=b.scrollTop,e=a.scrollBuffer;return c.max=c.max||Math.max(d+e,e),c.min=c.min||Math.max(d-e,e),c}function c(a,b){a.setAttribute("content-maximizing",null),b.section&&(b.header&&(b.section.style.marginTop="-"+b.header.getBoundingClientRect().height+"px"),b.footer&&(b.section.style.marginBottom="-"+b.footer.getBoundingClientRect().height+"px"))}function d(a,b){a.removeAttribute("content-maximized"),a.removeAttribute("content-maximizing"),b.section&&(b.section.style.marginTop="",b.section.style.marginBottom="")}function e(e){if(!e.currentTarget.hasAttribute("content-maximizing")){var f=e.target,g=e.currentTarget;if(this.scrollhide&&(f.parentNode==g||xtag.matchSelector(f,g.scrollTarget))){var h=f.scrollTop,i=g.scrollBuffer,j=a(g),k=b(g,f);
h>k.last?k.min=Math.max(h-i,i):h<k.last&&(k.max=Math.max(h+i,i)),g.maxcontent||(h>k.max&&!g.hasAttribute("content-maximized")?c(g,j):h<k.min&&d(g,j)),k.last=h}}}xtag.register("x-layout",{lifecycle:{created:function(){}},events:{scroll:e,transitionend:function(b){var c=a(this);!this.hasAttribute("content-maximizing")||b.target!=c.header&&b.target!=c.section&&b.target!=c.footer||(this.setAttribute("content-maximized",null),this.removeAttribute("content-maximizing"))},"tap:delegate(section)":function(b){var e=b.currentTarget;if(e.taphide&&this.parentNode==e){var f=a(e);e.hasAttribute("content-maximizing")||e.hasAttribute("content-maximized")?e.maxcontent||d(e,f):c(e,f)}},"mouseover:delegate(section)":function(b){var d=b.currentTarget;!d.hoverhide||this.parentNode!=d||d.hasAttribute("content-maximized")||d.hasAttribute("content-maximizing")||b.relatedTarget&&!this.contains(b.target)||c(d,a(d))},"mouseout:delegate(section)":function(b){var c=b.currentTarget;!c.hoverhide||this.parentNode!=c||!c.hasAttribute("content-maximized")&&!c.hasAttribute("content-maximizing")||c!=b.relatedTarget&&c.contains(b.relatedTarget)||d(c,a(c))}},accessors:{scrollTarget:{attribute:{name:"scroll-target"}},scrollBuffer:{attribute:{name:"scroll-buffer"},get:function(){return Number(this.getAttribute("scroll-buffer"))||30}},taphide:{attribute:{"boolean":!0}},hoverhide:{attribute:{"boolean":!0}},scrollhide:{attribute:{"boolean":!0}},maxcontent:{attribute:{"boolean":!0},set:function(b){var e=a(this);b?c(this,e):this.hasAttribute("content-maximizing")||d(this,e)}}}})}(),function(){function a(a){var b=xtag.query(a,"x-slides > x-slide[selected]")[0]||0;return[b?xtag.query(a,"x-slides > x-slide").indexOf(b):b,a.firstElementChild.children.length-1]}function b(a,b){var c=xtag.toArray(a.firstElementChild.children);c.forEach(function(a){a.removeAttribute("selected")}),c[b||0].setAttribute("selected",!0);var e="translate"+(a.getAttribute("orientation")||"x")+"("+(b||0)*(-100/c.length)+"%)";a.firstElementChild.style[d]=e,a.firstElementChild.style.transform=e}function c(a){var c=this.firstElementChild;if(c&&c.children.length&&"x-slides"==c.tagName.toLowerCase()){var e=xtag.toArray(c.children),f=100/(e.length||1),g=this.getAttribute("orientation")||"x",h="x"==g?["width","height"]:["height","width"];if(c.style[h[1]]="100%",c.style[h[0]]=100*e.length+"%",c.style[d]="translate"+g+"(0%)",c.style.transform="translate"+g+"(0%)",e.forEach(function(a){a.style[h[0]]=f+"%",a.style[h[1]]="100%"}),a){var i=c.querySelector("[selected]");i&&b(this,e.indexOf(i)||0)}}}var d=xtag.prefix.js+"Transform";xtag.register("x-slidebox",{lifecycle:{created:function(){c()}},events:{transitionend:function(a){a.target==this.firstElementChild&&xtag.fireEvent(this,"slideend")},"show:delegate(x-slide)":function(a){var b=a.target;if("x-slides"===b.parentNode.nodeName.toLowerCase()&&"x-slidebox"===b.parentNode.parentNode.nodeName.toLowerCase()){var c=b.parentNode,d=c.parentNode,e=xtag.query(c,"x-slide");d.slideTo(e.indexOf(b))}}},accessors:{orientation:{get:function(){return this.getAttribute("orientation")},set:function(a){var b=this;xtag.skipTransition(b.firstElementChild,function(){b.setAttribute("orientation",a.toLowerCase()),c.call(b,!0)})}}},methods:{slideTo:function(a){b(this,a)},slideNext:function(){var c=a(this);c[0]++,b(this,c[0]>c[1]?0:c[0])},slidePrevious:function(){var c=a(this);c[0]--,b(this,c[0]<0?c[1]:c[0])}}}),xtag.register("x-slide",{lifecycle:{inserted:function(){var a=this.parentNode.parentNode;"x-slidebox"==a.tagName.toLowerCase()&&c.call(a,!0)},created:function(){if(this.parentNode){var a=this.parentNode.parentNode;"x-slidebox"==a.tagName.toLowerCase()&&c.call(a,!0)}}}})}(),function(){function a(a){return!isNaN(parseFloat(a))}function b(b,c){return b.hasAttribute(c)&&a(b.getAttribute(c))}function c(b,c,d,e){if(e=e?e:Math.round,d=a(d)?d:0,!a(b))throw"invalid value "+b;if(!a(c)||0>=+c)throw"invalid step "+c;return e((b-d)/c)*c+d}function d(a,b,d,e){return b>a?b:a>d?Math.max(b,c(d,e,b,Math.floor)):a}function e(a,b,e){var f=c((b-a)/2+a,e,a);return d(f,a,b,e)}function f(a,b){var c=a.min,d=a.max;return(b-c)/(d-c)}function g(a,b){var c=a.min,d=a.max;return(d-c)*b+c}function h(a,b){b=Math.min(Math.max(0,b),1);var e=g(a,b),f=c(e,a.step,a.min);return d(f,a.min,a.max,a.step)}function i(a,b){var c=a.xtag.polyFillSliderThumb;if(c){var d=a.getBoundingClientRect(),e=c.getBoundingClientRect(),g=f(a,b),h=Math.max(d.width-e.width,0),i=h*g,j=i/d.width;c.style.left=100*j+"%"}}function j(a){i(a,a.value)}function k(a,b){var c=a.xtag.rangeInputEl,d=c.getBoundingClientRect(),e=b-d.left;a.value;var f=h(a,e/d.width);a.value=f,xtag.fireEvent(a,"input"),j(a)}function l(a,b,c){a.xtag.dragInitVal=a.value,k(a,b,c);var d=a.xtag.callbackFns,e=function(a,b){document.body.addEventListener(a,b)};e("mousemove",d.onMouseDragMove),e("touchmove",d.onTouchDragMove),e("mouseup",d.onDragEnd),e("touchend",d.onDragEnd);var f=a.xtag.polyFillSliderThumb;f&&f.setAttribute("active",!0)}function m(a,b,c){k(a,b,c)}function n(a){return{onMouseDragStart:function(b){b.button===p&&(l(a,b.pageX,b.pageY),b.preventDefault())},onTouchDragStart:function(b){var c=b.targetTouches;1===c.length&&(l(a,c[0].pageX,c[0].pageY),b.preventDefault())},onMouseDragMove:function(b){m(a,b.pageX,b.pageY),b.preventDefault()},onTouchDragMove:function(b){var c=b.targetTouches;1===c.length&&(m(a,c[0].pageX,c[0].pageY),b.preventDefault())},onDragEnd:function(b){var c=a.xtag.callbackFns,d=function(a,b){document.body.removeEventListener(a,b)};d("mousemove",c.onMouseDragMove),d("touchmove",c.onTouchDragMove),d("mouseup",c.onDragEnd),d("touchend",c.onDragEnd);var e=a.xtag.polyFillSliderThumb;e&&e.removeAttribute("active"),a.value!==a.xtag.dragInitVal&&xtag.fireEvent(a,"change"),a.xtag.dragInitVal=null,b.preventDefault()},onKeyDown:function(a){var b=a.keyCode;if(b in o){var c=this.value,d=this.min,e=this.max,f=this.step,g=Math.max(0,e-d),h=Math.max(g/10,f);switch(o[b]){case"LEFT_ARROW":case"DOWN_ARROW":this.value=Math.max(c-f,d);break;case"RIGHT_ARROW":case"UP_ARROW":this.value=Math.min(c+f,e);break;case"HOME":this.value=d;break;case"END":this.value=e;break;case"PAGE_DOWN":this.value=Math.max(c-h,d);break;case"PAGE_UP":this.value=Math.min(c+h,e)}this.value!==c&&xtag.fireEvent(this,"change"),a.preventDefault()}}}}var o={33:"PAGE_UP",34:"PAGE_DOWN",35:"END",36:"HOME",37:"LEFT_ARROW",38:"UP_ARROW",39:"RIGHT_ARROW",40:"DOWN_ARROW"},p=0;xtag.register("x-slider",{lifecycle:{created:function(){var a=this;a.xtag.callbackFns=n(a),a.xtag.dragInitVal=null;var c=document.createElement("input");xtag.addClass(c,"input"),c.setAttribute("type","range");var d=b(a,"max")?+a.getAttribute("max"):100,f=b(a,"min")?+a.getAttribute("min"):0,g=b(a,"step")?+a.getAttribute("step"):1;g=g>0?g:1;var h=b(a,"value")?+a.getAttribute("value"):e(f,d,g);c.setAttribute("max",d),c.setAttribute("min",f),c.setAttribute("step",g),c.setAttribute("value",h),a.xtag.rangeInputEl=c,a.appendChild(a.xtag.rangeInputEl),a.xtag.polyFillSliderThumb=null,"range"!==c.type||a.hasAttribute("polyfill")?a.setAttribute("polyfill",!0):a.removeAttribute("polyfill"),j(a)},attributeChanged:function(){j(this)}},events:{"change:delegate(input[type=range])":function(a){a.stopPropagation(),xtag.fireEvent(a.currentTarget,"change")},"input:delegate(input[type=range])":function(a){a.stopPropagation(),xtag.fireEvent(a.currentTarget,"input")},"focus:delegate(input[type=range])":function(a){var b=a.currentTarget;xtag.fireEvent(b,"focus",{},{bubbles:!1})},"blur:delegate(input[type=range])":function(a){var b=a.currentTarget;xtag.fireEvent(b,"blur",{},{bubbles:!1})}},accessors:{polyfill:{attribute:{"boolean":!0},set:function(a){var b=this.xtag.callbackFns;if(a){if(this.setAttribute("tabindex",0),this.xtag.rangeInputEl.setAttribute("tabindex",-1),this.xtag.rangeInputEl.setAttribute("readonly",!0),!this.xtag.polyFillSliderTrack){var c=document.createElement("div");xtag.addClass(c,"slider-track"),this.xtag.polyFillSliderTrack=c,this.appendChild(c)}if(!this.xtag.polyFillSliderThumb){var d=document.createElement("span");xtag.addClass(d,"slider-thumb"),this.xtag.polyFillSliderThumb=d,this.appendChild(d)}j(this),this.addEventListener("mousedown",b.onMouseDragStart),this.addEventListener("touchstart",b.onTouchDragStart),this.addEventListener("keydown",b.onKeyDown)}else this.removeAttribute("tabindex"),this.xtag.rangeInputEl.removeAttribute("tabindex"),this.xtag.rangeInputEl.removeAttribute("readonly"),this.removeEventListener("mousedown",b.onMouseDragStart),this.removeEventListener("touchstart",b.onTouchDragStart),this.removeEventListener("keydown",b.onKeyDown)}},max:{attribute:{selector:"input[type=range]"},get:function(){return+this.xtag.rangeInputEl.getAttribute("max")}},min:{attribute:{selector:"input[type=range]"},get:function(){return+this.xtag.rangeInputEl.getAttribute("min")}},step:{attribute:{selector:"input[type=range]"},get:function(){return+this.xtag.rangeInputEl.getAttribute("step")}},name:{attribute:{selector:"input[type=range]"},set:function(a){var b=this.xtag.rangeInputEl;null===a||void 0===a?b.removeAttribute("name"):b.setAttribute("name",a)}},value:{attribute:{selector:"input[type=range]"},get:function(){return+this.xtag.rangeInputEl.value},set:function(b){a(b)||(b=e(this.min,this.max,this.step)),b=+b;var f=this.min,g=this.max,h=this.step,i=c(b,h,f),k=d(i,f,g,h);this.xtag.rangeInputEl.value=k,j(this)}},inputElem:{get:function(){return this.xtag.rangeInputEl}}},methods:{}})}(),function(){function a(){var a=document.documentElement,b={left:a.scrollLeft||document.body.scrollLeft||0,top:a.scrollTop||document.body.scrollTop||0,width:a.clientWidth,height:a.clientHeight};return b.right=b.left+b.width,b.bottom=b.top+b.height,b}function b(b){var c=b.getBoundingClientRect(),d=a(),e=d.left,f=d.top;return{left:c.left+e,right:c.right+e,top:c.top+f,bottom:c.bottom+f,width:c.width,height:c.height}}function c(a,b,c){return c.left<=a&&a<=c.right&&c.top<=b&&b<=c.bottom}function d(a){if("x-tabbar"===a.parentNode.nodeName.toLowerCase()){var b=a.targetEvent,c=a.targetSelector?xtag.query(document,a.targetSelector):a.targetElems;c.forEach(function(a){xtag.fireEvent(a,b)})}}xtag.register("x-tabbar",{lifecycle:{created:function(){this.xtag.overallEventToFire="show"}},events:{"tap:delegate(x-tabbar-tab)":function(){var a=xtag.query(this.parentNode,"x-tabbar-tab[selected]");a.length&&a.forEach(function(a){a.removeAttribute("selected")}),this.setAttribute("selected",!0)}},accessors:{tabs:{get:function(){return xtag.queryChildren(this,"x-tabbar-tab")}},targetEvent:{attribute:{name:"target-event"},get:function(){return this.xtag.overallEventToFire},set:function(a){this.xtag.overallEventToFire=a}}},methods:{}}),xtag.register("x-tabbar-tab",{lifecycle:{created:function(){this.xtag.targetSelector=null,this.xtag.overrideTargetElems=null,this.xtag.targetEvent=null}},events:{tap:function(a){var e=a.currentTarget;if(a.changedTouches&&a.changedTouches.length>0){var f=a.changedTouches[0],g=b(e);c(f.pageX,f.pageY,g)&&d(e)}else d(e)}},accessors:{targetSelector:{attribute:{name:"target-selector"},get:function(){return this.xtag.targetSelector},set:function(a){this.xtag.targetSelector=a,a&&(this.xtag.overrideTargetElems=null)}},targetElems:{get:function(){return this.targetSelector?xtag.query(document,this.targetSelector):null!==this.xtag.overrideTargetElems?this.xtag.overrideTargetElems:[]},set:function(a){this.removeAttribute("target-selector"),this.xtag.overrideTargetElems=a}},targetEvent:{attribute:{name:"target-event"},get:function(){if(this.xtag.targetEvent)return this.xtag.targetEvent;if("x-tabbar"===this.parentNode.nodeName.toLowerCase())return this.parentNode.targetEvent;throw"tabbar-tab is missing event to fire"},set:function(a){this.xtag.targetEvent=a}}},methods:{}})}(),function(){function a(a){var b=a.xtag.inputEl.form;b?a.removeAttribute("x-toggle-no-form"):a.setAttribute("x-toggle-no-form",""),a.xtag.scope=a.parentNode?b||document:null}function b(a){var b={},c=a==document?"[x-toggle-no-form]":"";xtag.query(a,"x-toggle[name]"+c).forEach(function(d){var e=d.name;if(e&&!b[e]){var f=xtag.query(a,'x-toggle[name="'+e+'"]'+c),g=f.length>1?"radio":"checkbox";f.forEach(function(a){a.xtag&&a.xtag.inputEl&&(a.type=g)}),b[e]=!0}})}var c=!1;xtag.addEvents(document,{DOMComponentsLoaded:function(){b(document),xtag.toArray(document.forms).forEach(b)},WebComponentsReady:function(){b(document),xtag.toArray(document.forms).forEach(b)},keydown:function(a){c=a.shiftKey},keyup:function(a){c=a.shiftKey},"focus:delegate(x-toggle)":function(){this.setAttribute("focus","")},"blur:delegate(x-toggle)":function(){this.removeAttribute("focus")},"tap:delegate(x-toggle)":function(){if(c&&this.group){var a=this.groupToggles,b=this.xtag.scope.querySelector('x-toggle[group="'+this.group+'"][active]');if(b&&this!=b){var d=this,e=b.checked,f=a.indexOf(this),g=a.indexOf(b),h=Math.min(f,g),i=Math.max(f,g);a.slice(h,i).forEach(function(a){a!=d&&(a.checked=e)})}}},"change:delegate(x-toggle)":function(){var a=this.xtag.scope.querySelector('x-toggle[group="'+this.group+'"][active]');this.checked=c&&a&&this!=a?a.checked:this.xtag.inputEl.checked,this.group&&(this.groupToggles.forEach(function(a){a.active=!1}),this.active=!0)}}),xtag.register("x-toggle",{lifecycle:{created:function(){this.innerHTML='<label class="x-toggle-input-wrap"><input type="checkbox"></input></label><div class="x-toggle-check"></div><div class="x-toggle-content"></div>',this.xtag.inputWrapEl=this.querySelector(".x-toggle-input-wrap"),this.xtag.inputEl=this.xtag.inputWrapEl.querySelector("input"),this.xtag.contentWrapEl=this.querySelector(".x-toggle-content-wrap"),this.xtag.checkEl=this.querySelector(".x-toggle-check"),this.xtag.contentEl=this.querySelector(".x-toggle-content"),this.type="checkbox",a(this);var b=this.getAttribute("name");b&&(this.xtag.inputEl.name=this.getAttribute("name")),this.hasAttribute("checked")&&(this.checked=!0)},inserted:function(){a(this),this.parentNode&&"x-togglegroup"===this.parentNode.nodeName.toLowerCase()&&(this.parentNode.hasAttribute("name")&&(this.name=this.parentNode.getAttribute("name")),this.parentNode.hasAttribute("group")&&(this.group=this.parentNode.getAttribute("group")),this.setAttribute("no-box",!0)),this.name&&b(this.xtag.scope)},removed:function(){b(this.xtag.scope),a(this)}},accessors:{noBox:{attribute:{name:"no-box","boolean":!0},set:function(){}},type:{attribute:{},set:function(a){this.xtag.inputEl.type=a}},label:{attribute:{},get:function(){return this.xtag.contentEl.innerHTML},set:function(a){this.xtag.contentEl.innerHTML=a}},active:{attribute:{"boolean":!0}},group:{attribute:{}},groupToggles:{get:function(){return xtag.query(this.xtag.scope,'x-toggle[group="'+this.group+'"]')}},name:{attribute:{skip:!0},get:function(){return this.getAttribute("name")},set:function(a){null===a?(this.removeAttribute("name"),this.type="checkbox"):this.setAttribute("name",a),this.xtag.inputEl.name=a,b(this.xtag.scope)}},checked:{get:function(){return this.xtag.inputEl.checked},set:function(a){var b=this.name,c="true"===a||a===!0;if(b){var d=this.xtag.scope==document?"[x-toggle-no-form]":"",e='x-toggle[checked][name="'+b+'"]'+d,f=this.xtag.scope.querySelector(e);f&&f.removeAttribute("checked")}this.xtag.inputEl.checked=c,c?this.setAttribute("checked",""):this.removeAttribute("checked")}},value:{attribute:{},get:function(){return this.xtag.inputEl.value},set:function(a){this.xtag.inputEl.value=a}}}})}(),function(){xtag.register("x-togglegroup",{lifecycle:{created:function(){this.options.forEach(function(a){this.name&&(a.name=this.name),this.group&&(a.group=this.group),a.noBox=!0}.bind(this))}},events:{},accessors:{name:{attribute:{selector:"x-toggle"},set:function(a){this.options.forEach(function(b){b.name=a})}},group:{attribute:{selector:"x-toggle"},set:function(a){this.options.forEach(function(b){b.group=a})}},options:{get:function(){return xtag.queryChildren(this,"x-toggle")}}},methods:{}})}(),function(){function a(a){return a in G}function b(){var a=document.documentElement,b={left:a.scrollLeft||document.body.scrollLeft||0,top:a.scrollTop||document.body.scrollTop||0,width:a.clientWidth,height:a.clientHeight};return b.right=b.left+b.width,b.bottom=b.top+b.height,b}function c(a){var c=a.getBoundingClientRect(),d=b(),e=d.left,f=d.top;return{left:c.left+e,right:c.right+e,top:c.top+f,bottom:c.bottom+f,width:c.width,height:c.height}}function d(a,b){return b=void 0!==b?b:c(a),{x:a.offsetWidth?b.width/a.offsetWidth:1,y:a.offsetHeight?b.height/a.offsetHeight:1}}function e(a,b){if(a.right<b.left||b.right<a.left||a.bottom<b.top||b.bottom<a.top)return null;var c={left:Math.max(a.left,b.left),top:Math.max(a.top,b.top),right:Math.min(a.right,b.right),bottom:Math.min(a.bottom,b.bottom)};return c.width=c.right-c.left,c.height=c.bottom-c.top,c.width<0||c.height<0?null:c}function f(a,b,c){this.eventType=b,this.listenerFn=c,this.elem=a,this._attachedFn=null}function g(a){this._cachedListener=null,this._tooltips=[];var b=this,c=function(a){b._tooltips.forEach(function(b){b.xtag._skipOuterClick||!b.hasAttribute("visible")||b.ignoreOuterTrigger||n(a.target,b)||B(b),b.xtag._skipOuterClick=!1})},d=this._cachedListener=new f(document,a,c);d.attachListener()}function h(){this.eventStructDict={}}function i(a,b,c){var d=function(b){c&&n(b.target,a.previousElementSibling)&&c.call(a.previousElementSibling,b)};return new f(document.documentElement,b,d)}function j(a,b,c){var d=b+":delegate(x-tooltip+*)",e=function(b){c&&this===a.nextElementSibling&&c.call(this,b)};return new f(document.documentElement,d,e)}function k(a,b,c,d){if(b===H)return i(a,c,d);if(b===I)return j(a,c,d);var e=c+":delegate("+b+")";return new f(document.documentElement,e,function(b){var c=this;n(c,a)||d.call(c,b)})}function l(a,b,c){var d=[],e=function(){var b=this;a.xtag._skipOuterClick=!0,a.hasAttribute("visible")?b===a.xtag.lastTargetElem?B(a):A(a,b):A(a,b)},f=k(a,b,c,e);return d.push(f),d}function m(a,b){for(;a;){if(b(a))return a;a=a.parentNode}return null}function n(a,b){if(b.contains)return b.contains(a);var c=function(a){return a===b};return!!m(a,c)}function o(a){return function(b){var c=this,d=b.relatedTarget||b.toElement;d?n(d,c)||a.call(this,b):a.call(this,b)}}function p(a,b){var c=[];c=b===H?a.previousElementSibling?[a.previousElementSibling]:[]:b===I?a.nextElementSibling?[a.nextElementSibling]:[]:xtag.query(document,b);for(var d=0;d<c.length;){var e=c[d];n(e,a)?c.splice(d,1):d++}return c}function q(a,b){var d=function(a,b,c){return c.left<=a&&a<=c.right&&c.top<=b&&b<=c.bottom},e=c(a),f=c(b),g=function(a,b){return d(a.left,a.top,b)||d(a.right,a.top,b)||d(a.right,a.bottom,b)||d(a.left,a.bottom,b)},h=function(a,b){return a.top<=b.top&&b.bottom<=a.bottom&&b.left<=a.left&&a.right<=b.right};return g(e,f)||g(f,e)||h(e,f)||h(f,e)}function r(a,b,c){var d=c*(Math.PI/180),e=a*Math.sin(d)+b*Math.cos(d),f=a*Math.cos(d)+b*Math.sin(d);return{height:e,width:f}}function s(a,b,c){var d=a;return d=void 0!==b&&null!==b?Math.max(b,d):d,d=void 0!==c&&null!==c?Math.min(c,d):d}function t(a,b,e,f,g){var h,i;if(e===window)h=a,i=b;else{var j=c(e);h=a-j.left,i=b-j.top}var k=c(f);g=g?g:d(f,k);var l=f.clientTop*g.y,m=f.clientLeft*g.x,o=f.scrollTop*g.y,p=f.scrollLeft*g.x,q={left:h-k.left-m,top:i-k.top-l};return!n(document.body,f)&&n(f,document.body)&&(q.top+=o,q.left+=p),q}function u(a,d){d||(d=c(a.offsetParent||a.parentNode));var f=b(),g=f;return a.allowOverflow||(g=e(f,d),g||(g=d)),g}function v(a,b){if(0===b.length)return null;for(var c=u(a),d=c.left,e=c.top,f=c.right,g=c.bottom,h=[],i=[],j=0;j<b.length;j++){var k=b[j],l=k.rect;l.left<d||l.top<e||l.right>f||l.bottom>g?i.push(k):h.push(k)}var m=h.length>0?h:i;return m[0].orient}function w(a){a.setAttribute("_force-display",!0)}function x(a){a.removeAttribute("_force-display")}function y(b,c){b.removeAttribute(K);var d=b.xtag.arrowEl,e=null,f=[];for(var g in G)d.setAttribute(J,G[g]),e=z(b,c,g),e&&(w(b),q(b,c)||f.push({orient:g,rect:e}),x(b));var h=v(b,f);return h||(h="top"),b.setAttribute(K,h),d.setAttribute(J,G[h]),a(h)&&h!==g?z(b,c,h):e}function z(e,f,g,h){if(!e.parentNode)return e.left="",e.top="",null;h=void 0===h?0:h;var i=e.xtag.arrowEl;if(!a(g))return y(e,f);var j=e.offsetParent?e.offsetParent:e.parentNode;h||(e.style.top="",e.style.left="",i.style.top="",i.style.left=""),w(e);var k=b(),l=c(j),o=d(j,l),p=j.clientWidth*o.x,q=j.clientHeight*o.y,v=c(f),A=v.width,B=v.height,C=c(e),D=d(e,C),E=C.width,F=C.height,G=C.width,H=C.height,I=(G-E)/2,J=(H-F)/2,K=i.offsetWidth*D.x,L=i.offsetHeight*D.y,M=45,N=r(K,L,M);K=N.width,L=N.height,"top"===g||"bottom"===g?L/=2:K/=2;var O=u(e,l),P=O.left,Q=O.top,R=O.right-E,S=O.bottom-F,T={left:v.left+(A-E)/2,top:v.top+(B-F)/2},U=T.left,V=T.top;if("top"===g)V=v.top-H-L,S-=L;else if("bottom"===g)V=v.top+B+L,S-=L;else if("left"===g)U=v.left-G-K,R-=K;else{if("right"!==g)throw"invalid orientation "+g;U=v.left+A+K,R-=K}var W=s(U,P,R),X=s(V,Q,S);W+=I,X+=J;var Y,Z,$=function(a){if(!window.getComputedStyle||a===document||a===document.documentElement)return!1;var b;try{b=window.getComputedStyle(a)}catch(c){return!1}return b&&"fixed"===b.position},_=m(f,$);if(_&&!n(e,_))Y=W-k.left,Z=X-k.top,e.setAttribute("_target-fixed",!0);else{var ab=t(W,X,window,j,o);Y=ab.left,Z=ab.top,e.removeAttribute("_target-fixed")}e.style.top=Z+"px",e.style.left=Y+"px";var bb,cb,db,eb,fb;"top"===g||"bottom"===g?(eb=(A-K)/2,fb=v.left-W,bb=E-K,cb=E,db="left"):(eb=(B-L)/2,fb=v.top-X,bb=F-L,cb=F,db="top");var gb=s(eb+fb,0,bb),hb=cb?gb/cb:0;i.style[db]=100*hb+"%";var ib=e.offsetWidth*D.x,jb=e.offsetHeight*D.y,kb=j.clientWidth*o.x,lb=j.clientHeight*o.y;x(e);var mb=2;return mb>h&&(E!==ib||F!==jb||p!==kb||q!==lb)?z(e,f,g,h+1):{left:W,top:X,width:ib,height:jb,right:W+ib,bottom:X+jb}}function A(a,b){b===a&&console.warn("The tooltip's target element is the tooltip itself! Is this intentional?");var c=a.xtag.arrowEl;c.parentNode||console.warn("The inner component DOM of the tooltip appears to be missing. Make sure to edit tooltip contents through the .contentEl property instead ofdirectly on the x-tooltip to avoid clobbering the component's internals.");var d=a.orientation,e=function(){x(a),a.setAttribute("visible",!0),xtag.fireEvent(a,"tooltipshown",{triggerElem:b})};b?(a.xtag.lastTargetElem=b,xtag.skipTransition(a,function(){return z(a,b,d),e})):(a.style.top="",a.style.left="",c.style.top="",c.style.left="",e())}function B(b){a(b.orientation)&&b.removeAttribute(K),b.hasAttribute("visible")&&(w(b),b.xtag._hideTransitionFlag=!0,b.removeAttribute("visible"))}function C(a){var b=a.xtag.cachedListeners;b.forEach(function(a){a.removeListener()}),a.xtag.cachedListeners=[],E.unregisterTooltip(a.triggerStyle,a)}function D(a,b,c){if(a.parentNode){(void 0===b||null===b)&&(b=a.targetSelector),(void 0===c||null===c)&&(c=a.triggerStyle);var d=p(a,b);-1===d.indexOf(a.xtag.lastTargetElem)&&(a.xtag.lastTargetElem=d.length>0?d[0]:null,z(a,a.xtag.lastTargetElem,a.orientation)),C(a);var e;if(c in F){var f=F[c];e=f(a,b)}else e=l(a,b,c),E.registerTooltip(c,a);e.forEach(function(a){a.attachListener()}),a.xtag.cachedListeners=e,B(a)}}var E,F,G={top:"down",bottom:"up",left:"right",right:"left"},H="_previousSibling",I="_nextSibling",J="arrow-direction",K="_auto-orientation";f.prototype.attachListener=function(){this._attachedFn||(this._attachedFn=xtag.addEvent(this.elem,this.eventType,this.listenerFn))},f.prototype.removeListener=function(){this._attachedFn&&(xtag.removeEvent(this.elem,this.eventType,this._attachedFn),this._attachedFn=null)},g.prototype.destroy=function(){this._cachedListener.removeListener(),this._cachedListener=null,this._tooltips=null},g.prototype.containsTooltip=function(a){return-1!==this._tooltips.indexOf(a)},g.prototype.addTooltip=function(a){this.containsTooltip(a)||this._tooltips.push(a)},g.prototype.removeTooltip=function(a){this.containsTooltip(a)&&this._tooltips.splice(this._tooltips.indexOf(a),1)},Object.defineProperties(g.prototype,{numTooltips:{get:function(){return this._tooltips.length}}}),h.prototype.registerTooltip=function(a,b){if(a in this.eventStructDict){var c=this.eventStructDict[a];c.containsTooltip(b)||c.addTooltip(b)}else this.eventStructDict[a]=new g(a),this.eventStructDict[a].addTooltip(b)},h.prototype.unregisterTooltip=function(a,b){if(a in this.eventStructDict&&this.eventStructDict[a].containsTooltip(b)){var c=this.eventStructDict[a];c.removeTooltip(b),0===c.numTooltips&&(c.destroy(),delete this.eventStructDict[a])}},E=new h,F={custom:function(){return[]},hover:function(a,b){var c=[],d=null,e=200,g=function(){d&&window.clearTimeout(d),d=null},h=o(function(b){g();var c=this,d=b.relatedTarget||b.toElement;n(d,a)||A(a,c)}),i=o(function(b){g();var c=b.relatedTarget||b.toElement;n(c,a)||(d=window.setTimeout(function(){"hover"===a.triggerStyle&&B(a)},e))}),j=k(a,b,"enter",h),l=k(a,b,"leave",i);c.push(j),c.push(l);var m=o(function(b){g();var c=b.relatedTarget||b.toElement,d=a.xtag.lastTargetElem;a.hasAttribute("visible")||!d||n(c,d)||A(a,d)}),p=o(function(b){g();var c=b.relatedTarget||b.toElement,f=a.xtag.lastTargetElem;f&&!n(c,f)&&(d=window.setTimeout(function(){"hover"===a.triggerStyle&&B(a)},e))});return c.push(new f(a,"enter",m)),c.push(new f(a,"leave",p)),c}},xtag.register("x-tooltip",{lifecycle:{created:function(){var a=this;a.xtag.contentEl=document.createElement("div"),a.xtag.arrowEl=document.createElement("span"),xtag.addClass(a.xtag.contentEl,"tooltip-content"),xtag.addClass(a.xtag.arrowEl,"tooltip-arrow"),a.xtag.contentEl.innerHTML=a.innerHTML,a.innerHTML="",a.appendChild(a.xtag.contentEl),a.appendChild(a.xtag.arrowEl),a.xtag._orientation="auto",a.xtag._targetSelector=H,a.xtag._triggerStyle="click";var b=p(a,a.xtag._targetSelector);a.xtag.lastTargetElem=b.length>0?b[0]:null,a.xtag.cachedListeners=[],a.xtag._hideTransitionFlag=!1,a.xtag._skipOuterClick=!1},inserted:function(){D(this,this.xtag._targetSelector,this.xtag._triggerStyle)},removed:function(){C(this)}},events:{transitionend:function(a){var b=a.currentTarget;b.xtag._hideTransitionFlag&&!b.hasAttribute("visible")&&(b.xtag._hideTransitionFlag=!1,xtag.fireEvent(b,"tooltiphidden")),x(b)}},accessors:{orientation:{attribute:{},get:function(){return this.xtag._orientation},set:function(b){b=b.toLowerCase();var c=this.querySelector(".tooltip-arrow"),d=null;a(b)?(d=G[b],c.setAttribute(J,d),this.removeAttribute(K)):c.removeAttribute(J),this.xtag._orientation=b,this.refreshPosition()}},triggerStyle:{attribute:{name:"trigger-style"},get:function(){return this.xtag._triggerStyle},set:function(a){D(this,this.targetSelector,a),this.xtag._triggerStyle=a}},targetSelector:{attribute:{name:"target-selector"},get:function(){return this.xtag._targetSelector},set:function(a){p(this,a),D(this,a,this.triggerStyle),this.xtag._targetSelector=a}},ignoreOuterTrigger:{attribute:{"boolean":!0,name:"ignore-outer-trigger"}},ignoreTooltipPointerEvents:{attribute:{"boolean":!0,name:"ignore-tooltip-pointer-events"}},allowOverflow:{attribute:{"boolean":!0,name:"allow-overflow"},set:function(){this.refreshPosition()}},contentEl:{get:function(){return this.xtag.contentEl},set:function(a){var b=this.xtag.contentEl;xtag.addClass(a,"tooltip-content"),this.replaceChild(a,b),this.xtag.contentEl=a,this.refreshPosition()}},presetTriggerStyles:{get:function(){var a=[];for(var b in F)a.push(b);return a}},targetElems:{get:function(){return p(this,this.targetSelector)}}},methods:{refreshPosition:function(){this.xtag.lastTargetElem&&z(this,this.xtag.lastTargetElem,this.orientation)},show:function(){A(this,this.xtag.lastTargetElem)},hide:function(){B(this)},toggle:function(){this.hasAttribute("visible")?this.hide():this.show()}}})}();
>>>>>>> default skin wip
=======
})();
>>>>>>> default skin wip
