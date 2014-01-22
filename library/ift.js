/*
 * IFrameTransport
 *
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

    if (props && props.hasOwnProperty('constructor')) {
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

    on: function(name, callback, context) {
      this._events || (this._events = {});
      (this._events[name] = this._events[name] || []).push({
        callback: callback,
        context: context || this
      });
      return this;
    },

    off: function(name, callback, context) {
      if (!this._events) return this;

      var listeners = this._events[name],
          i = listeners.length;
      while (i--) {
        if (listeners[i].callback === callback) {
          if (listeners[i].context === context) {
            listeners.splice(i, 1);
          }
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

  var Transport = function(targetOrigin) {
    this.targetOrigin = targetOrigin;
    this._listen();
  };

  mixin(Transport.prototype, Events, {

    client: function(target) {
      this._clients = this._clients || {};
      if (!this._clients[target]) {
        var ctor = IFT.Client.map(target, this.level);
        this._clients[target] = new ctor(this, target);
      }
      return this._clients[target];
    },

    _invoke: function(target, method, args, callback) {
      var params = {
        target: target,
        type: 'method',
        args: [method].concat(args)
      };
      if (typeof callback === 'function') {
        params.args.push({ callbackId: this._addCall(callback) });
      }

      this.send(params);
    },

    _trigger: function(target, name, args) {
      var params = {
        target: target,
        type: 'event',
        args: [name].concat(args)
      };

      this.send(params);
    },

    _callback: function(target, callbackId, args) {
      var params = {
        target: target,
        type: 'callback',
        args: [callbackId].concat(args)
      };

      this.send(params);
    },

    _addCall: function(callback) {
      this._callbacks = this._callbacks || {};
      this._counter = this._counter || 0;
      this._callbacks[++this._counter] = callback;
      return this._counter;
    },

    _listen: function() {
      var self = this;
      support.on(window, 'message', function(evt) {
        if (evt.origin == self.targetOrigin) {
          var message = JSON.parse(evt.data);
          var name = message.target + ':' + message.type;
          self.trigger.apply(self, [name].concat(message.args));
        }
      });
    }

  });

  var Client = IFT.Client = function(ift, target) {
    this.ift = ift;
    this.target = target;

    this.ift.on(this.target + ':method', this._invoke, this);
    this.ift.on(this.target + ':event', this._trigger, this);
    this.ift.on(this.target + ':callback', this._callback, this);
  };

  mixin(Client, {

    register: function(target, parent, child) {
      this._map = this._map || {};
      this._map[target] = this._map[target] || {};
      this._map[target].parent = parent;
      this._map[target].child = child;
    },

    map: function(target, level) {
      var ctor;
      if (this._map && this._map[target] && (ctor = this._map[target][level])) {
        return ctor;
      }
    }

  });

  mixin(Client.prototype, Events, {

    send: function(method) {
      var args = slice.call(arguments, 1);
      args = [this.target].concat(args);
      this.ift['_' + method].apply(this.ift, args);
    },

    _invoke: function(method) {
      var args = slice.call(arguments, 1), last = args[args.length - 1];
      var result = this[method].apply(this, args);
      if (last.callbackId) this.send('callback', last.callbackId, [result]);
    },

    _trigger: function() {
      var args = slice.call(arguments, 0);
      this.trigger.apply(this, args);
    },

    _callback: function(id) {
      var args = slice.call(arguments, 1);
      this.ift._callbacks[id].apply(this, args);
      this.ift._callbacks[id] = null;
    }

  });

  Transport.extend = Client.extend = extend;

  IFT.Parent = Transport.extend({

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

  IFT.Child = Transport.extend({

    constructor: function(parentOrigin) {
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
