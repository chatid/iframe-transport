var assert = require('assert');
var ift = require('../../library/ift');
var Transport = require('../../library/base/transport');
var Channel = ift.Channel;
var Manager = require('../../library/base/manager');
var Service = ift.Service;

describe('Manager', function() {
  var transport;

  beforeEach(function() {
    transport = new Transport(['http://origin']);
  });
  afterEach(function() {
    Channel.reset();
  });

  it("constructs services from passed in array of [namespace, ctor] pairs when transport is ready", function() {
    var Service1 = sinon.stub();
    var Service2 = sinon.stub();
    var manager = new Manager(transport, [
      ift.service('service1', Service1),
      ift.service('service2', Service2)
    ]);
    sinon.assert.notCalled(Service1);
    sinon.assert.notCalled(Service2);
    var callback = sinon.spy(function() {
      sinon.assert.calledOnce(Service1);
      sinon.assert.calledWith(Service1, sinon.match.instanceOf(Channel));
      sinon.assert.calledOnce(Service2);
      sinon.assert.calledWith(Service2, sinon.match.instanceOf(Channel));
    });
    transport.ready(callback);
    sinon.assert.notCalled(callback);
    transport.trigger('ready');
    sinon.assert.calledOnce(callback);
  });

  describe('#ready', function() {
    it("passes instantiated services to callback", function() {
      var Service1 = sinon.stub();
      var Service2 = sinon.stub();
      var manager = new Manager(transport, [
        ift.service('service1', Service1),
        ift.service('service2', Service2)
      ]);
      var callback = sinon.spy(function(transport, service1, service2) {
        assert(service1 instanceof Service1);
        assert(!(service1 instanceof Service2));
        assert(service2 instanceof Service2);
        assert(!(service2 instanceof Service1));
      });
      manager.ready(callback);
      sinon.assert.notCalled(callback);
      transport.trigger('ready');
      sinon.assert.calledOnce(callback);
    });
  });

  describe('#service', function() {
    var serialize, deserialize;

    before(function() {
      // Perhaps move de/serialize into Transport
      serialize = sinon.stub(Channel.prototype, 'serialize', sinon.stub().returnsArg(0));
      deserialize = sinon.stub(Channel.prototype, 'deserialize', sinon.stub().returnsArg(0));
    });
    after(function() {
      serialize.restore();
      deserialize.restore();
    });

    it("constructs a service on which it orchestrates request/response", function() {
      var manager = new Manager(transport);
      var TestService = Service.extend({
        method: function() {
          return 'response';
        }
      });
      manager.service('test', TestService);
      var send = sinon.stub(transport, 'send');
      transport.trigger('incoming', {
        channel: 'test',
        data: {
          id: 1,
          method: 'method'
        }
      });
      sinon.assert.calledOnce(send);
      sinon.assert.calledWithMatch(send, {
        channel: 'test',
        data: {
          jsonrpc: '2.0',
          id: 1,
          result: 'response'
        }
      });
    });

    it("constructs a service on which it orchestrates request/error", function() {
      var manager = new Manager(transport);
      var TestService = Service.extend({
        method: function() {
          throw new Error('message');
        }
      });
      manager.service('test', TestService);
      var send = sinon.stub(transport, 'send');
      transport.trigger('incoming', {
        channel: 'test',
        data: {
          id: 1,
          method: 'method'
        }
      });
      sinon.assert.calledOnce(send);
      sinon.assert.calledWithMatch(send, {
        channel: 'test',
        data: {
          jsonrpc: '2.0',
          id: 1,
          error: {
            code: -32000,
            message: 'message'
          }
        }
      });
    });
  });
});
