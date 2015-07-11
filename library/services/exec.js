var Service = require('../base/service');

var Exec = Service.extend({

  code: function(code) {
    this.channel.request('_code', [code.toString()]);
  },

  _code: function(code) {
    var exec = this;
    eval('(' + code + ')(exec)');
  }

});

module.exports = Exec;
