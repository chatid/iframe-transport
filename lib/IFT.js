// [I][F]rame [T]ranspot

const IFRAME_SRC = '/iframe.html';

export default class IFT {

  constructor(chatid_domain='https://iframe.chatid.com') {
    this.iframe_domain = chatid_domain; // No trailing slash
  	this.create_iframe();
  	this.start_listening();
    this.cbs = {};
  };

  create_iframe = () => {
  	this.iframe_loaded = false;
  	this.iframe = document.createElement("iframe");
    this.iframe.src = this.iframe_domain + IFRAME_SRC;
    this.iframe.sandbox = 'allow-scripts allow-same-origin';
  	// this.iframe.frameborder = 0; // HTML 4 only
  	this.iframe.height = 0;
  	this.iframe.width = 0;
    this.iframe.visibility = 'hidden';
  	document.body.appendChild(this.iframe);
  };

  on = (e, cb) => {
    this.cbs[e] = cb;
  }

  start_listening = () => {
    let that = this;
  	let cb = (event) => {
      let data = event.data;
      if (data.action == "loaded") { // can be from any origin
        that.iframe_loaded = true;
        // that.retry_queued();
      } else if (event.origin !== that.iframe_domain) {
        return;
  		}
      // Call handler
      if (data.action in this.cbs) {
        this.cbs[data.action](data.data);
      }
    }

  	if (window.addEventListener) {
  		window.addEventListener("message", cb, false);
  	} else {
  		window.attachEvent("onmessage", function() {
        return cb(window.event);
      });
  	}
  };

  // API

  iframe_send = (data) => {
  	if (!this.iframe_loaded) throw "not ready";
  	this.iframe.contentWindow.postMessage(data, this.iframe_domain);
  };

  get = () => {
    return this.iframe_send({action: "get"});
  };

  broadcast = (data) => {
    return this.iframe_send({action: "broadcast", data: data});
  };

  poll = () => {
    setInterval(() => {
      return this.iframe_send({action: "poll"});
    }, 300);
  };

  reset = () => {
    return this.iframe_send({action: "reset"});
  }

};
