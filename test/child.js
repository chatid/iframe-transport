module.exports = function() {
  var query = location.search;
  if (query.match(/transport/)) require('./transport/child');
  else if (query.match(/storage/)) require('./services/storage-child');
};
