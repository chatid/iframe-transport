module.exports = function(array, object) {
  for (var i = 0; i < array.length; i++) {
    if (array[i] === object) {
      return i;
    }
  }
  return -1;
}
