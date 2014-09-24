var ift = require('../../library/ift');
var config = require('../config');

exports.generic = function() {

  ift.registerService('transport', ift.Service.extend({
    test: function() {
      return 'ack';
    }
  }));
  var courier = ift.connect({
    trustedOrigins: [config.IFT_ORIGIN]
  });
  var service = courier.service('transport');
  service.on('test', function() {
    service.channel.request('ack', []);
  });

};
