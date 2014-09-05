/*
 * IFrameTransport - Storage Service
 *
 * Persist data across domains.
 * Targets modern browsers, IE8+
*/

(function (root, factory) {
  if (typeof define === 'function' && define.amd) define('ift-storage-service', ['ift'], factory);
  else if (typeof exports === 'object') module.exports = factory(require('../ift'));
  else root.ift = factory(root.ift);
}(this, function(ift) {

  var support = ift.support,
      mixin = ift.util.mixin;

  mixin(support, {
    storageEventTarget: ('onstorage' in window ? window : document)
  });

  // Local
  // -----

  // Implement the LocalStorage service from the consumer's perspective.
  ift.define(ift.roles.CONSUMER, 'storage', function(__super__) {

    return {

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

    };

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

  // Implement the LocalStorage service from the provider's perspective.
  ift.define(ift.roles.PROVIDER, 'storage', function(__super__) {

    return {

      constructor: function(transport, storage) {
        this.storage = storage || lsWrapper;
        this.listen();
        __super__.apply(this, arguments);
      },

      get: function(key) {
        return this.storage.get(key);
      },

      set: function(key, value, options) {
        return this.storage.set(key, value, options);
      },

      unset: function(keys) {
        return this.storage.unset(keys);
      },

      onStorage: function(evt) {
        if (evt) {
          // IE9+: Don't trigger if value didn't change
          if (evt.oldValue === evt.newValue) return;
        } else {
          // IE8: `evt` is undefined
          evt = {};
        }

        this.send('trigger', 'change', [{
          key: evt.key,
          oldValue: evt.oldValue,
          newValue: evt.newValue
        }]);
      },

      listen: function() {
        var provider = this, target = support.storageEventTarget;
        support.on(target, 'storage', function(evt) { provider.onStorage(evt); });
      }

    };

  });

  return ift;

}));
