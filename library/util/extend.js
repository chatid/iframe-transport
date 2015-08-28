var mixin = require('./mixin');

// (ref Backbone `extend`)
// Helper function to correctly set up the prototype chain, for subclasses.
module.exports = function(protoProps, staticProps) {
  var parent = this;
  var child;

  if (protoProps && protoProps.hasOwnProperty('constructor')) {
    child = protoProps.constructor;
  } else {
    child = function(){ return parent.apply(this, arguments); };
  }

  mixin(child, parent, staticProps);

  var Surrogate = function(){ this.constructor = child; };
  Surrogate.prototype = parent.prototype;
  child.prototype = new Surrogate;

  mixin(child.prototype, protoProps);

  return child;
};
