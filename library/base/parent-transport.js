var Transport = require('./transport');

// Implement the transport class from the parent's perspective.
var ParentTransport = module.exports = Transport.extend({

  constructor: function(childOrigin, childPath) {
    this.childOrigin = childOrigin || 'http://localhost:8000';
    this.childUri = childOrigin + childPath || '/child.html';
    this._createIframe(this.childUri);

    Transport.call(this, [childOrigin]);
  },

  listen: function() {
    var once;
    this.on('incoming', once = function(message) {
      if (message !== 'ready') return;
      this.readyState = 1;
      this.trigger('ready');
      this.off('incoming', once, this);
    }, this);
    return Transport.prototype.listen.apply(this, arguments);
  },

  send: function(message) {
    if (!this.iframe.contentWindow) {
      throw new Error("Parent iframe not ready, use Manager#ready or Transport#ready");
    }
    this.iframe.contentWindow.postMessage(message, this.childOrigin);
    this.trigger('outgoing', message);
  },

  destroy: function() {
    Transport.prototype.destroy.apply(this, arguments);
    if (this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
    }
  },

  _createIframe: function(uri) {
    var iframe = this.iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-2000px';
    iframe.style.left = '0px';
    iframe.src = uri;
    iframe.border = iframe.frameBorder = 0;
    iframe.allowTransparency = true;

    document.body.appendChild(iframe);
  }

});
