var rewirePlugin = require('rewire-webpack'),
    webpackConfig = require('./webpack.config'),
    express = require('express');

var DEBUG = process.env.DEBUG;


webpackConfig = Object.create(webpackConfig)

// Source maps take a long time to compile. Only use if debugging
if (DEBUG) {
  webpackConfig.devtool = 'source-map'
}

webpackConfig.plugins = [new rewirePlugin()];


// Kind of a hack? Use framework plugin to fire up a
// server on a different port for x-origin child page.
var ChildServer = function(config, logger) {
  var server = express();
  server.set('views', './test/child');
  server.set('view engine', 'ejs');
  server.use('/dist', express.static('dist'));
  server.get(config.childServer.path || '/test/child', function(req, res) {
    var parentOrigins = ['http://' + config.hostname + ':' + config.port];
    if (config.hostname == 'localhost') {
      parentOrigins.push('http://127.0.0.1:' + config.port);
    }
    res.render('index', { parentOrigins: JSON.stringify(parentOrigins) });
  });
  server.listen(config.childServer.port);
  logger.create('child-server').info("Child server started at http://" + config.childServer.host + ":" + config.childServer.port);
};

var ejs = require('ejs');
var createEJSPreprocessor = function(/* config.childServer */ config, done) {
  return function(content, file, done) {
    done(null, ejs.render(content, {
      childOrigin: 'http://' + (config.host || '127.0.0.1') + ':' + (config.port || 6789),
      childPath: config.path || '/test/child'
    }));
  };
};


module.exports = function (config) {

  config.set({
    basePath: '',

    frameworks: ['mocha', 'sinon', 'childServer'],


    // Either target the testindex.js file to get one
    // big webpack bundle full of tests, which are then
    // run.  Or else, target individual test files
    // directly, in which case you get a webpack bundleOptions
    // for each test file.
    // https://github.com/webpack/karma-webpack

    // individual test bundles
    files: [
      'test/ift.js'
    ],

    // // single test bundle
    // files: [
    //   'test/suite.coffee'
    // ],

    exclude: [],

    // individual test bundles
    preprocessors: {
      'test/ift.js': ['webpack', 'ejs', 'sourcemap']
    },

    client: {
      mocha: {
        ui: 'bdd'
      }
    },

    // // single test bundle
    // preprocessors:
    //   'test/suite.coffee': ['webpack', 'sourcemap']

    webpack: webpackConfig,

    plugins: [
      require('karma-webpack'),
      require('karma-mocha'),
      require('karma-phantomjs-launcher'),
      require('karma-chrome-launcher'),
      require('karma-firefox-launcher'),
      require('karma-sourcemap-loader'),
      require('karma-sinon'),
      {'framework:childServer': ['type', ChildServer]},
      {'preprocessor:ejs': ['factory', createEJSPreprocessor]}
    ],

    childServer: {
      host: '127.0.0.1',
      port: 6789,
      path: '/test/child'
    },

    webpackServer: {
      stats: {
        colors: true
      }
    },

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_DEBUG,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera (has to be installed with `npm install karma-opera-launcher`)
    // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
    // - PhantomJS
    // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
    browsers: ['PhantomJS'],

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};
