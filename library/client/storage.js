/*
 * IFrameTransport - Storage Client
 *
 * Persist data across domains.
 * Targets modern browsers, IE8+
*/

(function (root, factory) {
  if (typeof define === 'function' && define.amd) define('ift-client-storage', ['ift'], factory);
  else root.IFT = factory(root.IFT);
}(this, function(IFT) {

  var support = IFT.support,
      util = IFT.util;

  util.mixin(support, {
    storageEventTarget: ('onstorage' in window ? window : document)
  });

  var Storage = IFT.Client.Storage = {};

  var StorageClient = IFT.Client.extend({
    type: 'storage',
    get: function() {},
    set: function() {},
    unset: function() {},
  });

  // Parent
  // ------

  // Implement the LocalStorage client from the parent's perspective.
  var Parent = Storage.Parent = StorageClient.extend({

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
  var Child = Storage.Child = StorageClient.extend({

    constructor: function(ift, storage) {
      this.storage = storage || lsWrapper;
      this.listen();
      IFT.Client.apply(this, arguments);
    },

    get: function(key) {
      return this.storage.get(key);
    },

    set: function(key, value, options) {
      return this.storage.set(key, value);
    },

    unset: function(keys) {
      return this.storage.unset(keys);
    },

    onStorage: function(evt) {
      if (evt) {
        // IE9+: Don't trigger if value didn't change
        if (evt.oldValue === evt.newValue) return;
      } else {
        // IE8: Don't throw an exception as `evt` is undefined
        evt = {};
      }

      this.send('trigger', 'change', [{
        key: evt.key,
        oldValue: evt.oldValue,
        newValue: evt.newValue
      }]);
    },

    listen: function() {
      var self = this, target = support.storageEventTarget;
      support.on(target, 'storage', function(evt) { self.onStorage(evt); });
    }

  });

  return IFT;

}));
