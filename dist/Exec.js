(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define(factory);
	else if(typeof exports === 'object')
		exports["Exec"] = factory();
	else
		root["Exec"] = factory();
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
	    slice = [].slice;

	var Exec = Service.extend({

	  constructor: function(channel, deps) {
	    this.deps = deps || [];
	    Service.apply(this, arguments);
	  },

	  code: function(code) {
	    this.channel.request('_code', [code.toString()]);
	  },

	  log: function() {
	    this.channel.request('_log', slice.call(arguments));
	  },

	  _code: function(code) {
	    var exec = this, deps = 'exec';
	    for (var i = 0; i < this.deps.length; i++) {
	      deps += ', this.deps[' + i + ']';
	    }
	    eval('(' + code + ')(' + deps + ')');
	  },

	  _log: function() {
	    try {
	      console.log.apply(console, arguments);
	    } catch (e) {
	      console.log(JSON.stringify(slice.call(arguments)));
	    }
	  }

	});

	module.exports = Exec;


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
/* 8 */,
/* 9 */,
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