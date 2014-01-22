/*
 * IFrameStorage
 *
 * Persist data from any domain.
 * Targets modern browsers, IE8+
*/

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define('ift-ls-client', ['ift'], factory);
  } else {
    root.IFT = factory(root.IFT);
  }
}(this, function(IFT) {

  var Parent = IFT.Client.extend({

    constructor: function(ift, id) {
      this.id = id || 'ls';
      IFT.Client.apply(this, arguments);
    },

    get: function(key, callback) {
      this.send('invoke', 'get', [key], callback);
    },

    set: function(key, value, options, callback) {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }

      options = options || {};

      this.send('invoke', 'set', [key, value, options], callback);
    },

    unset: function(key, callback) {
      this.send('invoke', 'unset', [key], callback);
    }

  });

  var Child = IFT.Client.extend({

    constructor: function(ift, id) {
      this.id = id || 'ls';
      this._listen();
      IFT.Client.apply(this, arguments);
    },

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
      var target = support.storageEventTarget;
      support.on(target, 'storage', function(evt) {
        self.send('trigger', 'change', [evt.key, evt.oldValue, evt.newValue]);
      });
    }

  });

  IFT.Client.register('ls', Parent, Child);

  return IFT;

}));
