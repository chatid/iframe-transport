var assert = require('assert');
var ift = require('../library/ift');

var childOrigin = '<%= childOrigin %>';
var childPath = '<%= childPath %>';

describe('ift', function() {
  it("first test", function(done) {
    ift.parent({
      childOrigin: childOrigin,
      childPath: childPath
    }).ready(function(manager) {
      var channel = manager.channel('test');
      channel.request('hello', ['child!'], function(response) {
        assert.strictEqual(response, "hello parent!");
        done();
      });
    });
  });
});
