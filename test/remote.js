var ift = require('../library/ift');
var config = {
  IFT_ORIGIN: location.origin
};

module.exports = function() {
  ift.define(ift.roles.REMOTE, 'test', function(__super__) {
    return {
      test: function() {
        console.log('remote #test called')
        return 'ack';
      }
    };
  });
  var transport = ift.connect({
    trustedOrigins: [config.IFT_ORIGIN]
  });
  var client = transport.client('test');
  client.on('test', function() {
    client.send('invoke', 'ack', []);
  });
};
