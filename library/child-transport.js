var Transport = require('./transport');
var bind = require('./util/bind');

// Implement the transport class from the child's perspective.
var ChildTransport = module.exports = Transport.extend({

  constructor: function() {
    this.isReady = true;
    this.parent = window.parent;
    Transport.apply(this, arguments);

    // use this setTimeout to ensure child implementation is able define event
    // listeners before parent is informed of readiness
    setTimeout(bind(function() {
      this.send('ready');
    }, this), 0);
  },

  send: function(message) {
    this.parent.postMessage(message, '*');
    this.trigger('outgoing', message);
  }

});
