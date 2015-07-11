var defaultConfig = require('./karma.conf');

var sauceLaunchers = {
  ie9: {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    platform: 'Windows 7',
    version: '9'
  },
  ie10: {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    platform: 'Windows 7',
    version: '10'
  },
  ie11: {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    platform: 'Windows 8.1',
    version: '11'
  }
}

module.exports = function (config) {

  defaultConfig(config);

  config.set({

    sauceLabs: {
      testName: 'iframe-transport Unit Tests'
    },

    customLaunchers: sauceLaunchers,

    browsers: Object.keys(sauceLaunchers),

    reporters: ['dots', 'saucelabs'],

    singleRun: true

  });

};
