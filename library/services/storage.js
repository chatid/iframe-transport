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

  // Service
  // -------

  // Implement the LocalStorage service from a service's perspective.
  var Service = ift.Service.extend({

    constructor: function(channel, storage) {
      this.listen();
      ift.Service.apply(this, arguments);
    },

    listen: function() {
      var service = this, target = support.storageEventTarget;
      support.on(target, 'storage', function(evt) { service.onStorage(evt); });
    },

    get: function(key) {
      return this.deserialize(localStorage.getItem(key));
    },

    set: function(key, value, options) {
      return localStorage.setItem(key, this.serialize(value));
    },

    unset: function(keys) {
      if (!(keys instanceof Array)) keys = [keys];
      for (i = 0; i < keys.length; i++) localStorage.removeItem(keys[i]);
    },

    serialize: function(data) {
      return JSON.stringify(data);
    },

    deserialize: function(data) {
      try { return JSON.parse(data); }
      catch (e) { return data; }
    },

    onStorage: function(evt) {
      if (evt) {
        // IE9+: Don't trigger if value didn't change
        if (evt.oldValue === evt.newValue) return;
      } else {
        // IE8: `evt` is undefined
        evt = {};
      }

      this.channel.request('trigger', ['change', {
        key: evt.key,
        oldValue: this.deserialize(evt.oldValue),
        newValue: this.deserialize(evt.newValue)
      }]);
    }

  });

  // Consumer
  // --------

  // Implement the LocalStorage service from a consumer's perspective.
  var Consumer = ift.Service.extend({

    get: function(key, callback) {
      this.channel.request('get', [key], callback);
    },

    set: function(key, value, options, callback) {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      } else options = options || {};

      this.channel.request('set', [key, value, options], callback);
    },

    unset: function(keys, callback) {
      this.channel.request('unset', [keys], callback);
    }

  });

  ift.register('storage', Service, Consumer);

  return ift;

}));
