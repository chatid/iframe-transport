var test = require('tape');
var ift = require('../library/ift');
var config = {
  IFT_ORIGIN: location.origin,
  IFT_PATH: location.pathname + '?remote'
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

    var local, remote;

    local = ift.connect({
      remoteOrigin: config.IFT_ORIGIN,
      remotePath: config.IFT_PATH
    });
    t.equal(local.role, 'local');
    local.destroy();

    remote = ift.connect({
      trustedOrigins: [config.IFT_ORIGIN]
    });
    t.equal(remote.role, 'remote');
    remote.destroy();

    t.end();
  });

  test("Invoke and callback.", function(t) {
    t.plan(1);

    var transport = ift.connect({
      remoteOrigin: config.IFT_ORIGIN,
      remotePath: config.IFT_PATH,
    }).on('ift:connect', function() {
      var client = transport.client('test');
      client.send('invoke', 'test', [], function() {
        t.pass('Acknowledged.');
        transport.destroy();
        t.end();
      });
    });
  });

  test("Trigger.", function(t) {
    t.plan(1);

    var transport, client;

    ift.define(ift.roles.LOCAL, 'test', function(__super__) {
      return {
        ack: function() {
          t.pass('Acknowledged.');
          transport.destroy();
          t.end();
        }
      };
    });

    transport = ift.connect({
      remoteOrigin: config.IFT_ORIGIN,
      remotePath: config.IFT_PATH
    }).on('ift:connect', function() {
      client = transport.client('test');
      client.send('trigger', 'test', []);
    });
  });

};
