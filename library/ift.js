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


  // Utility
  // -------

  ift.util = {};

  var debug = ift.util.debug = function() {
    console.log.apply(console, [document.title].concat([].slice.call(arguments, 0)));
  };

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
    this.message = "[JSONRPCError] " + message;
  };

  JSONRPCError.prototype = Error.prototype;

  // Events
  // ------

  // (ref `Backbone.Events`)
  // A module that can be mixed in to any object to provide it with custom events.
  var Events = ift.Events = {

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

  // Transport
  // ---------

  // Base class for wrapping `iframe#postMessage`.
  var Transport = function(targetOrigins) {
    this.readyState = 0;
    this.targetOrigins = {};
    for (var i = 0; i < (targetOrigins || []).length; i++) {
      this.targetOrigins[targetOrigins[i]] = 1;
    }
    this.listen();
  };

  mixin(Transport.prototype, Events, {

    ready: function(callback, context) {
      var transport = this;
      context || (context = this);
      if (this.isReady()) {
        callback.call(context, this);
      } else {
        this.on('ready', function() {
          callback.call(context, transport)
        });
      }
    },

    // Proxy `window.onmessage` into internal event and verifying security.
    listen: function() {
      var transport = this;
      support.on(window, 'message', this.onMessage = function(evt) {
        if (!transport.targetOrigins[evt.origin]) return;
        transport.trigger('incoming', evt.data);
      });
    },

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

  // ParentTransport
  // ---------------

  // Implement the transport class from the parent's perspective.
  var ParentTransport = Transport.extend({

    constructor: function(childOrigin, childPath) {
      this.id = uniqueId('ift');
      this.childOrigin = childOrigin || 'http://localhost:8000';
      this.childUri = childOrigin + childPath || '/child.html';
      this._createIframe(this.childUri, this.id);

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

    _createIframe: function(uri, id) {
      var iframe = this.iframe = document.getElementById(id);
      if (iframe) return;

      iframe = this.iframe = document.createElement('iframe');
      iframe.id = id;
      iframe.name = id;
      iframe.style.position = 'absolute';
      iframe.style.top = '-2000px';
      iframe.style.left = '0px';
      iframe.src = uri;
      iframe.border = iframe.frameBorder = 0;
      iframe.allowTransparency = true;

      domready(function() {
        document.body.appendChild(iframe);
      });
    }

  });

  // ChildTransport
  // --------------

  // Implement the transport class from the child's perspective.
  var ChildTransport = Transport.extend({

    constructor: function() {
      if (window.parent !== window) this.parent = window.parent;
      Transport.apply(this, arguments);
    },

    listen: function() {
      var transport = this;
      domready(function() {
        transport.readyState = 1;
        transport.trigger('ready');
        transport.send('ready');
      });
      Transport.prototype.listen.apply(this, arguments);
    },

    send: function(message) {
      if (this.parent) {
        this.parent.postMessage(message, '*');
        this.trigger('outgoing', message);
      }
    }

  });

  // Channel
  // -------

  // Facilitate multiplexed JSON-RPC.
  var Channel = function(namespace, transport) {
    this.id = namespace;
    this.transport = transport;
    this._callbacks = {};

    this.transport.on('incoming', function(message) {
      message = this.deserialize(message);
      if (!message || message.channel !== this.id) return;
      if (message.data.error) {
        throw new JSONRPCError(message.data.error.code, message.data.error.message);
      } else {
        this.process(message.data);
      }
    }, this);
  };

  mixin(Channel.prototype, Events, {

    // Send a JSON-RPC-structured message over this channel.
    send: function(data) {
      data || (data = {});
      var message = {
        channel: this.id,
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

    // Send an error message.
    error: function(code, message) {
      this.send({
        id: null,
        error: {
          code: code,
          message: message
        }
      });
    },

    // Signal a request or resolve a callback with response.
    // TODO: handle notifications.
    process: function(data) {
      if (data.method) {
        try { this.trigger('request', data.id, data.method, data.params); }
        catch (e) { this.error(e.code, e.message); }
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
      try {
        return support.structuredClones ? message : JSON.parse(message);
      } catch (e) { return; }
    },

    destroy: function() {
      this.off();
    }

  });

  // Service
  // -------

  // Base class for implementing a service provider or consumer. Provides methods
  // for sending a request or response to be routed over a given channel.
  var Service = function(channel) {
    this.channel = channel;
  };

  mixin(Service.prototype, Events);

  Service.extend = extend;

  // Manager
  // -------

  var Manager = function(transport, services) {
    this.transport = transport;

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

    service: function(namespace, serviceCtor) {
      if (!namespace) throw new Error("Cannot create a service without a namespace");
      serviceCtor || (serviceCtor = ift.Service);

      var channel = new Channel(namespace, this.transport);
      var service = new serviceCtor(channel);

      channel.on('request', function(id, method, params) {
        var isArray, result, error;
        try {
          isArray = Object.prototype.toString.call(params) === '[object Array]';
          result = isArray ? service[method].apply(service, params) : service[method](params);
        } catch (e) {
          error = {
            code: e.code,
            message: e.stack
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

  // API
  // ---

  mixin(ift, {

    Transport: Transport,

    Channel: Channel,

    Service: Service,

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

    // Helper for declaring a service under a namespace.
    service: function(namespace, ctor) {
      return {
        namespace: namespace,
        ctor: ctor
      };
    }

  });

  return ift;

}));
