var mixin    = require('../util/mixin'),
    support  = require('../util/support'),
    uniqueId = require('../util/uniqueId'),
    Events   = require('./events');

var JSONRPCError = function(code, message) {
  this.code = code;
  this.message = '[JSONRPCError] ' + message;
};

JSONRPCError.prototype = Error.prototype;

// Facilitate multiplexed JSON-RPC.
var Channel = module.exports = function(namespace, transport) {
  this.namespace = namespace;
  this.transport = transport;
  this._callbacks = {};

  this.transport.on('incoming', function(message) {
    message = this.deserialize(message);
    if (!message || message.channel !== this.namespace) return;
    if (message.data.error) {
      throw new JSONRPCError(message.data.error.code, message.data.error.message);
    } else {
      this.process(message.data);
    }
  }, this);
};

mixin(Channel.prototype, Events, {

  // Send a JSON-RPC-structured message over this channel.
  send: function(data) {
    data || (data = {});
    var message = {
      channel: this.namespace,
      data: mixin(data, { jsonrpc: '2.0' })
    };
    this.transport.send(this.serialize(message));
  },

  // Issue a unique request `id`, associate with callback if provided, and send request.
  request: function(method, params, callback) {
    var data = {
      method: method,
      params: params
    };
    if (typeof callback === 'function') {
      data.id = uniqueId('request');
      this._callbacks[data.id] = callback;
    }
    this.send(data);
  },

  // Build and send a response referencing request `id` and providing result or error.
  respond: function(id, result, error) {
    var data = {
      id: id
    };
    if (result) data.result = result;
    else data.error = error;
    this.send(data);
  },

  // Send an error message.
  error: function(code, message) {
    this.send({
      id: null,
      error: {
        code: code,
        message: message
      }
    });
  },

  // Signal a request or resolve a callback with response.
  // TODO: handle notifications.
  process: function(data) {
    if (data.method) {
      try { this.trigger('request', data.id, data.method, data.params); }
      catch (e) { this.error(e.code, e.message); }
    } else if (data.id) {
      var callback = this._callbacks[data.id];
      callback(data.result, data.error);
      this._callbacks[data.id] = null;
    }
  },

  serialize: function(object) {
    return support.structuredClones ? object : JSON.stringify(object);
  },

  deserialize: function(message) {
    try {
      return support.structuredClones ? message : JSON.parse(message);
    } catch (e) { return; }
  },

  destroy: function() {
    this.off();
  }

});
