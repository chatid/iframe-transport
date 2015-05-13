var slice = [].slice;

// (ref `_.extend`)
// Extend a given object with all the properties of the passed-in object(s).
var mixin = module.exports = function(obj) {
  var args = slice.call(arguments, 1),
      props;
  for (var i = 0; i < args.length; i++) {
    if (props = args[i]) {
      for (var prop in props) {
        obj[prop] = props[prop];
      }
    }
  }
  return obj;
};
