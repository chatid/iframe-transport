var Transport = require('./transport');

// Implement the transport class from the parent's perspective.
var Parent = module.exports = Transport.extend({

  constructor: function(name, childOrigin, childPath) {
    this.name = name || 'default';
    this.childOrigin = childOrigin || 'http://localhost:8000';
    this.childUri = childOrigin + childPath || '/child.html';
    this.iframe = this._createIframe(this.childUri, this.name);

    Transport.call(this, [childOrigin]);
  },

  listen: function() {
    var once;
    this.on('message', once = function(message) {
      if (message !== 'ready') return;
      this.readyState = 1;
      this.trigger('ready');
      this.off('message', once, this);
    }, this);
    return Transport.prototype.listen.apply(this, arguments);
  },

  send: function(message) {
    this.iframe.contentWindow.postMessage(message, this.childOrigin);
  },

  destroy: function() {
    Transport.prototype.destroy.apply(this, arguments);
    this.iframe.parentNode.removeChild(this.iframe);
  },

  _createIframe: function(uri, name) {
    var iframe = document.getElementById('ift_' + name);
    if (iframe) return iframe;

    iframe = document.createElement('iframe');
    iframe.id = 'ift_' + name;
    iframe.name = 'ift_' + name;
    iframe.style.position = 'absolute';
    iframe.style.top = '-2000px';
    iframe.style.left = '0px';
    iframe.src = uri;
    iframe.border = iframe.frameBorder = 0;
    iframe.allowTransparency = true;

    document.body.appendChild(iframe);

    return iframe;
  }

});