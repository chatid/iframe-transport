/*
 * ift.js
 *
 * Bi-directional RPC over iframe
 * Targets modern browsers, IE8+
*/

(function (root, factory) {
  if (typeof define === 'function' && define.amd) define('ift', factory);
  else if (typeof exports === 'object') module.exports = factory();
  else root.ift = factory();
}(this, function() {

  var slice = [].slice;

  var ift = {};

  // Support
  // -------

  var support = ift.support = {
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
        window.postMessage({ toString: function () { structuredClones = false; } }, '*');
      } catch (e) {}
      return structuredClones;
    })()
  };


  // Utility
  // -------

  ift.util = {};

  // (ref `_.extend`)
  // Extend a given object with all the properties of the passed-in object(s).
  var mixin = ift.util.mixin = function(obj) {
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
  }

  // (ref Backbone `extend`)
  // Helper function to correctly set up the prototype chain, for subclasses.
  var extend = ift.util.extend = function(protoProps, staticProps) {
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

  // (ref `_.uniqueId`)
  var idCounter = 0;
  var uniqueId = ift.util.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // Errors
  // ------

  var JSONRPCError = function(code, message) {
    this.code = code;
    this.message = message;
  };

  JSONRPCError.prototype = Error.prototype;

  // Events
  // ------

  // (ref `Backbone.Events`)
  // A module that can be mixed in to any object to provide it with custom events.
  var Events = ift.Events = {

    on: function(name, callback, context) {
      this._events || (this._events = {});
      (this._events[name] = this._events[name] || []).push({
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

  // Courier
  // -------

  // Manage services and consumers that communicate over a given transport.
  var Courier = function(transport) {
    this.transport = transport;
  };

  mixin(Courier.prototype, Events, {

    channel: function(name) {
      return new Channel(name, this.transport);
    },

    // Factory function for services, configured with a channel and transport.
    service: function(channel) {
      channel = this.channel(channel);
      var ctor = ift._services[channel.name] || Service;
      return new ctor(channel);
    },

    // Factory function for consumers, configured with a channel and transport.
    consumer: function(channel) {
      channel = this.channel(channel);
      var ctor = ift._consumers[channel.name] || Service;
      return new ctor(channel);
    },

    // Sugar for hooking transport readiness.
    ready: function(callback) {
      var once;
      this.transport.on('message', once = function(message) {
        if (message !== 'ready') return;
        callback(this);
        this.off('message', once, this);
      }, this);
      return this;
    },

    wiretap: function(callback) {
      this.transport.on('message', function(message) {
        callback('incoming', message);
      }, this);
      var send = this.transport.send;
      var transport = this.transport;
      this.transport.send = function(message) {
        callback('outgoing', message);
        send.apply(transport, arguments);
      };
      return this;
    },

    destroy: function() {
      this.transport.destroy();
      this.off();
    }

  });

  // Transport
  // ---------

  // Base class for wrapping `iframe#postMessage`.
  var Transport = function(targetOrigins) {
    this.targetOrigins = {};
    for (var i = 0; i < (targetOrigins || []).length; i++) {
      this.targetOrigins[targetOrigins[i]] = 1;
    }
    this.listen();
  };

  mixin(Transport.prototype, Events, {

    // Proxy `window.onmessage` into internal event and verifying security.
    listen: function() {
      var transport = this;
      support.on(window, 'message', this.onMessage = function(evt) {
        if (!transport.targetOrigins[evt.origin]) return;
        transport.trigger('message', evt.data);
      });
    },

    destroy: function() {
      support.off(window, 'message', this.onMessage);
      this.off();
    }

  });

  Transport.extend = extend;

  // Parent
  // ------

  // Implement the transport class from the parent's perspective.
  var Parent = Transport.extend({

    constructor: function(name, childOrigin, childPath) {
      this.name = name || 'default';
      this.childOrigin = childOrigin || 'http://localhost:8000';
      this.childUri = childOrigin + childPath || '/child.html';
      this.iframe = this._createIframe(this.childUri, this.name);

      Transport.call(this, [childOrigin]);
    },

    send: function(message) {
      this.iframe.contentWindow.postMessage(message, this.childOrigin);
    },

    destroy: function() {
      Transport.prototype.destroy.apply(this, arguments);
      this.iframe.parentNode.removeChild(this.iframe);
    },

    _createIframe: function(uri, name) {
      var iframe = document.getElementById('ift_' + name);
      if (iframe) return iframe;

      iframe = document.createElement('iframe');
      iframe.id = 'ift_' + name;
      iframe.name = 'ift_' + name;
      iframe.style.position = 'absolute';
      iframe.style.top = '-2000px';
      iframe.style.left = '0px';
      iframe.src = uri;
      iframe.border = iframe.frameBorder = 0;
      iframe.allowTransparency = true;

      document.body.appendChild(iframe);

      return iframe;
    }

  });

  // Child
  // -----

  // Implement the transport class from the child's perspective.
  var Child = Transport.extend({

    constructor: function() {
      if (window.parent !== window) this.parent = window.parent;
      Transport.apply(this, arguments);
    },

    listen: function() {
      var transport = this;
      Transport.prototype.listen.apply(this, arguments);
      transport.send('ready');
    },

    send: function(message) {
      if (this.parent) this.parent.postMessage(message, '*');
    }

  });

  // Channel
  // -------

  // Facilitate multiplexed JSON-RPC.
  var Channel = function(name, transport) {
    this.name = name || 'default';
    this.transport = transport;
    this._callbacks = {};

    this.transport.on('message', function(message) {
      try {
        try { message = this.deserialize(message); }
        catch (error) { throw new JSONRPCError(-32700, error.message); }
        if (message.channel === this.name) this.process(message.data);
      } catch (error) {
        this.send({ id: null, error: error });
      }
    }, this);
  };

  mixin(Channel.prototype, Events, {

    // Send a JSON-RPC-structured message over this channel.
    send: function(data) {
      data || (data = {});
      var message = {
        channel: this.name,
        data: mixin(data, { jsonrpc: '2.0' })
      };
      this.transport.send(this.serialize(message));
    },

    // Issue a unique requestId, associate with callback if provided, and send request.
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

    // Build and send a respnse referencing requestId and providing result or error.
    respond: function(id, result, error) {
      var data = {
        id: id
      };
      if (result) data.result = result;
      else data.error = error;
      this.send(data);
    },

    // Derive message type from data object and trigger corresponding event. Trigger
    // "response" event using callback resolved from requestId.
    process: function(data) {
      if (data.method) {
        this.trigger('request', data.id, data.method, data.params);
      } else if (data.id) {
        var callback = this._callbacks[data.id];
        callback(data.result, data.error);
        this._callbacks[data.id] = null;
      }
    },

    serialize: function(object) {
      return support.structuredClones ? object : JSON.stringify(object);
    },

    deserialize: function(message) {
      return support.structuredClones ? message : JSON.parse(message);
    },

    destroy: function() {
      this.off();
    }

  });

  // Service
  // -------

  // Base class for implementing a service or consumer. Provides methods for sending a
  // request or response to be routed over a given channel.
  var Service = function(channel) {
    this.channel = channel;

    this.channel.on('request', this._request, this);
  };

  mixin(Service.prototype, Events, {

    // Perform request, applying params as arguments if it's an array. Fill result or
    // catch an error and submit a response.
    _request: function(id, method, params) {
      var isArray, result, error;
      try {
        isArray = Object.prototype.toString.call(params) === '[object Array]';
        result = isArray ? this[method].apply(this, params) : this[method](params);
      } catch (e) { error = { code: e.code, message: e.message }; }
      if (id) this.channel.respond(id, result, error);
    }

  });

  Service.extend = extend;

  // API
  // ---

  mixin(ift, {

    Service: Service,

    // Factory function for creating appropriate transport for a courier.
    connect: function(options) {
      var transport;
      options || (options = {});
      if (options.childPath) {
        transport = new Parent(options.name, options.childOrigin, options.childPath);
      } else {
        transport = new Child(options.trustedOrigins);
      }
      return new Courier(transport);
    },

    // Lookup service constructor named `channel` in `#_services` registry.
    service: function(channel) {
      return this._services[channel];
    },

    // Lookup consumer constructor named `channel` in `#_consumers` registry.
    consumer: function(channel) {
      return this._consumers[channel];
    },

    // Register service and consumer constructors in global registry.
    register: function(channel, service, consumer) {
      this.registerService(channel, service);
      this.registerConsumer(channel, consumer);
      return this;
    },

    // Register service constructor in global registry.
    registerService: function(channel, service) {
      return this._services[channel] = service;
    },

    // Register consumer constructor in global registry.
    registerConsumer: function(channel, consumer) {
      return this._consumers[channel] = consumer;
    },

    // Global services registry.
    _services: {},

    // Global consumers registry.
    _consumers: {}

  });

  return ift;

}));
