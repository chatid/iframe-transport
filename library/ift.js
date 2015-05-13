/*
 * ift.js
 *
 * Bi-directional RPC over iframe
 * Targets modern browsers, IE8+
*/


// We use these below, but there is a circular dependency on ift. we must set
// up ift first, then require in the dependencies.

var ParentTransport = require('./base/parent-transport');
    ChildTransport = require('./base/child-transport');

// API
// ---

var ift = module.exports = {

  Channel: require('./base/channel'),

  Transport: require('./base/transport'),

  Service: require('./base/service'),

  // Factory function for creating appropriate transport.
  parent: function(options) {
    options || (options = {});
    return new Manager(
      new ParentTransport(options.childOrigin, options.childPath),
      options.services || []
    );
  },

  child: function(options) {
    options || (options = {});
    return new Manager(
      new ChildTransport(options.trustedOrigins),
      options.services || []
    );
  },

  // Lookup service constructor named `channel` in `#_services` registry.
  service: function(namespace, ctor) {
    return {
      namespace: namespace,
      ctor: ctor
    };
  },

  util: {
    mixin: require('./util/mixin'),
    debug: require('./util/debug')
  }

};
