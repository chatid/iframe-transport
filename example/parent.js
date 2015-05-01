var ift = require('../library/services/storage');

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


ift.parent({
  childOrigin: 'http://127.0.0.1:4000',
  childPath: '/example/child.html'
}).wiretap(function(direction, message) {
  ift.util.debug(direction, message);
}).ready(function(manager) {
  var storage = manager.service('example', IFTStorageService.Consumer);
  storage.on('change', function(evt) {
    ift.util.debug('change event', evt);
  });
  storage.set('key', 'value', function() {
    storage.get('key', function(value) {
      ift.util.debug('got', value);
    });
  });
});