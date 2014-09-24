var ift = require('../../library/ift');
var config = require('../config');

ift.registerService('transport', ift.Service.extend({
  test: function() {
    console.log('remote #test called');
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
