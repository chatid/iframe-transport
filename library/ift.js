/*
 * ift.js
 *
 * Bi-directional RPC over iframe
 * Targets modern browsers, IE8+
*/


// We use these below, but there is a circular dependency on ift. we must set
// up ift first, then require in the dependencies.
var Courier, Parent, Child;


var slice = [].slice;

// API
// ---

var ift = module.exports = {

  Service: require('./base/service'),

  Events: require('./base/events'),

  // Factory function for creating appropriate transport for a courier.
  connect: function(options) {
    var transport;
    options || (options = {});
    if (options.childPath) {
      transport = new Parent(options.name, options.childOrigin, options.childPath);
    } else {
      transport = new Child(options.trustedOrigins);
    }
    return new Courier(transport);
  },

  // Lookup service constructor named `channel` in `#_services` registry.
  service: function(channel) {
    return this._services[channel];
  },

  // Lookup consumer constructor named `channel` in `#_consumers` registry.
  consumer: function(channel) {
    return this._consumers[channel];
  },

  // Register service and consumer constructors in global registry.
  register: function(channel, service, consumer) {
    this.registerService(channel, service);
    this.registerConsumer(channel, consumer);
    return this;
  },

  // Register service constructor in global registry.
  registerService: function(channel, service) {
    return this._services[channel] = service;
  },

  // Register consumer constructor in global registry.
  registerConsumer: function(channel, consumer) {
    return this._consumers[channel] = consumer;
  },

  // Global services registry.
  _services: {},

  // Global consumers registry.
  _consumers: {}

};

Courier = require('./base/courier');
Parent = require('./base/parent');
Child = require('./base/child');
