var assert = require('assert');
var ift = require('../../library/ift');
var Transport = require('../../library/base/transport');
var ParentTransport = ift.ParentTransport;
var ChildTransport = ift.ChildTransport;
var util = require('../util');

function dispatchMessageEvent(data, origin) {
  util.dispatchEvent(window, 'message', {
    data: data,
    origin: origin,
    lastEventId: '',
    source: window
  }, 'MessageEvent', ['data', 'origin', 'lastEventId', 'source']);
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
    // Browsers vary between string and number, which we don't care about.
    assert.strictEqual(transport.iframe.border + '', '0');
    assert.strictEqual(transport.iframe.frameBorder + '', '0');
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
      var iframe = transport.iframe;
      var postMessage = sinon.spy();
      // Can't just stub transport.iframe.contentWindow.postMessage
      // because SauceLabs IE throws "Permission denied"
      transport.iframe = {
        contentWindow: {
          postMessage: postMessage
        }
      };
      transport.send('test');
      sinon.assert.calledOnce(postMessage);
      sinon.assert.calledWith(postMessage, 'test', CHILD_ORIGIN);
      transport.iframe = iframe;
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
    var postMessage = sinon.stub(window.parent, 'postMessage');
    var transport = new ChildTransport(['http://origin']);
    sinon.assert.calledOnce(postMessage);
    sinon.assert.calledWith(postMessage, 'ready', '*');
    postMessage.restore();
  });
});
