var support = module.exports = {
  // http://peter.michaux.ca/articles/feature-detection-state-of-the-art-browser-scripting
  has: function(object, property){
    var t = typeof object[property];
    return t == 'function' || (!!(t == 'object' && object[property])) || t == 'unknown';
  },
  on: function(target, name, callback) {
    support.has(window, 'addEventListener') ?
      target.addEventListener(name, callback, false) :
      target.attachEvent('on' + name, callback);
  },
  off: function(target, name, callback) {
    support.has(window, 'removeEventListener') ?
      target.removeEventListener(name, callback, false) :
      target.detachEvent('on' + name, callback);
  },
  // https://github.com/Modernizr/Modernizr/pull/1250/files
  structuredClones: (function() {
    var structuredClones = true;
    try {
      window.postMessage({
        toString: function () {
          structuredClones = false;
          return 'ping';
        }
      }, '*');
    } catch (e) {}
    return structuredClones;
  })()
};
