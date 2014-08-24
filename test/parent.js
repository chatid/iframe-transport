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

  test("Transport correctly defines level.", function(t) {
    t.plan(2);

    var parent, child;

    parent = ift.parent({
      childOrigin: config.IFT_ORIGIN,
      childPath: config.IFT_PATH
    });
    t.equal(parent.level, 'parent');
    parent.destroy();

    child = ift.child({
      parentOrigins: [config.IFT_ORIGIN]
    });
    t.equal(child.level, 'child');
    child.destroy();

    t.end();
  });

  test("Invoke and callback.", function(t) {
    t.plan(1);

    var transport = ift.parent({
      childOrigin: config.IFT_ORIGIN,
      childPath: config.IFT_PATH,
      ready: function(transport) {
        var client = transport.client('test');
        client.send('invoke', 'test', [], function() {
          t.pass('Acknowledged.');
          transport.destroy();
          t.end();
        });
      }
    });
  });

  test("Trigger.", function(t) {
    t.plan(1);

    ift.parentClient('test', function(__super__) {
      return {
        ack: function() {
          t.pass('Acknowledged.');
          transport.destroy();
          t.end();
        }
      };
    });

    var transport = ift.parent({
      childOrigin: config.IFT_ORIGIN,
      childPath: config.IFT_PATH,
      ready: function(transport) {
        client = transport.client('test');
        client.send('trigger', 'test', []);
      }
    });
  });

};
