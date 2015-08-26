var Transport = require('./transport');

// Implement the transport class from the child's perspective.
var ChildTransport = module.exports = Transport.extend({

  constructor: function() {
    this.isReady = true;
    this.parent = window.parent;
    Transport.apply(this, arguments);
  },

  listen: function() {
    this.send('ready');
    Transport.prototype.listen.apply(this, arguments);
  },

  send: function(message) {
    this.parent.postMessage(message, '*');
    this.trigger('outgoing', message);
  }

});
