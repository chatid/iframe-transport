/*
 * ift.js
 *
 * Bi-directional RPC over iframe
 * Targets modern browsers, IE8+
*/

var Manager = require('./base/manager'),
    ParentTransport = require('./base/parent-transport'),
    ChildTransport = require('./base/child-transport');

module.exports = {

  ParentTransport: ParentTransport,

  ChildTransport: ChildTransport,

  Channel: require('./base/channel'),

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
