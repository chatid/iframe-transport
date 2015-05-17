var assert = require('assert');
var ift = require('../library/ift');
var util = require('./util');

describe('ift', function() {
  var createIframe = sinon.stub(), _createIframe, stubChild;

  before(function() {
    // Hook into ParentTransport#_createIframe to attach a `code` query param
    // containing a raw function to execute on the child page for a given test.
    _createIframe = ift.ParentTransport.prototype._createIframe;
    stubChild = function(code) {
      createIframe = sinon.stub(ift.ParentTransport.prototype, '_createIframe', function(uri) {
        return _createIframe.call(this, uri + '?code=' + encodeURIComponent(code));
      });
    };
  });

  afterEach(function() {
    // Restore iframe creation if it had been stubbed for mocking child's code.
    if (createIframe.restore) createIframe.restore();
  });

  describe('ParentTransport', function() {
    describe("#constructor", function() {
      it("creates an iframe from CHILD_ORIGIN and CHILD_PATH", function() {
        var transport = new ift.ParentTransport(CHILD_ORIGIN, CHILD_PATH);
        assert.strictEqual(transport.iframe.src, CHILD_ORIGIN + CHILD_PATH);
      });
    });

    describe("#ready", function() {
      it("invokes callback once child sends 'ready' postMessage", function() {
        createIframe = sinon.stub(ift.ParentTransport.prototype, '_createIframe');

        var transport = new ift.ParentTransport(CHILD_ORIGIN, CHILD_PATH);
        var callback = sinon.stub();
        transport.ready(callback);

        sinon.assert.notCalled(callback);

        util.dispatchEvent(window, 'message', {
          data: 'ready',
          origin: CHILD_ORIGIN
        }, 'MessageEvent', ['data', 'origin']);

        sinon.assert.calledOnce(callback);
        sinon.assert.calledWith(callback, transport);
      });

      it("only invokes callback once", function() {
        createIframe = sinon.stub(ift.ParentTransport.prototype, '_createIframe');

        var transport = new ift.ParentTransport(CHILD_ORIGIN, CHILD_PATH);
        var callback = sinon.stub();
        transport.ready(callback);

        sinon.assert.notCalled(callback);

        util.dispatchEvent(window, 'message', {
          data: 'ready',
          origin: CHILD_ORIGIN
        }, 'MessageEvent', ['data', 'origin']);

        sinon.assert.calledOnce(callback);

        util.dispatchEvent(window, 'message', {
          data: 'ready',
          origin: CHILD_ORIGIN
        }, 'MessageEvent', ['data', 'origin']);

        sinon.assert.calledOnce(callback);

        transport.trigger('ready');

        sinon.assert.calledOnce(callback);
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
