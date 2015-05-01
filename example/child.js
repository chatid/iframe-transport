var ift = require('../library/services/storage');

ift.child({
  trustedOrigins: ['http://127.0.0.1:8000']
}).wiretap(function(direction, message) {
  ift.util.debug(direction, message);
}).service('example', IFTStorageService.Provider);