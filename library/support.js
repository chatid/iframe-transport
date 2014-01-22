var support = {
  storageEventTarget: ('onstorage' in document ? document : window)
};

// http://peter.michaux.ca/articles/feature-detection-state-of-the-art-browser-scripting
support.has = function(object, property){
  var t = typeof object[property];
  return t == 'function' || (!!(t == 'object' && object[property])) || t == 'unknown';
}

if (support.has(window, 'addEventListener')) {
  support.on = function(target, name, callback) {
    target.addEventListener(name, callback, false);
  }
  support.off = function(target, name, callback) {
    target.removeEventListener(name, callback, false);
  }
} else if (support.has(window, 'attachEvent')) {
  support.on = function(object, name, callback) {
    object.attachEvent('on' + name, callback);
  }
  support.off = function(object, name, callback) {
    object.detachEvent('on' + name, callback);
  }
}
