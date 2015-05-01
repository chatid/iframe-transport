// Events
// ------

var slice = [].slice;

// (ref `Backbone.Events`)
// A module that can be mixed in to any object to provide it with custom events.
var Events = module.exports = {
  on: function(name, callback, context) {
    this._events || (this._events = {});
    (this._events[name] = this._events[name] || []).unshift({
      callback: callback,
      context: context || this
    });
    return this;
  },

  off: function(name, callback) {
    if (!this._events) return this;
    if (!name) {
      this._events = void 0;
      return this;
    }
    var listeners = this._events[name],
        i = listeners.length,
        listener;
    while (i--) {
      listener = listeners[i];
      if (!callback || listener.callback === callback) {
        listeners.splice(i, 1);
      }
    }
  },

  trigger: function(name) {
    if (!this._events) return this;
    var args = slice.call(arguments, 1);

    var listeners = this._events[name] || [],
        i = listeners.length;
    while (i--) {
      listeners[i].callback.apply(listeners[i].context, args);
    }
  }
};
