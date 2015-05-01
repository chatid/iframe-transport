var Transport = require('./transport');

// Implement the transport class from the child's perspective.
var Child = module.exports = Transport.extend({

  constructor: function() {
    if (window.parent !== window) this.parent = window.parent;
    Transport.apply(this, arguments);
  },

  listen: function() {
    var transport = this;
    Transport.prototype.listen.apply(this, arguments);

    // [HACK] Assume that all services/consumers are defined synchronously and will be
    // ready for use at the next tick (page load complete). A proper solution involves
    // readiness communication between individual services and consumers.
    setTimeout(function() {
      transport.readyState = 1;
      transport.send('ready');
      transport.trigger('ready');
    }, 0);
  },

  send: function(message) {
    if (this.parent) this.parent.postMessage(message, '*');
  }

});