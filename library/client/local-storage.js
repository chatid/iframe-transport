/*
 * IFrameTransport - LocalStorage Client
 *
 * Persist data across domains.
 * Targets modern browsers, IE8+
*/

(function (root, factory) {
  if (typeof define === 'function' && define.amd) define('ift-ls-client', ['ift'], factory);
  else root.IFT = factory(root.IFT);
}(this, function(IFT) {

  var support = IFT.support;

  IFT.Client.LS = {};

  // Parent
  // ------

  // Implement the LocalStorage client from the parent's perspective.
  var Parent = IFT.Client.LS.Parent = IFT.Client.extend({

    type: 'ls',

    get: function(key, callback) {
      this.send('invoke', 'get', [key], callback);
    },

    set: function(key, value, options, callback) {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      } else options = options || {};

      this.send('invoke', 'set', [key, value, options], callback);
    },

    unset: function(keys, callback) {
      this.send('invoke', 'unset', [keys], callback);
    }

  });

  // Wrap localStorage so it may be swapped out.
  var lsWrapper = {
    get: function(key) {
      return localStorage.getItem(key);
    },
    set: function(key, value) {
      return localStorage.setItem(key, value);
    },
    unset: function(keys) {
      if (!(keys instanceof Array)) keys = [keys];
      for (i = 0; i < keys.length; i++) localStorage.removeItem(keys[i]);
    }
  };

  // Implement the LocalStorage client from the child's perspective.
  var Child = IFT.Client.LS.Child = IFT.Client.extend({

    constructor: function(ift, storage) {
      this.storage = storage || lsWrapper;
      this._listen();
      IFT.Client.apply(this, arguments);
    },

    type: 'ls',

    get: function(key) {
      return this.storage.get(key);
    },

    set: function(key, value, options) {
      return this.storage.set(key, value);
    },

    unset: function(keys) {
      return this.storage.unset(keys);
    },

    _listen: function() {
      var self = this;
      support.on(window, 'storage', function(evt) { self._onStorage(evt); });
    },

    _onStorage: function(evt) {
      this.send('trigger', 'change', [{
        key: evt.key,
        oldValue: evt.oldValue,
        newValue: evt.newValue
      }]);
    }

  });

  // IE triggers the "storage" event even for those which originated from this window.
  if (support.ignoreMyWrites) {

    // Use "storagecommit" event to track if the write likely came from this window.
    var compatibleChild = IFT.Client.LS.Child = Child.extend({

      set: function(key, value, options) {
        this._writing = true;
        return Child.prototype.set.apply(this, arguments);
      },

      // IE8 triggers "storage" on `document` while IE9+ trigger it on `window`. IE*
      // triggers "storagecommit" on `document`.
      _listen: function() {
        var self = this, target = support.storageEventTarget;
        support.on(target, 'storage', function(evt) { self._onStorage(evt); });
        support.on(document, 'storagecommit', function() { self._writing = false });
      },

      // TODO: IE8 will trigger even if the value didn't change.
      _onStorage: function(evt) {
        if (this._writing) return this._writing = false;
        if (evt.newValue && evt.oldValue == evt.newValue) return;
        Child.prototype._onStorage.apply(this, arguments);
      }

    });

  }

  return IFT;

}));
