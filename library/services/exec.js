var Service = require('../base/service'),
    slice = [].slice;

var Exec = Service.extend({

  constructor: function(channel, deps) {
    this.deps = deps || [];
    Service.apply(this, arguments);
  },

  code: function(code) {
    this.channel.request('_code', [code.toString()]);
  },

  log: function() {
    this.channel.request('_log', slice.call(arguments));
  },

  _code: function(code) {
    var exec = this, deps = 'exec';
    for (var i = 0; i < this.deps.length; i++) {
      deps += ', this.deps[' + i + ']';
    }
    eval('(' + code + ')(' + deps + ')');
  },

  _log: function() {
    try {
      console.log.apply(console, arguments);
    } catch (e) {
      console.log(JSON.stringify(slice.call(arguments)));
    }
  }

});

module.exports = Exec;
