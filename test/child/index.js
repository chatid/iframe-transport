var ift = require('../../library/ift');
var util = require('../util');

var query = util.parseQuery(location.search);

// `eval` arbitrary code passed in by the parent,
// providing `ift` as only dependency.
if (query.code) eval('(' + query.code + ')(ift)');
