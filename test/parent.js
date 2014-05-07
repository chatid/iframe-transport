var test = require('tape');
var IFT = require('../library/ift');
var config = {
  IFT_HOST: location.origin,
  IFT_PATH: location.pathname + '?child'
};

module.exports = function() {

  test('Transport correctly defines level.', function(t) {
    t.plan(2);

    var parent = new IFT.Parent(config.IFT_HOST, config.IFT_PATH);
    t.equal(parent.level, 'parent');
    parent.destroy();

    var child = new IFT.Child;
    t.equal(child.level, 'child');
    child.destroy();

    t.end();
  });

  test('Invoke and callback.', function(t) {
    t.plan(1);

    var ift = new IFT.Parent(config.IFT_HOST, config.IFT_PATH, 'test', function() {
      var client = new IFT.Client(ift);
      client.send('invoke', 'test', [], function() {
        t.pass('Acknowledged.');
        ift.destroy();
        t.end();
      });
    });
  });

  test('Trigger.', function(t) {
    t.plan(1);

    var ift = new IFT.Parent(config.IFT_HOST, config.IFT_PATH, 'test', function() {
      var TestClient = IFT.Client.extend({
        ack: function() {
          t.pass('Acknowledged.');
          ift.destroy();
          t.end();
        }
      });
      var client = new TestClient(ift);
      client.send('trigger', 'test', []);
    });
  });

};
