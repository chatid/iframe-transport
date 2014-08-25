/*
 * IFrameTransport
 *
 * Invoke methods with callbacks and trigger events across domains.
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

  var support = ift.support = {};

  // http://peter.michaux.ca/articles/feature-detection-state-of-the-art-browser-scripting
  support.has = function(object, property){
    var t = typeof object[property];
    return t == 'function' || (!!(t == 'object' && object[property])) || t == 'unknown';
  }

  if (support.has(window, 'addEventListener')) {
    support.on = function(target, name, callback) {
      target.addEventListener(name, callback, false);
    }
    support.off = function(target, name, callback) {
      target.removeEventListener(name, callback, false);
    }
  } else if (support.has(window, 'attachEvent')) {
    support.on = function(object, name, callback) {
      object.attachEvent('on' + name, function() { callback(window.event) });
    }
    support.off = function(object, name, callback) {
      object.detachEvent('on' + name, function() { callback(window.event) });
    }
  }


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

  // Transport
  // ---------

  // Base class for wrapping `iframe#postMessage` to facilitate method invocations and
  // callbacks and trigger events.
  var Transport = function(targetOrigins) {
    this.targetOrigins = {};
    for (var i = 0; i < (targetOrigins || []).length; i++) {
      this.targetOrigins[targetOrigins[i]] = 1;
    }
    this.listen();
  };

  mixin(Transport.prototype, Events, {

    // Parse and trigger an event for listening clients to act on.
    listen: function() {
      var transport = this, message, name;
      support.on(window, 'message', this.onMessage = function(evt) {
        if (!transport.targetOrigins[evt.origin]) return;
        try { message = JSON.parse(evt.data); }
        catch (e) { return; }
        name = message.channel + ':' + message.action;
        transport.trigger.apply(transport, [name].concat(message.args));
      });
    },

    client: function(name) {
      var clients = '_' + this.role + 'Clients';
      return new (ift[clients][name] || Client)(this);
    },

    destroy: function() {
      support.off(window, 'message', this.onMessage);
      this.off();
    },

    // Send a `postMessage` that invokes a method. Optionally include a `callbackId` if a
    // callback is provided.
    _sendInvoke: function(channel, method, args, callback) {
      var params = {
        channel: channel,
        action: 'method',
        args: [method].concat(args)
      };
      if (typeof callback === 'function') {
        params.args.push({ callbackId: this._createCallback(callback) });
      }

      this.send(params);
    },

    // Send a `postMessage` that triggers an event.
    _sendTrigger: function(channel, name, args) {
      var params = {
        channel: channel,
        action: 'event',
        args: [name].concat(args)
      };

      this.send(params);
    },

    // Send a `postMessage` that invokes a callback.
    _sendCallback: function(channel, callbackId, args) {
      var params = {
        channel: channel,
        action: 'callback',
        args: [callbackId].concat(args)
      };

      this.send(params);
    },

    // Associate a unique `callbackId` with the given callback function.
    _createCallback: function(callback) {
      this._callbacks = this._callbacks || {};
      this._counter = this._counter || 0;
      this._callbacks[++this._counter] = callback;
      return this._counter;
    }

  });

  // Client
  // ------

  // Base class for defining client APIs that may communicate over the iframe transport.
  // Clients may invoke methods with callbacks and trigger events.
  var Client = function(transport) {
    this.transport = transport;

    // Listen for incoming actions to be processed by this client.
    this.transport.on(this.channel + ':method', this._receiveInvoke, this);
    this.transport.on(this.channel + ':event', this._receiveTrigger, this);
    this.transport.on(this.channel + ':callback', this._receiveCallback, this);
  };

  // Client instance methods for sending actions or processing incoming actions.
  mixin(Client.prototype, Events, {

    channel: 'default',

    // Send a method invocation, callback, or event.
    send: function(action) {
      var args = slice.call(arguments, 1),
          camel = function(match, letter) { return letter.toUpperCase() },
          sendMethod = '_send' + action.replace(/^(\w)/, camel);
      args = [this.channel].concat(args);
      this.transport[sendMethod].apply(this.transport, args);
    },

    destroy: function() {
      this.off();
    },

    // Process an incoming method invocation.
    _receiveInvoke: function(method) {
      var args = slice.call(arguments, 1), last = args[args.length - 1];
      var result = this[method].apply(this, args);
      if (last && last.callbackId) this.send('callback', last.callbackId, [result]);
    },

    // Process an incoming event.
    _receiveTrigger: function() {
      this.trigger.apply(this, arguments);
    },

    // Process an incoming callback.
    _receiveCallback: function(id) {
      var callback = this.transport._callbacks[id];
      var args = slice.call(arguments, 1);
      if (!callback) return;
      callback.apply(this, args);
      this.transport._callbacks[id] = null;
    }

  });

  // Set up inheritance for the transport and client.
  Transport.extend = Client.extend = extend;

  // Local
  // -----

  // Implement the transport class from the local's perspective.
  var Local = Transport.extend({

    constructor: function(name, remoteOrigin, remotePath, callback) {
      this.name = name || 'default';
      this.remoteOrigin = remoteOrigin || 'http://localhost:8000';
      this.remoteUri = remoteOrigin + remotePath || '/remote.html';
      this.iframe = this._createIframe(this.remoteUri, this.name, callback);

      Transport.call(this, [remoteOrigin]);
    },

    role: 'local',

    send: function(params) {
      var message = JSON.stringify(params);
      this.iframe.contentWindow.postMessage(message, this.remoteOrigin);
    },

    destroy: function() {
      Transport.prototype.destroy.apply(this, arguments);
      this.iframe.parentNode.removeChild(this.iframe);
    },

    _createIframe: function(uri, name, callback) {
      var iframe = document.getElementById('ift_' + name);
      if (iframe) {
        setTimeout(callback, 0);
        return iframe;
      }

      iframe = document.createElement('iframe');
      iframe.id = 'ift_' + name;
      iframe.name = 'ift_' + name;
      iframe.style.position = 'absolute';
      iframe.style.top = '-2000px';
      iframe.style.left = '0px';
      iframe.src = uri;
      iframe.border = iframe.frameBorder = 0;
      iframe.allowTransparency = true;

      this.on('ift:ready', function ready() {
        this.off('ift:ready', ready, this);
        if (typeof callback === 'function') callback(this);
      }, this);

      document.body.appendChild(iframe);

      return iframe;
    }

  });

  // Remote
  // ------

  // Implement the transport class from the remote's perspective.
  var Remote = Transport.extend({

    constructor: function() {
      if (window.parent !== window) this.parent = window.parent;

      Transport.apply(this, arguments);
    },

    role: 'remote',

    send: function(params) {
      if (this.parent) {
        var message = JSON.stringify(params);
        this.parent.postMessage(message, '*');
      }
    },

    listen: function() {
      Transport.prototype.listen.apply(this, arguments);
      this.send({
        channel: 'ift',
        action: 'ready'
      });
    }

  });

  // API
  // ---

  mixin(ift, {

    local: function(options) {
      options = options || {};
      return new Local(options.name, options.remoteOrigin, options.remotePath, options.ready);
    },

    remote: function(options) {
      options = options || {};
      return new Remote(options.localOrigins);
    },

    _localClients: {},

    _remoteClients: {},

    _extendClient: function(role, name, implementation) {
      var clients = '_' + role + 'Clients';
          ctor = this[clients][name] || Client;
      this[clients][name] = ctor.extend(implementation(ctor));
    },

    client: function(name, implementation) {
      this._extendClient('local', name, implementation);
      this._extendClient('remote', name, implementation);
    },

    localClient: function(name, implementation) {
      if (!implementation) return this._localClients[name];
      this._extendClient('local', name, implementation);
    },

    remoteClient: function(name, implementation) {
      if (!implementation) return this._remoteClients[name];
      this._extendClient('remote', name, implementation);
    }

  });

  return ift;

}));
