var _ = require('underscore');
var expect = require('expect.js');
var ift = require('../../library/ift');
var config = require('../config');
var buildQuery = require('../utility').buildQuery;

var connect = function(target, callback) {
  if (typeof target == 'function') {
    callback = target;
    target = 'generic';
  }
  return ift.connect({
    name: target,
    childOrigin: config.IFT_ORIGIN,
    childPath: buildQuery(config.IFT_CHILD_PATH, {
      suite: 'transport',
      target: target
    })
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
      consumer.channel.request('test', [], function(response) {
        expect(response).to.be('ack');
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

  it("can handle lots of traffic.", function(done) {
    connect(function(courier) {
      var consumer = courier.consumer('transport');
      var count = 0;
      var next = function() {
        if (++count > 500) {
          consumer.channel.request('test', [], function() {
            courier.destroy();
            done();
          });
          return;
        }
        // IE8 throws "Stack overflow at line 0" when global property is recursed more
        // than 13 times (`window.postMessage`) http://stackoverflow.com/a/2365491/712895
        _.defer(function() {
          consumer.channel.request('test', [], next);
        });
      };
      next();
    });
  });

});
