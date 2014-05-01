var test = require('tape');
var IFT = require('../library/ift');
var Parent = IFT.Parent;
var Child = IFT.Child;

test('Parent level.', function(t) {
  t.plan(1);

  var parent = new Parent;
  t.equal(parent.level, 'parent');

  t.end();
});

test('Child level.', function(t) {
  t.plan(1);

  var child = new Child;
  t.equal(child.level, 'child');

  t.end();
});
