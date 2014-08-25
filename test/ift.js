if (location.search.match(/remote/)) {
  require('./remote')();
} else {
  require('./local')();
}
