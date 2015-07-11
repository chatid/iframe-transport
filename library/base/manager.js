var Service = require('./service'),
    Channel = require('./channel'),
    isArray = require('../util/isArray'),
    mixin   = require('../util/mixin');

function construct(ctor, args) {
  function Surrogate() {
    return ctor.apply(this, args);
  }
  Surrogate.prototype = ctor.prototype;
  return new Surrogate();
}

var Manager = module.exports = function(transport, services) {
  this.transport = transport;
  services || (services = []);

  this.transport.ready(function() {
    var service;
    this.services = [];
    for (var i = 0; i < services.length; i++) {
      service = services[i];
      this.services.push(this.service(service.namespace, service.ctor));
    }
  }, this);
};

mixin(Manager.prototype, {

  ready: function(callback) {
    this.transport.ready(function() {
      callback.apply(this, [this].concat(this.services));
    }, this);
    return this;
  },

  channel: function(namespace) {
    return new Channel(namespace, this.transport);
  },

  service: function(namespace, serviceCtor, serviceArgs) {
    if (!namespace) throw new Error("Cannot create a service without a namespace");
    serviceCtor || (serviceCtor = Service);
    serviceArgs || (serviceArgs = []);

    var channel = new Channel(namespace, this.transport);
    var service = construct(serviceCtor, [channel, serviceArgs]);

    channel.on('request', function(id, method, params) {
      var result, error;
      try {
        result = isArray(params) ? service[method].apply(service, params) : service[method](params);
      } catch (e) {
        error = {
          code: -32000,
          message: e.message,
          data: {
            stack: e.stack
          }
        };
      }
      if (id) channel.respond(id, result, error);
    });

    return service;
  },

  wiretap: function(callback) {
    this.transport.wiretap(callback);
    return this;
  },

  destroy: function() {
    this.transport.destroy();
  }

});
