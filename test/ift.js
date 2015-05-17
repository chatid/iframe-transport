var assert = require('assert');
var ift = require('../library/ift');
var support = require('../library/util/support');

// Hook into ParentTransport#_createIframe to attach a `code` query param
// containing a raw function to execute on the child page for a given test.
var _createIframe = ift.ParentTransport.prototype._createIframe;
var child = function(code) {
  ift.ParentTransport.prototype._createIframe = function(uri) {
    return _createIframe.call(this, uri + '?code=' + encodeURIComponent(code));
  };
};

describe('ift', function() {
  afterEach(function() {
    ift.ParentTransport.prototype._createIframe = _createIframe;
  });

  describe('ParentTransport', function() {
    describe("#constructor", function() {
      it("creates an iframe from CHILD_ORIGIN and CHILD_PATH", function() {
        var transport = new ift.ParentTransport(CHILD_ORIGIN, CHILD_PATH);
        assert.strictEqual(transport.iframe.src, CHILD_ORIGIN + CHILD_PATH);
      });
    });

    describe("#ready", function() {
      it("invokes callback once child sends 'ready' postMessage", function(done) {
        var readyMessage = sinon.stub();
        support.on(window, 'message', readyMessage);

        child(function(ift) {
          var transport = new ift.ChildTransport(PARENT_ORIGINS);
        });

        var transport = new ift.ParentTransport(CHILD_ORIGIN, CHILD_PATH);
        transport.ready(function() {
          sinon.assert.calledOnce(readyMessage);
          sinon.assert.calledWithMatch(readyMessage, { data: 'ready' });
          done();
        });
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
