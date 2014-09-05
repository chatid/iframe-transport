var ift = require('../library/ift');
var config = {
  IFT_ORIGIN: location.origin
};

module.exports = function() {
  ift.registerProvider('test', ift.provider('base').extend({
    test: function() {
      console.log('remote #test called')
      return 'ack';
    }
  }));
  var transport = ift.connect({
    trustedOrigins: [config.IFT_ORIGIN]
  });
  var service = transport.service('test');
  service.on('test', function() {
    service.send('invoke', 'ack', []);
  });
};
