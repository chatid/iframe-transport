var assert = require('assert');
var ift = require('../library/ift');
var util = require('./util');

describe('ift', function() {
  var createIframe = sinon.stub(), _createIframe;

  // Hook into ParentTransport#_createIframe to attach a `code` query param
  // containing a raw function to execute on the child page for a given test.
  _createIframe = ift.ParentTransport.prototype._createIframe;
  function stubChild(code) {
    createIframe = sinon.stub(ift.ParentTransport.prototype, '_createIframe', function(uri) {
      return _createIframe.call(this, uri + '?code=' + encodeURIComponent(code));
    });
  }

  function dispatchMessageEvent(data, origin) {
    util.dispatchEvent(window, 'message', {
      data: data,
      origin: origin
    }, 'MessageEvent', ['data', 'origin']);
  }

  describe('ParentTransport', function() {
    describe("#constructor", function() {
      it("creates an iframe from CHILD_ORIGIN and CHILD_PATH", function() {
        var transport = new ift.ParentTransport(CHILD_ORIGIN, CHILD_PATH);
        assert.strictEqual(transport.iframe.src, CHILD_ORIGIN + CHILD_PATH);
      });
    });

    describe("#ready", function() {
      var transport, callback;

      beforeEach(function() {
        createIframe = sinon.stub(ift.ParentTransport.prototype, '_createIframe');
        transport = new ift.ParentTransport(CHILD_ORIGIN, CHILD_PATH);
        callback = sinon.stub();
      });

      afterEach(function() {
        createIframe.restore();
      });

      it("invokes callback once child sends 'ready' postMessage", function() {
        transport.ready(callback);
        sinon.assert.notCalled(callback);
        dispatchMessageEvent('ready', CHILD_ORIGIN);
        sinon.assert.calledOnce(callback);
        sinon.assert.calledWith(callback, transport);
      });

      it("only invokes callback once", function() {
        transport.ready(callback);
        sinon.assert.notCalled(callback);
        dispatchMessageEvent('ready', CHILD_ORIGIN);
        sinon.assert.calledOnce(callback);
        dispatchMessageEvent('ready', CHILD_ORIGIN);
        sinon.assert.calledOnce(callback);
        transport.trigger('ready');
        sinon.assert.calledOnce(callback);
      });

      it("fires immediately if transport is already ready", function() {
        dispatchMessageEvent('ready', CHILD_ORIGIN);
        transport.ready(callback);
        sinon.assert.calledOnce(callback);
      });

      it("ignores 'message' events from non-targeted origins", function() {
        var incoming = sinon.stub();
        transport.on('incoming', incoming);
        dispatchMessageEvent('data', CHILD_ORIGIN);
        sinon.assert.calledOnce(incoming);
        dispatchMessageEvent('data', CHILD_ORIGIN + '1');
        sinon.assert.calledOnce(incoming);
      });
    });

    describe("#send", function() {
      it("calls postMessage on the iframe with message and CHILD_ORIGIN", function() {
        var transport = new ift.ParentTransport(CHILD_ORIGIN, CHILD_PATH);
        var postMessage = sinon.stub(transport.iframe.contentWindow, 'postMessage');
        transport.send('test');
        sinon.assert.calledOnce(postMessage);
        sinon.assert.calledWith(postMessage, 'test', CHILD_ORIGIN);
      });
    });
  });
});
