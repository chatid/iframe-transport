var Service = require('../base/service');

var Exec = Service.extend({

  constructor: function(channel, deps) {
    this.deps = deps || [];
    Service.apply(this, arguments);
  },

  code: function(code) {
    this.channel.request('_code', [code.toString()]);
  },

  _code: function(code) {
    var exec = this, deps = 'exec';
    for (var i = 0; i < this.deps.length; i++) {
      deps += ', this.deps[' + i + ']';
    }
    eval('(' + code + ')(' + deps + ')');
  }

});

module.exports = Exec;
