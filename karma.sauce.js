var defaultConfig = require('./karma.conf');

var sauceLaunchers = {
  chromeMac: {
    base: 'SauceLabs',
    browserName: 'chrome',
    platform: 'OS X 10.10'
  },
  firefoxMac: {
    base: 'SauceLabs',
    browserName: 'firefox',
    platform: 'OS X 10.10'
  },
  chromeWin7: {
    base: 'SauceLabs',
    browserName: 'chrome',
    platform: 'Windows 7'
  },
  firefoxWin7: {
    base: 'SauceLabs',
    browserName: 'chrome',
    platform: 'Windows 7'
  },
  chromeWin8_1: {
    base: 'SauceLabs',
    browserName: 'chrome',
    platform: 'Windows 8.1'
  },
  firefoxWin8_1: {
    base: 'SauceLabs',
    browserName: 'chrome',
    platform: 'Windows 8.1'
  },
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
