var slice = [].slice;

module.exports = function() {
  var args = slice.call(arguments);
  args.unshift(document.title);
  console.log.apply(console, args);
};
