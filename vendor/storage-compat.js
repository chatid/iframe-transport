/*
 * StorageCompat
 *
 * Use a cookie to capture which key changed for IE8
 * Use a cookie to ignore "storage" events that I triggered
*/

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define('storage-compat', ['cookie'], factory);
  } else root.StorageCompat = factory(root.Cookie);
}(this, function(Cookie) {

  var support = {
    storageEventTarget: ('storage' in window ? window : document),
    storageEventProvidesKey: !('storage' in document)
  };

  // http://peter.michaux.ca/articles/feature-detection-state-of-the-art-browser-scripting
  support.has = function(object, property){
    var t = typeof object[property];
    return t == 'function' || (!!(t == 'object' && object[property])) || t == 'unknown';
  }

  if (support.has(window, 'addEventListener')) {
    support.on = function(target, name, callback) {
      target.addEventListener(name, callback, false);
    }
    support.off = function(target, name, callback) {
      target.removeEventListener(name, callback, false);
    }
  } else if (support.has(window, 'attachEvent')) {
    support.on = function(object, name, callback) {
      object.attachEvent('on' + name, function() { callback(window.event) });
    }
    support.off = function(object, name, callback) {
      object.detachEvent('on' + name, function() { callback(window.event) });
    }
  }

  var myUid = Math.floor(Math.random() * 1000) + '' + +new Date;

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

  var StorageCompat = function(storage, events) {
    this.storage = storage || lsWrapper;

    if (!events) return;
    var self = this, target = support.storageEventTarget;
    support.on(target, 'storage', function(evt) { self.onStorage(evt); });
  };

  StorageCompat.prototype = {

    get: function(key) {
      Cookie.set('version', myUid + ':' + key);
      return this.storage.get(key);
    },

    set: function(key, value, options) {
      return this.storage.set(key, value, options)
    },

    unset: function(key) {
      return this.storage.unset(key);
    },

    parseEvent: function(evt) {
      var ref = (Cookie.get('version') || ':').split(':'),
          uid = ref[0], key = ref[1];

      evt = evt || {};

      // For all IE
      if (uid == myUid) return {};

      // For IE8
      if (!support.storageEventProvidesKey) {
        evt = {
          key: key,
          newValue: this.storage.get(key)
        };
      }

      return evt;
    },

    onStorage: function(evt) {

    }

  };

  return StorageCompat;

}));
