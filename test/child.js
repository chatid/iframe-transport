var ift = require('../library/ift');
var config = {
  IFT_ORIGIN: location.origin
};

module.exports = function() {
  ift.childClient('test', function(__super__) {
    return {
      test: function() {
        console.log('child #test called')
        return 'ack';
      }
    };
  });
  var transport = ift.child({
    parentOrigins: [config.IFT_ORIGIN]
  });
  var client = transport.client('test');
  client.on('test', function() {
    client.send('invoke', 'ack', []);
  });
};
