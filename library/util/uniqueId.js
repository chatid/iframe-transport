// (ref `_.uniqueId`)
var idCounter = 0;
var uniqueId = module.exports = function(prefix) {
  var id = ++idCounter + '';
  return prefix ? prefix + id : id;
};
