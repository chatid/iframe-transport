var expect = require('expect.js');
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
    connect('storage1', function(courier1) {
      var storage1 = courier1.consumer('storage');
      storage1.on('change', function(evt) {
        expect(evt.oldValue).to.not.be.ok();
        expect(evt.newValue).to.be('value');
        done();
      });

      connect('storage2', function(courier2) {
        var storage2 = courier2.consumer('storage');
        storage2.set('test', 'value');
      });
    });
  });

  it("can handle lots of traffic.", function(done) {
    connect(function(courier) {
      var storage = courier.consumer('storage');
      var count = 0;
      var next = function() {
        if (++count > 1000) {
          storage.get('herp', function(herp) {
            done();
          });
          return;
        }
        storage.set('herp', 'derp' + count, next);
      };
      next();
    });
  });

});
