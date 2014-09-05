if (location.search.match(/provider/)) {
  require('./provider')();
} else {
  require('./consumer')();
}
