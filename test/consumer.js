var test = require('tape');
var ift = require('../library/ift');
var config = {
  IFT_ORIGIN: location.origin,
  IFT_PATH: location.pathname + '?provider'
};

module.exports = function() {

  test("Events.", function(t) {
    t.plan(2);
    var obj = {}, cb;
    ift.util.mixin(obj, ift.Events);
    obj.on('test', cb = function() {
      t.pass('"test" event fired.');
    });
    obj.trigger('test');
    obj.trigger('test');
    obj.off('test');
    obj.trigger('test');
    obj.on('test', cb);
    obj.off();
    obj.trigger('test');
    t.end();
  });

  test("Transport correctly defines role.", function(t) {
    t.plan(2);

    var consumer, provider;

    consumer = ift.connect({
      remoteOrigin: config.IFT_ORIGIN,
      remotePath: config.IFT_PATH
    });
    t.equal(consumer.role, ift.roles.CONSUMER);
    consumer.destroy();

    provider = ift.connect({
      trustedOrigins: [config.IFT_ORIGIN]
    });
    t.equal(provider.role, ift.roles.PROVIDER);
    provider.destroy();

    t.end();
  });

  test("Invoke and callback.", function(t) {
    t.plan(1);

    var transport = ift.connect({
      remoteOrigin: config.IFT_ORIGIN,
      remotePath: config.IFT_PATH
    }).ready(function() {
      var service = transport.service('test');
      service.send('invoke', 'test', [], function() {
        t.pass('Acknowledged.');
        transport.destroy();
        t.end();
      });
    });
  });

  test("Trigger.", function(t) {
    t.plan(1);

    var transport, service;

    ift.registerConsumer('test', ift.consumer('base').extend({
      ack: function() {
        t.pass('Acknowledged.');
        transport.destroy();
        t.end();
      }
    }));

    transport = ift.connect({
      remoteOrigin: config.IFT_ORIGIN,
      remotePath: config.IFT_PATH
    }).ready(function() {
      service = transport.service('test');
      service.send('trigger', 'test', []);
    });
  });

};
