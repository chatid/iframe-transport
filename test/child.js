var IFT = require('../library/ift');

module.exports = function() {
  var ift = new IFT.Child([location.origin]);
  var TestClient = IFT.Client.extend({
    test: function() {
      return 'ack';
    }
  });
  var client = new TestClient(ift);
  client.on('test', function() {
    client.send('invoke', 'ack', []);
  });
};
