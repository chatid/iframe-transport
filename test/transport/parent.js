var expect = require('expect.js');
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

describe("Transport", function() {

  it("should provide an Events module.", function() {
    var obj = {}, cb;
    ift.util.mixin(obj, ift.Events);
    obj.on('test', cb = function() {
      expect(1).to.be.ok();
    });
    obj.trigger('test');
    obj.trigger('test');
    obj.off('test');
    obj.trigger('test');
    obj.on('test', cb);
    obj.off();
    obj.trigger('test');
  });

  it("should derive whether parent or child is needed.", function(done) {
    connect(function(courier) {
      expect(courier.transport.iframe).to.be.ok();
      courier.destroy();
      done();
    });

    var courier = ift.connect({
      trustedOrigins: [config.IFT_ORIGIN]
    });
    expect(courier.transport.iframe).to.be(undefined);
    courier.destroy();
  });

  it("can perform a request and invoke a callback.", function(done) {
    connect(function(courier) {
      var consumer = courier.consumer('transport');
      consumer.channel.request('test', [], function() {
        expect(1).to.be.ok();
        courier.destroy();
        done();
      });
    });
  });

  it("can trigger events remotely.", function(done) {
    var courier;

    ift.registerConsumer('transport', ift.Service.extend({
      ack: function() {
        expect(1).to.be.ok();
        courier.destroy();
        done();
      }
    }));

    courier = connect(function() {
      consumer = courier.consumer('transport');
      consumer.channel.request('trigger', ['test']);
    });
  });

});
