/*
 * IFrameTransport - Storage Client Extension
 *
 * Use a cookie to capture which key changed for IE8
 * Use a cookie to ignore "storage" events that I triggered
*/

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define('ift-client-storage-compat', ['ift-client-storage', 'cookie'], factory);
  } else root.IFT = factory(root.IFT, root.Cookie);
}(this, function(IFT, Cookie) {

  var support = IFT.support,
      util = IFT.util;

  util.mixin(support, {
    myWritesTrigger: ('onstoragecommit' in document),
    storageEventProvidesKey: !('onstorage' in document)
  });

  if (!support.myWritesTrigger) return IFT;

  var Child = IFT.Client.Storage.Child,
      myUid = Math.floor(Math.random() * 1000) + '' + +new Date;

  var compatibleChild = IFT.Client.Storage.Child = Child.extend({

    set: function(key, value, options) {
      Cookie.set('version', myUid + ':' + key);
      return Child.prototype.set.apply(this, arguments);
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
          newValue: this.get(key)
        };
      }

      return evt;
    },

    onStorage: function(evt) {
      evt = this.parseEvent(evt);
      if (evt.key) Child.prototype.onStorage.call(this, evt);
    },

    listen: function() {
      // IE8: to accurately determine `evt.newValue`, we must read it during the event
      // callback. Oddly, it returns the old value instead of the new one until the call
      // stack clears. More oddly, I was unable to reproduce this with a minimal test
      // case, yet it always seems to behave this way in this implementation.
      if (!support.storageEventProvidesKey) {
        var self = this, target = support.storageEventTarget;
        support.on(target, 'storage', function(evt) {
          setTimeout(function() {
            self.onStorage(evt);
          }, 0);
        });
      } else {
        Child.prototype.listen.apply(this, arguments);
      }
    }

  });

  return IFT;

}));
