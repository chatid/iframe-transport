var Events  = require('./events'),
    support = require('../util/support'),
    mixin   = require('../util/mixin'),
    bind    = require('../util/bind'),
    extend  = require('../util/extend');

// Base class for wrapping `iframe#postMessage`.
var Transport = module.exports = function(targetOrigins) {
  this.readyState = 0;
  this.targetOrigins = targetOrigins || [];
  this.onMessage = bind(this.onMessage, this);
  this.listen();
};

mixin(Transport.prototype, Events, {

  ready: function(callback, context) {
    var transport = this, ready;
    context || (context = this);
    if (this.isReady()) {
      callback.call(context, this);
    } else {
      this.on('ready', ready = function() {
        callback.call(context, transport);
        transport.off('ready', ready);
      });
    }
  },

  onMessage: function(evt) {
    if (this.targetOrigins.indexOf(evt.origin) < 0) return;
    this.trigger('incoming', evt.data);
  },

  // Proxy `window.onmessage` into internal event and verifying security.
  listen: function() {
    support.on(window, 'message', this.onMessage);
  },

  // Implemented by subclasses.
  send: function() {},

  isReady: function() {
    return this.readyState === 1;
  },

  wiretap: function(callback) {
    this.on('incoming', function(message) {
      callback('incoming', message);
    });
    this.on('outgoing', function(message) {
      callback('outgoing', message);
    });
  },

  destroy: function() {
    support.off(window, 'message', this.onMessage);
    this.off();
  }

});

Transport.extend = extend;
