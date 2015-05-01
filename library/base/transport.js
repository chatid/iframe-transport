var Events  = require('./events'),
    support = require('../util/support'),
    mixin   = require('../util/mixin'),
    bind    = require('../util/bind'),
    extend  = require('../util/extend');

// Base class for wrapping `iframe#postMessage`.
var Transport = module.exports = function(targetOrigins) {
  this.readyState = 0;
  this.targetOrigins = {};
  for (var i = 0; i < (targetOrigins || []).length; i++) {
    this.targetOrigins[targetOrigins[i]] = 1;
  }
  this.onMessage = bind(this.onMessage, this);
  this.listen();
};

mixin(Transport.prototype, Events, {

  ready: function(callback, context) {
    var transport = this;
    context || (context = this);
    if (this.isReady()) {
      callback.call(context, this);
    } else {
      this.on('ready', function() {
        callback.call(context, transport)
      });
    }
  },

  onMessage: function(evt) {
    if (!this.targetOrigins[evt.origin]) return;
    this.trigger('message', evt.data);
  },

  // Proxy `window.onmessage` into internal event and verifying security.
  listen: function() {
    support.on(window, 'incoming', this.onMessage);
  },

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
