var Transport = require('./transport');

// Implement the transport class from the child's perspective.
var ChildTransport = module.exports = Transport.extend({

  constructor: function() {
    if (window.parent !== window) this.parent = window.parent;
    Transport.apply(this, arguments);
  },

  listen: function() {
    this.readyState = 1;
    this.trigger('ready');
    this.send('ready');
    Transport.prototype.listen.apply(this, arguments);
  },

  send: function(message) {
    if (this.parent) {
      this.parent.postMessage(message, '*');
      this.trigger('outgoing', message);
    }
  }

});
