var ift = require('../ift'),
    Service = require('./service'),
    Channel = require('./channel'),
    Events = require('./events'),
    mixin = require('../util/mixin');

// Manage services and consumers that communicate over a given transport.
var Courier = module.exports = function(transport) {
  this.transport = transport;
};

mixin(Courier.prototype, Events, {

  channel: function(name) {
    return new Channel(name, this.transport);
  },

  // Factory function for services, configured with a channel and transport.
  service: function(channel) {
    channel = this.channel(channel);
    var ctor = ift.service(channel.name) || Service;
    return new ctor(channel);
  },

  // Factory function for consumers, configured with a channel and transport.
  consumer: function(channel) {
    channel = this.channel(channel);
    var ctor = ift.consumer(channel.name) || Service;
    return new ctor(channel);
  },

  // Sugar for hooking transport readiness.
  ready: function(callback) {
    var once;
    if (this.transport.isReady()) {
      callback(this);
      return this;
    }
    this.transport.on('ready', once = function(message) {
      callback(this);
      this.transport.off('ready', once, this);
    }, this);
    return this;
  },

  wiretap: function(callback) {
    this.transport.on('message', function(message) {
      callback('incoming', message);
    }, this);
    var send = this.transport.send;
    var transport = this.transport;
    this.transport.send = function(message) {
      callback('outgoing', message);
      send.apply(transport, arguments);
    };
    return this;
  },

  destroy: function() {
    this.transport.destroy();
    this.off();
  }

});