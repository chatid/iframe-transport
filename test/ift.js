var assert = require('assert');
var ift = require('../library/ift');
var Transport = require('../library/base/transport');
var ParentTransport = ift.ParentTransport;
var ChildTransport = ift.ChildTransport;
var Channel = ift.Channel;
var util = require('./util');

describe('ift', function() {
  var createIframe = sinon.stub(), _createIframe;

  // Hook into ParentTransport#_createIframe to attach a `code` query param
  // containing a raw function to execute on the child page for a given test.
  _createIframe = ParentTransport.prototype._createIframe;
  function stubChild(code) {
    createIframe = sinon.stub(ParentTransport.prototype, '_createIframe', function(uri) {
      return _createIframe.call(this, uri + '?code=' + encodeURIComponent(code));
    });
  }

  function dispatchMessageEvent(data, origin) {
    util.dispatchEvent(window, 'message', {
      data: data,
      origin: origin
    }, 'MessageEvent', ['data', 'origin']);
  }

  describe('Transport', function() {
    it("ignores 'message' events from non-targeted origins", function() {
      var incoming = sinon.stub();
      var transport = new Transport(['http://origin1']);
      transport.on('incoming', incoming);
      dispatchMessageEvent('data', 'http://origin1');
      sinon.assert.calledOnce(incoming);
      dispatchMessageEvent('data', 'http://origin2');
      sinon.assert.calledOnce(incoming);
    });

    describe('#destroy', function() {
      it("stops listening for 'message'", function() {
        var transport = new Transport(['http://origin']);
        var incoming = sinon.stub();
        transport.on('incoming', incoming);
        dispatchMessageEvent('data', 'http://origin');
        sinon.assert.calledOnce(incoming);
        transport.destroy();
        dispatchMessageEvent('data', 'http://origin');
        sinon.assert.calledOnce(incoming);
      });

      it("clears out event listeners", function() {
        var transport = new Transport(['http://origin']);
        var incoming = sinon.stub();
        transport.on('incoming', incoming);
        transport.trigger('incoming');
        sinon.assert.calledOnce(incoming);
        transport.destroy();
        transport.trigger('incoming');
        sinon.assert.calledOnce(incoming);
      });
    });
  });

  describe('ParentTransport', function() {
    it("creates an iframe from childOrigin and childPath", function() {
      var appendChild = sinon.stub(document.body, 'appendChild');
      var transport = new ParentTransport('http://origin', '/path');
      assert.strictEqual(transport.iframe.src, 'http://origin/path');
      appendChild.restore();
    });

    it("creates an iframe not visible on the page", function() {
      var transport = new ParentTransport(CHILD_ORIGIN, CHILD_PATH);
      assert(transport.iframe.offsetTop < 100);
      assert.strictEqual(transport.iframe.border, 0);
      assert.strictEqual(transport.iframe.frameBorder, '0');
    });

    describe('#ready', function() {
      var appendChild, transport, onReady;

      beforeEach(function() {
        appendChild = sinon.stub(document.body, 'appendChild');
        transport = new ParentTransport('http://origin', '/path');
        onReady = sinon.stub();
      });

      afterEach(function() {
        appendChild.restore();
      });

      it("invokes onReady once child sends 'ready' postMessage", function() {
        transport.ready(onReady);
        sinon.assert.notCalled(onReady);
        dispatchMessageEvent('ready', 'http://origin');
        sinon.assert.calledOnce(onReady);
        sinon.assert.calledWith(onReady, transport);
      });

      it("only invokes onReady once", function() {
        transport.ready(onReady);
        sinon.assert.notCalled(onReady);
        dispatchMessageEvent('ready', 'http://origin');
        sinon.assert.calledOnce(onReady);
        dispatchMessageEvent('ready', 'http://origin');
        sinon.assert.calledOnce(onReady);
        transport.trigger('ready');
        sinon.assert.calledOnce(onReady);
      });

      it("fires immediately if transport is already ready", function() {
        dispatchMessageEvent('ready', 'http://origin');
        transport.ready(onReady);
        sinon.assert.calledOnce(onReady);
      });
    });

    describe('#send', function() {
      it("calls postMessage on the iframe with message and childOrigin", function() {
        var transport = new ParentTransport(CHILD_ORIGIN, CHILD_PATH);
        var postMessage = sinon.stub(transport.iframe.contentWindow, 'postMessage');
        transport.send('test');
        sinon.assert.calledOnce(postMessage);
        sinon.assert.calledWith(postMessage, 'test', CHILD_ORIGIN);
        postMessage.restore();
      });
    });

    describe('#destroy', function() {
      it("removes iframe from the dom", function() {
        var transport = new ParentTransport(CHILD_ORIGIN, CHILD_PATH);
        assert(transport.iframe.parentNode);
        transport.destroy();
        assert.strictEqual(transport.iframe.parentNode, null);
      });
    });
  });

  describe('ChildTransport', function() {
    it("sends 'ready' message on instantiation", function() {
      var parent = window.parent;
      window.parent = {
        postMessage: sinon.stub()
      };
      var transport = new ChildTransport(['http://origin']);
      sinon.assert.calledOnce(window.parent.postMessage);
      sinon.assert.calledWith(window.parent.postMessage, 'ready', '*');
      window.parent = parent;
    });
  });

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
});
