var ift = require('../../library/ift');
var config = require('../config');

require('../../library/services/storage');
require('../../library/services/storage-compat');

ift.connect({
  trustedOrigins: [config.IFT_ORIGIN]
}).service('storage');
