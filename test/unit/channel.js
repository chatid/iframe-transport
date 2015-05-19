var assert = require('assert');
var ift = require('../../library/ift');
var Transport = require('../../library/base/transport');
var Channel = ift.Channel;

describe('Channel', function() {
  var serialize, deserialize, transport;

  before(function() {
    // Perhaps move de/serialize into Transport
    serialize = sinon.stub(Channel.prototype, 'serialize', sinon.stub().returnsArg(0));
    deserialize = sinon.stub(Channel.prototype, 'deserialize', sinon.stub().returnsArg(0));
  });
  after(function() {
    serialize.restore();
    deserialize.restore();
  });

  beforeEach(function() {
    transport = new Transport(['http://origin']);
  });
  afterEach(function() {
    Channel.reset();
  });

  it("processes messages from its channel and ignores messages from other channels", function() {
    var channel = new Channel('test', transport);
    var process = sinon.stub(channel, '_processRPC');
    transport.trigger('incoming', {
      channel: 'test',
      data: {}
    });
    sinon.assert.calledOnce(process);
    transport.trigger('incoming', {
      channel: 'other',
      data: {}
    });
    sinon.assert.calledOnce(process);
  });

  it("facilitates requests with callbacks", function() {
    var channel = new Channel('test', transport);
    var respond = function(message) {
      assert.strictEqual(message.data.method, 'method');
      assert.strictEqual(message.data.params.foo, 'bar');
      transport.trigger('incoming', {
        channel: 'test',
        data: {
          id: message.data.id,
          result: 'response'
        }
      });
    };
    var send = sinon.stub(transport, 'send', respond);
    var callback = sinon.stub();
    channel.request('method', { foo: 'bar' }, callback);
    sinon.assert.calledOnce(callback);
    sinon.assert.calledWith(callback, 'response');
  });

  it("keeps track of callbacks", function() {
    var channel = new Channel('test', transport);
    var respond = function(message) {
      transport.trigger('incoming', {
        channel: 'test',
        data: {
          id: message.data.id,
          result: message.data.params
        }
      });
    };
    var send = sinon.stub(transport, 'send', respond);

    var callback1 = sinon.stub();
    var callback2 = sinon.stub();

    channel.request('method', 'request1', callback1);
    channel.request('method', 'request2', callback2);
    sinon.assert.calledOnce(callback1);
    sinon.assert.calledOnce(callback2);

    channel.request('method', 'request1', callback1);
    sinon.assert.calledTwice(callback1);
    channel.request('method', 'request1', callback1);
    sinon.assert.calledThrice(callback1);
    sinon.assert.calledOnce(callback2);

    channel.request('method', 'request2', callback2);
    sinon.assert.calledThrice(callback1);
    sinon.assert.calledTwice(callback2);

    sinon.assert.alwaysCalledWith(callback1, 'request1');
    sinon.assert.alwaysCalledWith(callback2, 'request2');
  });

  it("throws when trying to create a channel with a namespace already in use", function() {
    new Channel('test', transport);
    assert.doesNotThrow(function() {
      new Channel('test1', transport);
    });
    assert.throws(function() {
      new Channel('test', transport);
    });
  });

  it("throws a JSONRPCError for incoming errors", function() {
    var channel = new Channel('test', transport);
    assert.throws(function() {
      transport.trigger('incoming', {
        channel: 'test',
        data: {
          id: null,
          error: {
            code: 'code',
            message: 'message'
          }
        }
      });
    }, function(error) {
      return (error instanceof Channel.JSONRPCError) &&
        (error.code === 'code') &&
        (error.message === '[JSONRPCError] message');
    });
  });

  it("sends an error when processing a request throws", function() {
    var channel = new Channel('test', transport);
    channel.on('request', sinon.stub().throws({
      code: 'code',
      message: 'message'
    }));
    var send = sinon.stub(channel, 'send');
    assert.doesNotThrow(function() {
      transport.trigger('incoming', {
        channel: 'test',
        data: {
          id: 1,
          method: 'method',
          params: 'params'
        }
      });
    });
    sinon.assert.calledOnce(send);
    sinon.assert.calledWith(send, sinon.match({
      id: 1,
      error: {
        code: 'code',
        message: 'message',
        data: {}
      }
    }));
  });

  it("cleans up on destroy", function() {
    var channel = new Channel('test', transport);
    var callback = sinon.stub();
    channel.on('request', callback);
    channel.trigger('request');
    sinon.assert.calledOnce(callback);
    channel.trigger('request');
    sinon.assert.calledTwice(callback);
    channel.destroy();
    channel.trigger('request');
    sinon.assert.calledTwice(callback);
  });
});
