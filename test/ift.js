var query = require('./utility').parseQuery(location.search);

var suites = {
  'transport': require('./transport/child'),
  'storage': require('./services/storage-child')
};

if (query.route == 'child') {
  suites[query.suite][query.target]();
} else {
  require('./transport/parent');
  require('./services/storage-parent');
}
