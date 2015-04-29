var ift = require('../library/services/storage'),
    domready = require('domready');

domready(function() {
  ift.connect({
    name: 'my_transport',
    childOrigin: 'http://127.0.0.1:4000',
    childPath: '/example/child.html'
  }).ready(function(courier) {
    courier.wiretap(function(direction, message) {
      console.log(direction, message);
    });
    var storage = courier.consumer('storage');
    storage.on('change', function(evt) {
      console.log('change event', evt);
    });
    storage.set('herp', 'sucka', function() {
      storage.get('herp', function(value) {
        console.log('got', value);
      });
    });
  });
});