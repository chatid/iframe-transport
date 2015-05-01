// Service
// -------

var mixin   = require('../util/mixin'),
    extend  = require('../util/extend'),
    isArray = require('../util/isArray'),
    Events  = require('../base/events');

// Base class for implementing a service or consumer. Provides methods for sending a
// request or response to be routed over a given channel.
var Service = module.exports = function(channel) {
  this.channel = channel;

  // Process request from anonymous function to avoid collisions in extensions.
  // Optionally apply params as arguments and respond with result or error.
  this.channel.on('request', function(id, method, params) {
    var result, error;
    try {
      result = isArray(params) ? this[method].apply(this, params) : this[method](params);
    } catch (e) { error = { code: e.code, message: e.message }; }
    if (id) this.channel.respond(id, result, error);
  }, this);
};

mixin(Service.prototype, Events);

Service.extend = extend;
