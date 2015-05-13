var Service = require('../base/service'),
    support = require('../util/support'),
    isArray = require('../util/isArray'),
    mixin   = require('../util/mixin');

mixin(support, {
  storageEventTarget: ('onstorage' in window ? window : document)
});

// Implement the LocalStorage service from a provider's perspective.
var Provider = Service.extend({

  constructor: function(channel, storage) {
    this.listen();
    Service.apply(this, arguments);
  },

  listen: function() {
    support.on(support.storageEventTarget, 'storage', function(evt) {
      this.onStorage(evt);
    }, this);
  },

  get: function(key) {
    return this.deserialize(localStorage.getItem(key));
  },

  set: function(key, value, options) {
    return localStorage.setItem(key, this.serialize(value));
  },

  unset: function(keys) {
    if (!(isArray(keys))) keys = [keys];
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
  },

  destroy: function() {
    support.off(support.storageEventTarget, 'storage', this.onStorage);
  }

});

// Implement the LocalStorage service from a consumer's perspective.
var Consumer = Service.extend({

  get: function(key, callback) {
    this.channel.request('get', [key], callback);
  },

  set: function(key, value, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    } else {
      options = options || {};
    }

    this.channel.request('set', [key, value, options], callback);
  },

  unset: function(keys, callback) {
    this.channel.request('unset', [keys], callback);
  }

});

module.exports = {
  Provider: Provider,
  Consumer: Consumer
};
