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

  var Parent, Child;

  Parent = function(ift) {
    this.ift = ift;
  }

  Parent.prototype = {

    get: function(key, callback) {
      this.ift.send('get', [key], callback);
    },

    set: function(key, value, options, callback) {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }

      this.ift.send('set', [key, value, options], callback);
    },

    unset: function(key, callback) {
      this.ift.send('unset', [key], callback);
    }

  };

  Child = function() {
    this._listen();
  };

  Child.prototype = {

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
      var target = support.storageEventTarget;
      support.on(target, 'storage', function(evt) {
        console.log('storage evt', evt);
      });
    }

  };

  IFT.Client.LS = {
    Parent: Parent,
    Child: Child
  }

  return IFT;

}));
