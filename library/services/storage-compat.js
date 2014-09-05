/*
 * IFrameTransport - Storage Service Extension
 *
 * Use a cookie to capture which key changed for IE8
 * Use a cookie to ignore "storage" events that I triggered
*/

(function (root, factory) {
  if (typeof define === 'function' && define.amd) define('ift-storage-service-compat', ['localstorage-events', 'ift-storage-service'], factory);
  else if (typeof exports === 'object') module.exports = factory(require('localstorage-events'), require('./storage'));
  else root.ift = factory(root.LSEvents, root.ift);
}(this, function(LSEvents, ift) {

  var support = ift.support,
      mixin = ift.util.mixin;

  mixin(support, {
    myWritesTrigger: ('onstoragecommit' in document)
  });

  // Only override the Storage service if necessary.
  if (!support.myWritesTrigger) return ift;

  var Provider = ift.provider('storage').extend({

    constructor: function(transport, storage) {
      ift.provider('storage').apply(this, arguments);
      var provider = this;
      this.storage = new LSEvents(this.storage, function() {
        provider.onStorage.apply(provider, arguments);
      });
    },

    // `LSEvents` will handle "storage" events for us.
    listen: function() {}

  });

  ift.registerProvider('storage', Provider);

  return ift;

}));
