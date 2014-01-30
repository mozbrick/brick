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

(function(global) {
    var registrationsTable = new WeakMap();
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
    if (!global.MutationObserver && global.WebKitMutationObserver) global.MutationObserver = global.WebKitMutationObserver;
    if (!global.MutationObserver) global.MutationObserver = JsMutationObserver;
})(this);

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
            element.removeAttribute("unresolved");
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
            if (prototype.setAttribute._polyfilled) {
                return;
            }
            var setAttribute = prototype.setAttribute;
            prototype.setAttribute = function(name, value) {
                changeAttribute.call(this, name, value, setAttribute);
            };
            var removeAttribute = prototype.removeAttribute;
            prototype.removeAttribute = function(name) {
                changeAttribute.call(this, name, null, removeAttribute);
            };
            prototype.setAttribute._polyfilled = true;
        }
        function changeAttribute(name, value, operation) {
            var oldValue = this.getAttribute(name);
            operation.apply(this, arguments);
            var newValue = this.getAttribute(name);
            if (this.attributeChangedCallback && newValue !== oldValue) {
                this.attributeChangedCallback(name, oldValue, newValue);
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
    function _removed(element) {
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
                    if (!n.localName) {
                        return;
                    }
                    addedNode(n);
                });
                forEach(mx.removedNodes, function(n) {
                    if (!n.localName) {
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

(function(scope) {
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
    if (document.readyState === "complete" || scope.flags.eager) {
        bootstrap();
    } else if (document.readyState === "interactive" && !window.attachEvent && (!window.HTMLImports || window.HTMLImports.ready)) {
        bootstrap();
    } else {
        var loadEvent = window.HTMLImports ? "HTMLImportsLoaded" : "DOMContentLoaded";
        window.addEventListener(loadEvent, bootstrap);
    }
})(window.CustomElements);

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
        if (!target.tagName) return null;
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
            if (tag.lifecycle.removed) tag.prototype.leftViewCallback = {
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
        if (isValidDateObj(s)) {
            return s;
        }
        var d = ISO_DATE_REGEX.exec(s);
        if (d) {
            return normalize(new Date(d[1], d[2] - 1, d[3]));
        } else {
            return null;
        }
    }
    function parseSingleDate(dateStr) {
        if (isValidDateObj(dateStr)) {
            return dateStr;
        }
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
                    return null;
                }
            } catch (err) {
                var parsedSingle = parseSingleDate(multiDateStr);
                if (parsedSingle) {
                    return [ parsedSingle ];
                } else {
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
                    return null;
                }
                ranges[i] = parsedDate;
            } else if (isArray(range) && range.length === 2) {
                var parsedStartDate = parseSingleDate(range[0]);
                if (!parsedStartDate) {
                    return null;
                }
                var parsedEndDate = parseSingleDate(range[1]);
                if (!parsedEndDate) {
                    return null;
                }
                if (parsedStartDate.valueOf() > parsedEndDate.valueOf()) {
                    return null;
                }
                ranges[i] = [ parsedStartDate, parsedEndDate ];
            } else {
                return null;
            }
        }
        return ranges;
    }
    function from(base, y, m, d) {
        if (y === undefined) {
            y = getYear(base);
        }
        if (m === undefined) {
            m = getMonth(base);
        }
        if (d === undefined) {
            d = getDate(base);
        }
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
        if (!matches) {
            return;
        }
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
        if (!isValidDateObj(d)) {
            throw "Invalid view date!";
        }
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
            cDate = nextDay(cDate);
            if ((step + 1) % 7 === 0) {
                appendChild(monthEl, week);
                week = makeEl("div.week");
                var done = getMonth(cDate) > month || getMonth(cDate) < month && getYear(cDate) > getYear(sDate);
                if (done) {
                    break;
                }
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
        if (!this._customRenderFn) {
            return;
        }
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
                    if (!(labelType in newLabelData)) {
                        continue;
                    }
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
    function _onDragEnd() {
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
                if (e.baseEvent) {
                    e.baseEvent.preventDefault();
                }
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
            "mouseout:delegate(.day)": function() {
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
                    if (prevControl) {
                        prevControl.textContent = labels.prev;
                    }
                    var nextControl = this.querySelector(".controls > .next");
                    if (nextControl) {
                        nextControl.textContent = labels.next;
                    }
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
        this._validatorFn = validatorFn ? validatorFn : function() {
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
        if (!deck.xtag._initialized) {
            return;
        }
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
            "show:delegate(x-card)": function() {
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
    function reveal(e) {
        var flipBox = e.currentTarget;
        if (this.parentNode == flipBox) {
            if (this.parentNode.firstElementChild == this) {
                flipBox.flipped = false;
            } else if (this.parentNode.lastElementChild == this) {
                flipBox.flipped = true;
            }
        }
    }
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
            "transitionend:delegate(x-flipbox > *:first-child)": function(e) {
                var flipBox = e.currentTarget;
                if (this.parentNode == flipBox) {
                    xtag.fireEvent(flipBox, "flipend");
                }
            },
            "reveal:delegate(x-flipbox > *)": reveal
        },
        accessors: {
            direction: {
                attribute: {},
                get: function() {
                    return this.xtag._direction;
                },
                set: function(value) {
                    var self = this;
                    xtag.skipTransition(this.firstElementChild, function() {
                        self.setAttribute("_anim-direction", value);
                        return function() {};
                    });
                    xtag.skipTransition(this.lastElementChild, function() {
                        self.setAttribute("_anim-direction", value);
                    });
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
        if (!first) {
            return {
                header: null,
                section: null,
                footer: null
            };
        }
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
            if (elements.header) {
                elements.section.style.marginTop = "-" + elements.header.getBoundingClientRect().height + "px";
            }
            if (elements.footer) {
                elements.section.style.marginBottom = "-" + elements.footer.getBoundingClientRect().height + "px";
            }
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
                if (now > scroll.last) {
                    scroll.min = Math.max(now - buffer, buffer);
                } else if (now < scroll.last) {
                    scroll.max = Math.max(now + buffer, buffer);
                }
                if (!layout.maxcontent) {
                    if (now > scroll.max && !layout.hasAttribute("content-maximized")) {
                        maxContent(layout, elements);
                    } else if (now < scroll.min) {
                        minContent(layout, elements);
                    }
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
                        if (!layout.maxcontent) {
                            minContent(layout, elements);
                        }
                    } else {
                        maxContent(layout, elements);
                    }
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
                    if (value) {
                        maxContent(this, elements);
                    } else if (!this.hasAttribute("content-maximizing")) {
                        minContent(this, elements);
                    }
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
        if (!slides || !slides.children.length || slides.tagName.toLowerCase() != "x-slides") {
            return;
        }
        var children = xtag.toArray(slides.children);
        var size = 100 / (children.length || 1);
        var orient = this.getAttribute("orientation") || "x";
        var style = orient == "x" ? [ "width", "height" ] : [ "height", "width" ];
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
            if (selected) {
                slide(this, children.indexOf(selected) || 0);
            }
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
            "reveal:delegate(x-slidebox > x-slides > x-slide)": function(e) {
                var slide = e.target;
                if (e.target.parentNode.parentNode == e.currentTarget) {
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
                if (ancestor.tagName.toLowerCase() == "x-slidebox") {
                    init.call(ancestor, true);
                }
            },
            created: function() {
                if (this.parentNode) {
                    var ancestor = this.parentNode.parentNode;
                    if (ancestor.tagName.toLowerCase() == "x-slidebox") {
                        init.call(ancestor, true);
                    }
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
        var vertical = slider.vertical;
        var sliderWidth = sliderRect[vertical ? "height" : "width"];
        var thumbWidth = thumbRect[vertical ? "height" : "width"];
        var availableWidth = Math.max(sliderWidth - thumbWidth, 0);
        var newThumbX = availableWidth * fraction;
        var finalPercentage = newThumbX / sliderWidth;
        thumb.style[vertical ? "left" : "top"] = 0;
        thumb.style[vertical ? "top" : "left"] = finalPercentage * 100 + "%";
    }
    function _redraw(slider) {
        _positionThumb(slider, slider.value);
    }
    function _onMouseInput(slider, pageX, pageY) {
        var inputEl = slider.xtag.rangeInputEl;
        var inputOffsets = inputEl.getBoundingClientRect();
        var inputClickX = pageX - inputOffsets.left;
        var divideby = inputOffsets.width;
        if (slider.vertical) {
            divideby = inputOffsets.height;
            inputClickX = pageY - inputOffsets.top;
        }
        slider.value = _fractionToCorrectedVal(slider, inputClickX / divideby);
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
                        if (!this.xtag.polyFillSliderTrack) {
                            var sliderTrack = document.createElement("div");
                            xtag.addClass(sliderTrack, "slider-track");
                            this.xtag.polyFillSliderTrack = sliderTrack;
                            this.appendChild(sliderTrack);
                        }
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
            vertical: {
                attribute: {
                    "boolean": true
                },
                set: function() {
                    _redraw(this);
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
            "tap:delegate(x-tabbar-tab)": function() {
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
        if (form) {
            toggle.removeAttribute("x-toggle-no-form");
        } else {
            toggle.setAttribute("x-toggle-no-form", "");
        }
        toggle.xtag.scope = toggle.parentNode ? form || document : null;
    }
    function updateScope(scope) {
        var names = {};
        var docSelector = scope == document ? "[x-toggle-no-form]" : "";
        xtag.query(scope, "x-toggle[name]" + docSelector).forEach(function(toggle) {
            var name = toggle.name;
            if (name && !names[name]) {
                var named = xtag.query(scope, 'x-toggle[name="' + name + '"]' + docSelector);
                var type = named.length > 1 ? "radio" : "checkbox";
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
        "focus:delegate(x-toggle)": function() {
            this.setAttribute("focus", "");
        },
        "blur:delegate(x-toggle)": function() {
            this.removeAttribute("focus");
        },
        "tap:delegate(x-toggle)": function() {
            if (shifted && this.group) {
                var toggles = this.groupToggles;
                var selector = 'x-toggle[group="' + this.group + '"][active]';
                var active = this.xtag.scope.querySelector(selector);
                if (active && this != active) {
                    var self = this;
                    var state = active.checked;
                    var index = toggles.indexOf(this);
                    var activeIndex = toggles.indexOf(active);
                    var minIndex = Math.min(index, activeIndex);
                    var maxIndex = Math.max(index, activeIndex);
                    toggles.slice(minIndex, maxIndex).forEach(function(toggler) {
                        if (toggler != self) {
                            toggler.checked = state;
                        }
                    });
                }
            }
        },
        "change:delegate(x-toggle)": function() {
            var selector = 'x-toggle[group="' + this.group + '"][active]';
            var active = this.xtag.scope.querySelector(selector);
            if (shifted && active && this != active) {
                this.checked = active.checked;
            } else {
                this.checked = this.xtag.inputEl.checked;
            }
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
                if (name) {
                    this.xtag.inputEl.name = this.getAttribute("name");
                }
                if (this.hasAttribute("checked")) {
                    this.checked = true;
                }
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
                if (this.name) {
                    updateScope(this.xtag.scope);
                }
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
                        if (previous) {
                            previous.removeAttribute("checked");
                        }
                    }
                    this.xtag.inputEl.checked = state;
                    if (state) {
                        this.setAttribute("checked", "");
                    } else {
                        this.removeAttribute("checked");
                    }
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
        custom: function() {
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
        var targetTriggerFn = function() {
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
            if (!bounds) {
                bounds = contextRect;
            }
        }
        return bounds;
    }
    function _pickBestTooltipOrient(tooltip, validPositionDataList) {
        if (validPositionDataList.length === 0) {
            return null;
        }
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
        if (!bestOrient) {
            bestOrient = "top";
        }
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
                _forceDisplay(tooltip);
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
                set: function() {
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
})();