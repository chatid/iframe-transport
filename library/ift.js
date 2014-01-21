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

  var IFT, Parent, Child;

  Parent = function(childOrigin, path, name, callback) {
    this.childOrigin = childOrigin;
    this.childUri = childOrigin + path;
    this.name = name;
    this.iframe = this._createIframe(this.childUri, this.name, callback);

    this._counter = 0;
    this._queue = {};

    this._listen();
  };

  Parent.prototype = {

    send: function(method, args, callback) {
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

  };

  Child = function(parentOrigin, client) {
    this.parent = window.parent;
    this.parentOrigin = parentOrigin;
    this.client = client;

    this._listen();
  };

  Child.prototype = {

    _listen: function() {
      var self = this;
      support.on(window, 'message', function(evt) {
        if (evt.origin == self.parentOrigin) {
          self._receiveMessage(JSON.parse(evt.data));
        }
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

      if (!method || !this.client[method])
        return;

      var result = this.client[method].apply(this, args);

      if (id !== undefined && id !== null) this._fireCallback(id, result);
    }

  };

  IFT = {
    Parent: Parent,
    Child: Child,
    Client: {}
  }

  return IFT;

}));
