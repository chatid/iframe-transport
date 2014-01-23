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

  // Parent
  // ------

  // Implement the LocalStorage client from the parent's perspective.
  var Parent = IFT.Client.extend({

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

    unset: function(key, callback) {
      this.send('invoke', 'unset', [key], callback);
    }

  });

  // Implement the LocalStorage client from the child's perspective.
  var Child = IFT.Client.extend({

    constructor: function() {
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
      support.on(window, 'storage', function(evt) { self._onStorage(evt); });
    },

    _onStorage: function(evt) {
      this.send('trigger', 'change', [evt.key, evt.oldValue, evt.newValue]);
    }

  });

  var compatibleChild = Child;

  // IE triggers the "storage" event even for those which originated from this window.
  if (support.ignoreMyWrites) {

    // Use "storagecommit" event to track if the write likely came from this window.
    compatibleChild = Child.extend({

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

      _onStorage: function(evt) {
        if (this._writing) return this._writing = false;
        if (evt.newValue && evt.oldValue == evt.newValue) return;
        Child.prototype._onStorage.apply(this, arguments);
      }

    });

  }

  // Register this client in the library under the unique type: `ls`.
  IFT.Client.register('ls', Parent, compatibleChild);

  return IFT;

}));
