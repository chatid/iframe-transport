var expect = require('expect.js');
var ift = require('../../library/ift');
var config = require('../config');
var buildQuery = require('../utility').buildQuery;
var LSEvents = require('localstorage-events');

require('../../library/services/storage');
require('../../library/services/storage-compat');

var connect = function(target, callback) {
  if (typeof target == 'function') {
    callback = target;
    target = 'generic';
  }
  ift.connect({
    name: target,
    childOrigin: config.IFT_ORIGIN,
    childPath: buildQuery(config.IFT_CHILD_PATH, {
      suite: 'storage',
      target: target
    })
  }).ready(callback)
};

var oldValueSupport = LSEvents.support.storageEventProvidesKey;

describe("Storage", function() {

  afterEach(function() {
    localStorage.clear();
  });

  it("can get, set, and unset.", function(done) {
    connect(function(courier) {
      var storage = courier.consumer('storage');
      storage.set('test', 'value', function() {
        storage.get('test', function(value) {
          expect(value).to.be('value');
          storage.unset('test', function() {
            storage.get('test', function(value) {
              expect(value).to.be(undefined);
              courier.destroy();
              done();
            })
          })
        });
      });
    });
  });

  it("fires storage events.", function(done) {
    connect('storage1', function(c1) {
      var courier1 = c1, courier2, callback1, callback2, storage1, storage2;
      storage1 = courier1.consumer('storage');
      storage1.on('change', callback1 = function(evt) {
        if (oldValueSupport) expect(evt.oldValue).to.not.be.ok();
        expect(evt.newValue).to.be('value');
        storage1.off('change', callback1);
        storage1.on('change', callback2 = function(evt) {
          if (oldValueSupport) expect(evt.oldValue).to.be('value');
          expect(evt.newValue).to.be('different');
          courier1.destroy();
          courier2.destroy();
          done();
        });
        storage2.set('test', 'different');
      });

      connect('storage2', function(c2) {
        courier2 = c2;
        storage2 = courier2.consumer('storage');
        storage2.set('test', 'value');
      });
    });
  });

});
