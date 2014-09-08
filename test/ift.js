if (location.search.match(/child/)) {
  require('./child')();
} else {
  require('./parent')();
}
