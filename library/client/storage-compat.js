/*
 * IFrameTransport - Storage Client Extension
 *
 * Use a cookie to capture which key changed for IE8
 * Use a cookie to ignore "storage" events that I triggered
*/

(function (root, factory) {
  if (typeof define === 'function' && define.amd) define('ift-client-storage-compat', ['localstorage-events', 'ift-client-storage'], factory);
  else if (typeof exports === 'object') module.exports = factory(require('localstorage-events'), require('./storage'));
  else root.IFT = factory(root.LSEvents, root.IFT);
}(this, function(LSEvents, IFT) {

  var support = IFT.support,
      util = IFT.util;

  util.mixin(support, {
    myWritesTrigger: ('onstoragecommit' in document)
  });

  // Only override the Storage child if necessary.
  if (!support.myWritesTrigger) return IFT;

  var Child = IFT.Client.Storage.Child;

  var compatibleChild = IFT.Client.Storage.Child = Child.extend({

    constructor: function(ift, storage) {
      Child.apply(this, arguments);
      var self = this;
      this.storage = new LSEvents(this.storage, function() {
        self.onStorage.apply(self, arguments);
      });
    },

    // `LSEvents` will handle "storage" events for us.
    listen: function() {}

  });

  return IFT;

}));
