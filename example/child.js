var ift = require('../library/services/storage');

ift.connect({
  trustedOrigins: ['http://127.0.0.1:4000']
}).service('storage');
