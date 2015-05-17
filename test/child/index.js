var ift = require('../../library/ift');
var util = require('../util');

var query = util.parseQuery(location.search);

if (query.code) eval('(' + query.code + ')()');
