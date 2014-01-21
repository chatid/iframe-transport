/*
 * IFrameStorage
 *
 * Persist data from any domain.
 * Targets modern browsers, IE8+
*/

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define('ift', ['domready'], factory);
  } else {
    root.IFT = factory(root.domready);
  }
}(this, function() {

  var slice = [].slice;

  var IFT = {};

  var mixin = function(obj) {
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

  var extend = function(props) {
    var parent = this;
    var child;

    if (props && support.has(props, 'constructor')) {
      child = props.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    mixin(child.prototype, props);

    return child;
  };

  var Events = {

    on: function(name, callback) {
      this._events || (this._events = {});
      (this._events[name] = this._events[name] || []).push(callback);
      return this;
    },

    off: function(name, callback) {
      if (!this._events) return this;

      var listeners = this._events[name],
          i = listeners.length;
      while (i--) {
        if (listeners[i] === callback) {
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
        listeners[i].apply(listeners[i], args);
      }
    }

  };

  var Transport = function(targetOrigin) {
    this.targetOrigin = targetOrigin;
    this._counter = 0;
    this._queue = {};
    this._clients = {};
    this._listen();
  };

  mixin(Transport.prototype, {

    invoke: function(id, method, args, callback) {
      var params = {
        type: 'method',
        id: id,
        method: method,
        args: args
      };
      if (typeof callback === 'function') {
        params.callbackId = this._addCall(callback);
      }

      this.send(params);
    },

    trigger: function(id, name, args) {
      var params = {
        type: 'event',
        id: id,
        name: name,
        args: args
      };

      this.send(params);
    },

    callback: function(callbackId, args) {
      var params = {
        type: 'callback',
        callbackId: callbackId,
        args: args
      };

      this.send(params);
    },

    client: function(id) {
      if (!this._clients[id]) {
        var ctor = IFT.Client.map(id, this.level);
        this._clients[id] = new ctor(this);
      }
      return this._clients[id];
    },

    _addCall: function(callback) {
      this._queue[++this._counter] = callback;
      return this._counter;
    },

    _listen: function() {
      var self = this;
      support.on(window, 'message', function(evt) {
        if (evt.origin == self.targetOrigin) {
          self._receive(JSON.parse(evt.data));
        }
      });
    },

    _receive: function(message) {
      switch (message.type) {
        case 'method':
          var fn = this._clients[message.id][message.method];
          var result = fn.apply(this, message.args);
          if (message.callbackId) this.callback(message.callbackId, [result]);
          break;
        case 'event':
          var args = [message.name].concat(message.args)
          var client = this._clients[message.id];
          client.trigger.apply(client, args);
          break;
        case 'callback':
          this._queue[message.callbackId].apply(this, message.args);
          this._queue[message.callbackId] = null;
          break;
      }
    }

  });

  var Client = IFT.Client = function(ift, id) {
    this.ift = ift;
    this.id = this.id || id;
  };

  mixin(Client, {

    register: function(id, level, ctor) {
      this._map = this._map || {};
      this._map[id] = this._map[id] || {};
      this._map[id][level] = ctor;
    },

    map: function(id, level) {
      var ctor;
      if (this._map && this._map[id] && (ctor = this._map[id][level])) {
        return ctor;
      }
    }

  });

  mixin(Client.prototype, Events, {

    send: function(method) {
      var args = slice.call(arguments, 1);
      args = [this.id].concat(args);
      this.ift[method].apply(this.ift, args);
    }

  });

  Transport.extend = Client.extend = extend;

  var Parent = IFT.Parent = Transport.extend({

    constructor: function(childOrigin, path, name, callback) {
      this.childOrigin = childOrigin;
      this.childUri = childOrigin + path;
      this.name = name;
      this.iframe = this._createIframe(this.childUri, this.name, callback);

      Transport.apply(this, arguments);
    },

    level: 'parent',

    send: function(params) {
      var message = JSON.stringify(params);
      this.iframe.contentWindow.postMessage(message, this.childOrigin);
    },

    _createIframe: function(uri, name, callback) {
      var iframe = document.createElement('iframe');
      iframe.id = 'ift_' + name;
      iframe.name = 'ift_' + name;
      iframe.style.position = 'absolute';
      iframe.style.top = '-2000px';
      iframe.style.left = '0px';
      iframe.src = uri;
      iframe.border = iframe.frameBorder = 0;
      iframe.allowTransparency = true;

      support.on(iframe, 'load', callback);

      document.body.appendChild(iframe);

      return iframe;
    }

  });

  var Child = IFT.Child = Transport.extend({

    constructor: function(parentOrigin, client) {
      this.parentOrigin = parentOrigin;
      this.parent = window.parent;

      Transport.apply(this, arguments);
    },

    level: 'child',

    send: function(params) {
      var message = JSON.stringify(params);
      this.parent.postMessage(message, this.parentOrigin);
    }

  });

  return IFT;

}));
