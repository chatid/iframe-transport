var ift = require('../../library/ift');
var Exec = require('../../library/services/exec');

ift.child({
  trustedOrigins: PARENT_ORIGINS
}).service('exec', Exec, [ift]);
