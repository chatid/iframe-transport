/*
 * IFrameStorage
 *
 * Persist data from any domain.
 * Targets modern browsers, IE8+
*/

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['domready'], factory);
  } else {
    root.IFS = factory(root.domready);
  }
}(this, function() {

  // http://peter.michaux.ca/articles/feature-detection-state-of-the-art-browser-scripting
  function has(object, property){
    var t = typeof object[property];
    return t == 'function' || (!!(t == 'object' && object[property])) || t == 'unknown';
  }

  var support = {
    storageEventTarget: ('onstorage' in document ? document : window)
  };

  if (has(window, 'addEventListener')) {
    support.on = function(target, name, callback) {
      target.addEventListener(name, callback, false);
    }
    support.off = function(target, name, callback) {
      target.removeEventListener(name, callback, false);
    }
  } else if (has(window, 'attachEvent')) {
    support.on = function(object, name, callback) {
      object.attachEvent('on' + name, callback);
    }
    support.off = function(object, name, callback) {
      object.detachEvent('on' + name, callback);
    }
  }

  var IFS = {};

  IFS.Parent = function(childOrigin, path, name, callback) {
    this.childOrigin = childOrigin;
    this.childUri = childOrigin + path;
    this.name = name;
    this.iframe = this._createIframe(this.childUri, this.name, callback);

    this._counter = 0;
    this._queue = {};

    this._listen();
  };

  IFS.Parent.prototype = {

    get: function(key, callback) {
      this._callMethod('get', [key], callback);
    },

    set: function(key, value, options, callback) {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }

      this._callMethod('set', [key, value, options], callback);
    },

    unset: function(key, callback) {
      this._callMethod('unset', [key], callback);
    },

    _listen: function() {
      var self = this;
      support.on(window, 'message', function(evt) {
        if (evt.origin == self.childOrigin) {
          self._receiveMessage(JSON.parse(evt.data));
        }
      });
    },

    _addCall: function(callback) {
      this._queue[++this._counter] = callback;
      return this._counter;
    },

    _callMethod: function(method, args, callback) {
      var params = {
        method: method,
        args: args
      };
      if (typeof callback === 'function') {
        params.id = this._addCall(callback);
      }

      var message = JSON.stringify(params);
      this.iframe.contentWindow.postMessage(message, this.childOrigin);
    },

    _receiveMessage: function(message) {
      switch (message.type) {
        case 'callback':
          this._queue[message.id].apply(this, message.args);
          this._queue[message.id] = null;
          break;
      }
    },

    _createIframe: function(uri, name, callback) {
      var iframe = document.createElement('iframe');
      iframe.id = 'ifs_' + name;
      iframe.name = 'ifs_' + name;
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

  };

  IFS.Child = function(parentOrigin) {
    this.parent = window.parent;
    this.parentOrigin = parentOrigin;

    this._listen();
  };

  IFS.Child.prototype = {

    get: function(key) {
      return localStorage.getItem(key);
    },

    set: function(key, value, options) {
      return localStorage.setItem(key, value);
    },

    unset: function(key) {
      return localStorage.removeItem(key);
    },

    _listen: function() {
      var self = this;
      support.on(window, 'message', function(evt) {
        if (evt.origin == self.parentOrigin) {
          self._receiveMessage(JSON.parse(evt.data));
        }
      });

      var target = support.storageEventTarget;
      support.on(target, 'storage', function(evt) {
        console.log('storage evt', evt);
      });
    },

    _fireCallback: function(id, result) {
      var params = {
        type: 'callback',
        id: id,
        args: [result]
      };

      var message = JSON.stringify(params);
      this.parent.postMessage(message, this.parentOrigin);
    },

    _receiveMessage: function(message) {
      var id = message.id,
          method = message.method,
          args = message.args || [];

      if (!method || !this[method])
        return;

      var result = this[method].apply(this, args);

      if (id !== undefined && id !== null) this._fireCallback(id, result);
    }

  };

  return IFS;

}));
