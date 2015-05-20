var assert = require('assert');
var ift = require('../../library/ift');
var ParentTransport = ift.ParentTransport;
var Channel = ift.Channel;

var createIframe = sinon.stub(), _createIframe, manager;

// Hook into ParentTransport#_createIframe to attach a `code` query param
// containing a raw function to execute on the child page for a given test.
_createIframe = ParentTransport.prototype._createIframe;
function stubChild(code) {
  createIframe = sinon.stub(ParentTransport.prototype, '_createIframe', function(uri) {
    return _createIframe.call(this, uri + '?code=' + encodeURIComponent(code));
  });
}

afterEach(function() {
  createIframe.restore();
  Channel.reset();
  manager.destroy();
});

it("facilitates multiplexed communication across origins", function(done) {
  stubChild(function() {
    ift.child({
      trustedOrigins: PARENT_ORIGINS
    }).ready(function(manager) {
      var channel1 = manager.channel('channel1');
      channel1.on('request', function(id, method, params) {
        channel1.respond(id, 'channel1 response');
      });

      var channel2 = manager.channel('channel2');
      channel2.on('request', function(id, method, params) {
        channel2.respond(id, 'channel2 response');
      });
    });
  });

  manager = ift.parent({
    childOrigin: CHILD_ORIGIN,
    childPath: CHILD_PATH
  });
  manager.ready(function() {
    var channel1 = manager.channel('channel1');
    channel1.request('method', 'params', function(response) {
      assert.strictEqual(response, 'channel1 response');
    });

    var channel2 = manager.channel('channel2');
    channel2.request('method', 'params', function(response) {
      assert.strictEqual(response, 'channel2 response');

      // [todo] done() after callbacks have resolved
      done();
    });
  });
});

it("keeps track of callbacks", function(done) {
  stubChild(function() {
    ift.child({
      trustedOrigins: PARENT_ORIGINS
    }).ready(function(manager) {
      var channel1 = manager.channel('channel1');
      channel1.on('request', function(id, method, params) {
        channel1.respond(id, method + params);
      });

      var channel2 = manager.channel('channel2');
      channel2.on('request', function(id, method, params) {
        channel2.respond(id, method + params);
      });
    });
  });

  manager = ift.parent({
    childOrigin: CHILD_ORIGIN,
    childPath: CHILD_PATH
  });
  manager.ready(function() {
    var channel1 = manager.channel('channel1');
    var channel2 = manager.channel('channel2');

    channel1.request('method', 'channel1', function(response) {
      assert.strictEqual(response, 'methodchannel1');
    });
    channel2.request('method', 'channel2', function(response) {
      assert.strictEqual(response, 'methodchannel2');
    });
    channel1.request('method', 'channel1');
    channel1.request('method', 'channel1', function(response) {
      assert.strictEqual(response, 'methodchannel1');
    });
    channel2.request('method', 'channel2');
    channel2.request('method', 'channel2', function(response) {
      assert.strictEqual(response, 'methodchannel2');
    });
    channel1.request('method', 'channel1');
    channel1.request('method', 'channel1', function(response) {
      assert.strictEqual(response, 'methodchannel1');

      // [todo] done() after callbacks have resolved
      done();
    });
  });
});
