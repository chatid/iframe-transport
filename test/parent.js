var test = require('tape');
var IFT = require('../library/ift');
var config = {
  IFT_HOST: location.origin,
  IFT_PATH: location.pathname + '?child'
};

module.exports = function() {

  test('Events.', function(t) {
    t.plan(2);
    var obj = {}, cb;
    IFT.util.mixin(obj, IFT.Events);
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

  test('Transport correctly defines level.', function(t) {
    t.plan(2);

    var parent, child;

    parent = new IFT.Parent(config.IFT_HOST, config.IFT_PATH);
    t.equal(parent.level, 'parent');
    parent.destroy();

    child = new IFT.Child;
    t.equal(child.level, 'child');
    child.destroy();

    t.end();
  });

  test('Invoke and callback.', function(t) {
    t.plan(1);

    var ift, client;

    ift = new IFT.Parent(config.IFT_HOST, config.IFT_PATH, 'test', function() {
      client = new IFT.Client(ift);
      client.send('invoke', 'test', [], function() {
        t.pass('Acknowledged.');
        ift.destroy();
        t.end();
      });
    });
  });

  test('Trigger.', function(t) {
    t.plan(1);

    var ift, client;
    var TestClient = IFT.Client.extend({
      ack: function() {
        t.pass('Acknowledged.');
        ift.destroy();
        t.end();
      }
    });

    ift = new IFT.Parent(config.IFT_HOST, config.IFT_PATH, 'test', function() {
      client = new TestClient(ift);
      client.send('trigger', 'test', []);
    });
  });

};
