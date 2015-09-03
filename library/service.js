var mixin   = require('./util/mixin'),
    extend  = require('./util/extend'),
    Events  = require('./util/events');

// Base class for implementing a service provider or consumer. Provides methods
// for sending a request or response to be routed over a given channel.
var Service = module.exports = function(channel) {
  this.channel = channel;
};

mixin(Service.prototype, Events, {

  destroy: function() {
    this.channel.destroy();
  }

});

Service.extend = extend;
