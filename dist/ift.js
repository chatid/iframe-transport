(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define(factory);
	else if(typeof exports === 'object')
		exports["ift"] = factory();
	else
		root["ift"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 * ift.js
	 *
	 * Bi-directional RPC over iframe
	 * Targets modern browsers, IE8+
	*/
	
	var Manager = __webpack_require__(2),
	    ParentTransport = __webpack_require__(3),
	    ChildTransport = __webpack_require__(4);
	
	module.exports = {
	
	  ParentTransport: ParentTransport,
	
	  ChildTransport: ChildTransport,
	
	  Channel: __webpack_require__(5),
	
	  Service: __webpack_require__(6),
	
	  // Factory function for creating appropriate transport.
	  parent: function(options) {
	    options || (options = {});
	    return new Manager(
	      new ParentTransport(options.childOrigin, options.childPath),
	      options.services || []
	    );
	  },
	
	  child: function(options) {
	    options || (options = {});
	    return new Manager(
	      new ChildTransport(options.trustedOrigins),
	      options.services || []
	    );
	  },
	
	  service: function(namespace, ctor) {
	    return {
	      namespace: namespace,
	      ctor: ctor
	    };
	  },
	
	  util: {
	    mixin: __webpack_require__(7),
	    debug: __webpack_require__(1)
	  }
	
	};


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var slice = [].slice;
	
	module.exports = function() {
	  var args = slice.call(arguments);
	  args.unshift(document.title);
	  console.log.apply(console, args);
	};


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var Service = __webpack_require__(6),
	    Channel = __webpack_require__(5),
	    isArray = __webpack_require__(9),
	    mixin   = __webpack_require__(7);
	
	
	var Manager = module.exports = function(transport, services) {
	  this.transport = transport;
	  services || (services = []);
	
	  this.transport.ready(function() {
	    var service;
	    this.services = [];
	    for (var i = 0; i < services.length; i++) {
	      service = services[i];
	      this.services.push(this.service(service.namespace, service.ctor));
	    }
	  }, this);
	};
	
	mixin(Manager.prototype, {
	
	  ready: function(callback) {
	    this.transport.ready(function() {
	      callback.apply(this, [this].concat(this.services));
	    }, this);
	    return this;
	  },
	
	  channel: function(namespace) {
	    return new Channel(namespace, this.transport);
	  },
	
	  service: function(namespace, serviceCtor) {
	    if (!namespace) throw new Error("Cannot create a service without a namespace");
	    serviceCtor || (serviceCtor = Service);
	
	    var channel = new Channel(namespace, this.transport);
	    var service = new serviceCtor(channel);
	
	    channel.on('request', function(id, method, params) {
	      var result, error;
	      try {
	        result = isArray(params) ? service[method].apply(service, params) : service[method](params);
	      } catch (e) {
	        error = {
	          code: -32000,
	          message: e.message,
	          data: {
	            stack: e.stack
	          }
	        };
	      }
	      if (id) channel.respond(id, result, error);
	    });
	
	    return service;
	  },
	
	  wiretap: function(callback) {
	    this.transport.wiretap(callback);
	    return this;
	  },
	
	  destroy: function() {
	    this.transport.destroy();
	  }
	
	});


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var Transport = __webpack_require__(10);
	
	// Implement the transport class from the parent's perspective.
	var ParentTransport = module.exports = Transport.extend({
	
	  constructor: function(childOrigin, childPath) {
	    this.childOrigin = childOrigin || 'http://localhost:8000';
	    this.childUri = childOrigin + childPath || '/child.html';
	    this._createIframe(this.childUri);
	
	    Transport.call(this, [childOrigin]);
	  },
	
	  listen: function() {
	    var once;
	    this.on('incoming', once = function(message) {
	      if (message !== 'ready') return;
	      this.readyState = 1;
	      this.trigger('ready');
	      this.off('incoming', once, this);
	    }, this);
	    return Transport.prototype.listen.apply(this, arguments);
	  },
	
	  send: function(message) {
	    if (!this.iframe.contentWindow) {
	      throw new Error("Parent iframe not ready, use Manager#ready or Transport#ready");
	    }
	    this.iframe.contentWindow.postMessage(message, this.childOrigin);
	    this.trigger('outgoing', message);
	  },
	
	  destroy: function() {
	    Transport.prototype.destroy.apply(this, arguments);
	    this.iframe.parentNode.removeChild(this.iframe);
	  },
	
	  _createIframe: function(uri) {
	    var iframe = this.iframe = document.createElement('iframe');
	    iframe.style.position = 'absolute';
	    iframe.style.top = '-2000px';
	    iframe.style.left = '0px';
	    iframe.src = uri;
	    iframe.border = iframe.frameBorder = 0;
	    iframe.allowTransparency = true;
	
	    document.body.appendChild(iframe);
	  }
	
	});


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var Transport = __webpack_require__(10);
	
	// Implement the transport class from the child's perspective.
	var ChildTransport = module.exports = Transport.extend({
	
	  constructor: function() {
	    if (window.parent !== window) this.parent = window.parent;
	    Transport.apply(this, arguments);
	  },
	
	  listen: function() {
	    this.readyState = 1;
	    this.trigger('ready');
	    this.send('ready');
	    Transport.prototype.listen.apply(this, arguments);
	  },
	
	  send: function(message) {
	    if (this.parent) {
	      this.parent.postMessage(message, '*');
	      this.trigger('outgoing', message);
	    }
	  }
	
	});


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var mixin    = __webpack_require__(7),
	    support  = __webpack_require__(8),
	    uniqueId = __webpack_require__(11),
	    Events   = __webpack_require__(12);
	
	var JSONRPCError = function(code, message) {
	  this.code = code;
	  this.message = '[JSONRPCError] ' + message;
	};
	
	JSONRPCError.prototype = Error.prototype;
	
	// Facilitate multiplexed JSON-RPC.
	var Channel = module.exports = function(namespace, transport) {
	  if (Channel._namespaces.indexOf(namespace) >= 0) {
	    throw new Error("Channel with namespace '" + namespace + "' already exists");
	  }
	  Channel._namespaces.push(namespace);
	
	  this.namespace = namespace;
	  this.transport = transport;
	  this._callbacks = {};
	
	  this.transport.on('incoming', this._onIncoming, this);
	};
	
	mixin(Channel, {
	
	  JSONRPCError: JSONRPCError,
	
	  reset: function() {
	    this._namespaces = [];
	  },
	
	  _namespaces: []
	
	});
	
	mixin(Channel.prototype, Events, {
	
	  // Send a JSON-RPC-structured message over this channel.
	  send: function(data) {
	    data || (data = {});
	    var message = {
	      channel: this.namespace,
	      data: mixin(data, { jsonrpc: '2.0' })
	    };
	    this.transport.send(this.serialize(message));
	  },
	
	  // Issue a unique request `id`, associate with callback if provided, and send request.
	  request: function(method, params, callback) {
	    var data = {
	      method: method,
	      params: params
	    };
	    if (typeof callback === 'function') {
	      data.id = uniqueId('request');
	      this._callbacks[data.id] = callback;
	    }
	    this.send(data);
	  },
	
	  // Build and send a response referencing request `id` and providing result or error.
	  respond: function(id, result, error) {
	    var data = {
	      id: id
	    };
	    if (result) data.result = result;
	    else data.error = error;
	    this.send(data);
	  },
	
	  serialize: function(object) {
	    return support.structuredClones ? object : JSON.stringify(object);
	  },
	
	  deserialize: function(message) {
	    try {
	      return support.structuredClones ? message : JSON.parse(message);
	    } catch (e) { return; }
	  },
	
	  destroy: function() {
	    this.off();
	  },
	
	  _onIncoming: function(message) {
	    message = this.deserialize(message);
	    if (!message || message.channel !== this.namespace) return;
	    if (message.data.error) {
	      throw new JSONRPCError(message.data.error.code, message.data.error.message);
	    } else {
	      this._processRPC(message.data);
	    }
	  },
	
	  // Signal a request or resolve a callback with response.
	  // TODO: handle notifications.
	  _processRPC: function(data) {
	    if (data.method) {
	      try {
	        this.trigger('request', data.id, data.method, data.params);
	      } catch (e) {
	        this.respond(data.id, null, {
	          code: e.code,
	          message: e.message,
	          data: {
	            stack: e.stack
	          }
	        });
	      }
	    } else if (data.id) {
	      var callback = this._callbacks[data.id];
	      callback(data.result, data.error);
	      this._callbacks[data.id] = null;
	    }
	  },
	
	});


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var mixin   = __webpack_require__(7),
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
/* 7 */
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
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var Events  = __webpack_require__(12),
	    support = __webpack_require__(8),
	    mixin   = __webpack_require__(7),
	    bind    = __webpack_require__(14),
	    extend  = __webpack_require__(13);
	
	// Base class for wrapping `iframe#postMessage`.
	var Transport = module.exports = function(targetOrigins) {
	  this.readyState = 0;
	  this.targetOrigins = targetOrigins || [];
	  this.onMessage = bind(this.onMessage, this);
	  this.listen();
	};
	
	mixin(Transport.prototype, Events, {
	
	  ready: function(callback, context) {
	    var transport = this, ready;
	    context || (context = this);
	    if (this.isReady()) {
	      callback.call(context, this);
	    } else {
	      this.on('ready', ready = function() {
	        callback.call(context, transport);
	        transport.off('ready', ready);
	      });
	    }
	  },
	
	  onMessage: function(evt) {
	    if (this.targetOrigins.indexOf(evt.origin) < 0) return;
	    this.trigger('incoming', evt.data);
	  },
	
	  // Proxy `window.onmessage` into internal event and verifying security.
	  listen: function() {
	    support.on(window, 'message', this.onMessage);
	  },
	
	  // Implemented by subclasses.
	  send: function() {},
	
	  isReady: function() {
	    return this.readyState === 1;
	  },
	
	  wiretap: function(callback) {
	    this.on('incoming', function(message) {
	      callback('incoming', message);
	    });
	    this.on('outgoing', function(message) {
	      callback('outgoing', message);
	    });
	  },
	
	  destroy: function() {
	    support.off(window, 'message', this.onMessage);
	    this.off();
	  }
	
	});
	
	Transport.extend = extend;


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	// (ref `_.uniqueId`)
	var idCounter = 0;
	var uniqueId = module.exports = function(prefix) {
	  var id = ++idCounter + '';
	  return prefix ? prefix + id : id;
	};


/***/ },
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

	var mixin = __webpack_require__(7);
	
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


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	// (ref `_.bind`)
	
	var nativeBind = Function.prototype.bind;
	
	module.exports = function (fn, ctx) {
	  if (nativeBind) return fn.bind(ctx);
	  return function() {
	    return fn.apply(ctx, arguments);
	  }
	}


/***/ }
/******/ ])
});
;
//# sourceMappingURL=ift.js.map