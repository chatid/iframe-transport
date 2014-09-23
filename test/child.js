var ift = require('../library/ift');
var origin = location.origin ? location.origin :
  location.protocol + '//' + location.hostname +
  (location.port ? ':' + location.port : '');
var config = {
  IFT_ORIGIN: origin
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
    service.channel.request('ack', []);
  });
};
