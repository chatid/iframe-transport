var test = require('tape');
var IFT = require('../library/ift');
var config = {
  IFT_HOST: 'http://127.0.0.1:8000',
  IFT_PATH: '/test/child.html'
};

test('Transport correctly defines level.', function(t) {
  t.plan(2);

  var parent = new IFT.Parent(config.IFT_HOST, config.IFT_PATH);
  t.equal(parent.level, 'parent');

  var child = new IFT.Child;
  t.equal(child.level, 'child');

  t.end();
});

test('Parent send to child.', function(t) {
  t.plan(1);

  var ift = new IFT.Parent(config.IFT_HOST, config.IFT_PATH, 'test', function() {
    var client = new IFT.Client(ift);
    client.send('invoke', 'test', [], function(cb) {
      t.equal(cb, 'cb')
      t.end();
    });
  });
});
