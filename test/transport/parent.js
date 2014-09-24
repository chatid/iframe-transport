var test = require('tape');
var ift = require('../../library/ift');
var config = require('../config');

var connect = function(name, callback) {
  if (typeof name == 'function') {
    callback = name;
    name = 'transport';
  }
  return ift.connect({
    name: name,
    childOrigin: config.IFT_ORIGIN,
    childPath: config.IFT_PATH + name
  }).ready(callback);
};

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

  connect(function(courier) {
    t.ok(courier.transport.iframe);
    courier.destroy();
  });

  var courier = ift.connect({
    trustedOrigins: [config.IFT_ORIGIN]
  });
  t.notOk(courier.transport.iframe);
  courier.destroy();
});

test("Request and callback.", function(t) {
  t.plan(1);

  connect(function(courier) {
    var consumer = courier.consumer('transport');
    consumer.channel.request('test', [], function() {
      t.pass('Acknowledged.');
      courier.destroy();
      t.end();
    });
  });
});

test("Trigger.", function(t) {
  t.plan(1);

  var courier;

  ift.registerConsumer('transport', ift.Service.extend({
    ack: function() {
      t.pass('Acknowledged.');
      courier.destroy();
      t.end();
    }
  }));

  courier = connect(function() {
    consumer = courier.consumer('transport');
    consumer.channel.request('trigger', ['test']);
  });
});
