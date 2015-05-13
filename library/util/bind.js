// (ref `_.bind`)

var nativeBind = Function.prototype.bind;

module.exports = function (fn, ctx) {
  if (nativeBind) return fn.bind(ctx);
  return function() {
    return fn.apply(ctx, arguments);
  }
}
