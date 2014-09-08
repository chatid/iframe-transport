var ift = require('../library/ift');
var config = {
  IFT_ORIGIN: location.origin
};

module.exports = function() {
  ift.registerService('test', ift.Service.extend({
    test: function() {
      console.log('remote #test called');
      return 'ack';
    }
  }));
  var courier = ift.connect({
    trustedOrigins: [config.IFT_ORIGIN]
  });
  var service = courier.service('test');
  service.on('test', function() {
    service._channel.request('ack', []);
  });
};
