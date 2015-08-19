(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define(factory);
	else if(typeof exports === 'object')
		exports["IFTStorageService"] = factory();
	else
		root["IFTStorageService"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var Service = __webpack_require__(6),
	    support = __webpack_require__(8),
	    isArray = __webpack_require__(9),
	    mixin   = __webpack_require__(1);

	mixin(support, {
	  storageEventTarget: ('onstorage' in window ? window : document)
	});

	// Implement the LocalStorage service from a provider's perspective.
	var Provider = Service.extend({

	  constructor: function(channel, storage) {
	    this.listen();
	    Service.apply(this, arguments);
	  },

	  listen: function() {
	    support.on(support.storageEventTarget, 'storage', function(evt) {
	      this.onStorage(evt);
	    }, this);
	  },

	  get: function(key) {
	    return this.deserialize(localStorage.getItem(key));
	  },

	  set: function(key, value, options) {
	    return localStorage.setItem(key, this.serialize(value));
	  },

	  unset: function(keys) {
	    if (!(isArray(keys))) keys = [keys];
	    for (i = 0; i < keys.length; i++) localStorage.removeItem(keys[i]);
	  },

	  serialize: function(data) {
	    return JSON.stringify(data);
	  },

	  deserialize: function(data) {
	    try { return JSON.parse(data); }
	    catch (e) { return data; }
	  },

	  onStorage: function(evt) {
	    if (evt) {
	      // IE9+: Don't trigger if value didn't change
	      if (evt.oldValue === evt.newValue) return;
	    } else {
	      // IE8: `evt` is undefined
	      evt = {};
	    }

	    this.channel.request('trigger', ['change', {
	      key: evt.key,
	      oldValue: this.deserialize(evt.oldValue),
	      newValue: this.deserialize(evt.newValue)
	    }]);
	  },

	  destroy: function() {
	    support.off(support.storageEventTarget, 'storage', this.onStorage);
	  }

	});

	// Implement the LocalStorage service from a consumer's perspective.
	var Consumer = Service.extend({

	  get: function(key, callback) {
	    this.channel.request('get', [key], callback);
	  },

	  set: function(key, value, options, callback) {
	    if (typeof options === 'function') {
	      callback = options;
	      options = {};
	    } else {
	      options = options || {};
	    }

	    this.channel.request('set', [key, value, options], callback);
	  },

	  unset: function(keys, callback) {
	    this.channel.request('unset', [keys], callback);
	  }

	});

	module.exports = {
	  Provider: Provider,
	  Consumer: Consumer
	};


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var slice = [].slice;

	// (ref `_.extend`)
	// Extend a given object with all the properties of the passed-in object(s).
	var mixin = module.exports = function(obj) {
	  var args = slice.call(arguments, 1),
	      props;
	  for (var i = 0; i < args.length; i++) {
	    if (props = args[i]) {
	      for (var prop in props) {
	        obj[prop] = props[prop];
	      }
	    }
	  }
	  return obj;
	};


/***/ },
/* 2 */,
/* 3 */,
/* 4 */,
/* 5 */,
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var mixin   = __webpack_require__(1),
	    extend  = __webpack_require__(13),
	    Events  = __webpack_require__(12);

	// Base class for implementing a service provider or consumer. Provides methods
	// for sending a request or response to be routed over a given channel.
	var Service = module.exports = function(channel) {
	  this.channel = channel;
	};

	mixin(Service.prototype, Events);

	Service.extend = extend;


/***/ },
/* 7 */,
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var support = module.exports = {
	  // http://peter.michaux.ca/articles/feature-detection-state-of-the-art-browser-scripting
	  has: function(object, property){
	    var t = typeof object[property];
	    return t == 'function' || (!!(t == 'object' && object[property])) || t == 'unknown';
	  },
	  on: function(target, name, callback) {
	    support.has(window, 'addEventListener') ?
	      target.addEventListener(name, callback, false) :
	      target.attachEvent('on' + name, callback);
	  },
	  off: function(target, name, callback) {
	    support.has(window, 'removeEventListener') ?
	      target.removeEventListener(name, callback, false) :
	      target.detachEvent('on' + name, callback);
	  },
	  // https://github.com/Modernizr/Modernizr/pull/1250/files
	  structuredClones: (function() {
	    var structuredClones = true;
	    try {
	      window.postMessage({
	        toString: function () {
	          structuredClones = false;
	          return 'ping';
	        }
	      }, '*');
	    } catch (e) {}
	    return structuredClones;
	  })()
	};


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var toString = Object.prototype.toString;

	module.exports = Array.isArray || function(obj) {
	  return toString.call(obj) === '[object Array]';
	}


/***/ },
/* 10 */,
/* 11 */,
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	// Events
	// ------

	var slice = [].slice;

	// (ref `Backbone.Events`)
	// A module that can be mixed in to any object to provide it with custom events.
	var Events = module.exports = {
	  on: function(name, callback, context) {
	    this._events || (this._events = {});
	    (this._events[name] = this._events[name] || []).unshift({
	      callback: callback,
	      context: context || this
	    });
	    return this;
	  },

	  off: function(name, callback) {
	    if (!this._events) return this;
	    if (!name) {
	      this._events = void 0;
	      return this;
	    }
	    var listeners = this._events[name],
	        i = listeners.length,
	        listener;
	    while (i--) {
	      listener = listeners[i];
	      if (!callback || listener.callback === callback) {
	        listeners.splice(i, 1);
	      }
	    }
	  },

	  trigger: function(name) {
	    if (!this._events) return this;
	    var args = slice.call(arguments, 1);

	    var listeners = this._events[name] || [],
	        i = listeners.length;
	    while (i--) {
	      listeners[i].callback.apply(listeners[i].context, args);
	    }
	  }
	};


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	var mixin = __webpack_require__(1);

	// (ref Backbone `extend`)
	// Helper function to correctly set up the prototype chain, for subclasses.
	module.exports = function(protoProps, staticProps) {
	  var parent = this;
	  var child;

	  if (protoProps && protoProps.hasOwnProperty('constructor')) {
	    child = protoProps.constructor;
	  } else {
	    child = function(){ return parent.apply(this, arguments); };
	  }

	  mixin(child, parent, staticProps);

	  var Surrogate = function(){ this.constructor = child; };
	  Surrogate.prototype = parent.prototype;
	  child.prototype = new Surrogate;

	  mixin(child.prototype, protoProps);

	  return child;
	};


/***/ }
/******/ ])
});
;