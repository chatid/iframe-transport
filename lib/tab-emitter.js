var EventEmitter = require('events').EventEmitter;
var emitters = {};

module.exports = function TabEmitter(key) {
  key = 'tabemitter' + (key || '');
  if (!emitters[key]) emitters[key] = makeEmitter(key);
  return emitters[key];
}

function makeEmitter(key) {
  var emitter = new EventEmitter();
  var originalEmit = emitter.emit;

  emitter.emit = function emit() {
    var args = [].slice.call(arguments);
    localStorage.setItem(key, JSON.stringify(args));
    localStorage.removeItem(key);
    return originalEmit.apply(emitter, args);
  };

  var oldValue = null; // the previous value

  var callback = function(ev) {
    if (ev.key === key && ev.newValue) {

      if (oldValue == ev.newValue) return; // ignore event if value has not changed

      var args = JSON.parse(ev.newValue);
      originalEmit.apply(emitter, args);
    }
  }
  window.addEventListener('storage', callback);

  // Fire fake events every 100ms for this localStorage key
  setInterval(() => {
    callback({ key: key, newValue: localStorage[key] });
  }, 100);

  return emitter;
}
