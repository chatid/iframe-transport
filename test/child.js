var IFT = require('../library/ift');

module.exports = function() {
  var ift = new IFT.Child([location.origin]);
  var TestClient = IFT.Client.extend({
    test: function() {
      return 'cb';
    }
  });
  new TestClient(ift);
};
