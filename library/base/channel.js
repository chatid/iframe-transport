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
  if (Channel._namespaces.indexOf(namespace) >= 0) {
    throw new Error("Channel with namespace '" + namespace + "' already exists");
  }
  Channel._namespaces.push(namespace);

  this.namespace = namespace;
  this.transport = transport;
  this._callbacks = {};

  this.transport.on('incoming', this._onIncoming, this);
};

mixin(Channel, {

  JSONRPCError: JSONRPCError,

  reset: function() {
    this._namespaces = [];
  },

  _namespaces: []

});

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
    if (typeof result !== 'undefined') data.result = result;
    else data.error = error;
    this.send(data);
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
  },

  _onIncoming: function(message) {
    message = this.deserialize(message);
    if (!message || message.channel !== this.namespace) return;
    if (message.data.error) {
      throw new JSONRPCError(message.data.error.code, message.data.error.message);
    } else {
      this._processRPC(message.data);
    }
  },

  // Signal a request or resolve a callback with response.
  // TODO: handle notifications.
  _processRPC: function(data) {
    if (data.method) {
      try {
        this.trigger('request', data.id, data.method, data.params);
      } catch (e) {
        this.respond(data.id, void 0, {
          code: e.code,
          message: e.message,
          data: {
            stack: e.stack
          }
        });
      }
    } else if (data.id) {
      var callback = this._callbacks[data.id];
      callback(data.result, data.error);
      this._callbacks[data.id] = null;
    }
  },

});
