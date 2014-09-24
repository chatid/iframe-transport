var test = require('tape');
var ift = require('../../library/ift');
var config = require('../config');

require('../../library/services/storage');
require('../../library/services/storage-compat');

var connect = function(name, callback) {
  if (typeof name == 'function') {
    callback = name;
    name = 'storage';
  }
  ift.connect({
    name: name,
    childOrigin: config.IFT_ORIGIN,
    childPath: config.IFT_PATH + name
  }).ready(callback)
};

test("[storage] Get, set, and unset.", function(t) {
  t.plan(2);

  connect(function(courier) {
    var storage = courier.consumer('storage');
    storage.set('test', 'value', function() {
      storage.get('test', function(value) {
        t.equal(value, 'value');
        storage.unset('test', function() {
          storage.get('test', function(value) {
            t.equal(value, undefined);
            courier.destroy();
            t.end();
          })
        })
      });
    });
  });
});

test("[storage] Events.", function(t) {
  t.plan(2);

  connect('storage1', function(courier1) {
    var storage1 = courier1.consumer('storage');
    storage1.on('change', function(evt) {
      t.equal(evt.oldValue, null);
      t.equal(evt.newValue, 'value');
      t.end();
    });

    connect('storage2', function(courier2) {
      var storage2 = courier2.consumer('storage');
      storage2.unset('test', function() {
        storage2.set('test', 'value');
      });
    });
  });
});
