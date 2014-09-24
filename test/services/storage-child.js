var ift = require('../../library/ift');
var config = require('../config');

require('../../library/services/storage');
require('../../library/services/storage-compat');

exports.generic = function() {
  ift.connect({
    trustedOrigins: [config.IFT_ORIGIN]
  }).service('storage');
};

exports.storage1 = exports.storage2 = exports.generic;
