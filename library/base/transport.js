var Events = require('./events'),
    support = require('../util/support'),
    extend = require('../util/extend');

// Base class for wrapping `iframe#postMessage`.
var Transport = module.exports = function(targetOrigins) {
  this.readyState = 0;
  this.targetOrigins = {};
  for (var i = 0; i < (targetOrigins || []).length; i++) {
    this.targetOrigins[targetOrigins[i]] = 1;
  }
  this.listen();
};

mixin(Transport.prototype, Events, {

  // Proxy `window.onmessage` into internal event and verifying security.
  listen: function() {
    var transport = this;
    support.on(window, 'message', this.onMessage = function(evt) {
      if (!transport.targetOrigins[evt.origin]) return;
      transport.trigger('message', evt.data);
    });
  },

  isReady: function() {
    return this.readyState === 1;
  },

  destroy: function() {
    support.off(window, 'message', this.onMessage);
    this.off();
  }

});

Transport.extend = extend;
