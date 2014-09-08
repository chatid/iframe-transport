var test = require('tape');
var ift = require('../library/ift');
var config = {
  IFT_ORIGIN: location.origin,
  IFT_PATH: location.pathname + '?child'
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

  test("Transport derives whether parent or child is needed.", function(t) {
    t.plan(2);

    ift.connect({
      childOrigin: config.IFT_ORIGIN,
      childPath: config.IFT_PATH
    }).ready(function(courier) {
      t.ok(courier.transport.iframe);
      courier.destroy();
      t.end();
    });

    var courier = ift.connect({
      trustedOrigins: [config.IFT_ORIGIN]
    });
    t.notOk(courier.transport.iframe);
    courier.destroy();
  });

  test("Request and callback.", function(t) {
    t.plan(1);

    ift.connect({
      childOrigin: config.IFT_ORIGIN,
      childPath: config.IFT_PATH
    }).ready(function(courier) {
      var consumer = courier.consumer('test');
      consumer._channel.request('test', [], function() {
        t.pass('Acknowledged.');
        courier.destroy();
        t.end();
      });
    });
  });

  test("Trigger.", function(t) {
    t.plan(1);

    var courier;

    ift.registerConsumer('test', ift.Service.extend({
      ack: function() {
        t.pass('Acknowledged.');
        courier.destroy();
        t.end();
      }
    }));

    courier = ift.connect({
      childOrigin: config.IFT_ORIGIN,
      childPath: config.IFT_PATH
    }).ready(function() {
      consumer = courier.consumer('test');
      consumer._channel.request('trigger', ['test']);
    });
  });

};
