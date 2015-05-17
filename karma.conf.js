var rewirePlugin = require('rewire-webpack'),
    webpackConfig = require('./webpack.config'),
    express = require('express'),
    webpack = require('webpack'),
    webpackDevMiddleware = require('webpack-dev-middleware');

var DEBUG = process.env.DEBUG;

var PARENT_ORIGINS = ['http://localhost:9876', 'http://127.0.0.1:6789'];
var CHILD_HOST = '127.0.0.1';
var CHILD_PORT = '6789';
var CHILD_ORIGIN = 'http://' + CHILD_HOST + ':' + CHILD_PORT;
var CHILD_PATH = '/test/child';

webpackConfig = Object.create(webpackConfig)

// Source maps take a long time to compile. Only use if debugging
if (DEBUG) {
  webpackConfig.devtool = 'source-map'
}

webpackConfig.plugins = webpackConfig.plugins || [];
webpackConfig.plugins.push(
  new rewirePlugin(),
  new webpack.DefinePlugin({
    PARENT_ORIGINS: JSON.stringify(PARENT_ORIGINS),
    CHILD_ORIGIN: JSON.stringify(CHILD_ORIGIN),
    CHILD_PATH: JSON.stringify(CHILD_PATH)
  })
);

// Kind of a hack? Use framework plugin to fire up a
// server on a different port for x-origin child page.
var ChildServer = function(config, logger) {
  var server = express();
  server.set('views', './test/child');
  server.set('view engine', 'ejs');
  var compiler = webpack({
    entry: './test/child/index',
    output: {
      filename: 'index.js',
      path: __dirname + CHILD_PATH,
      publicPath: CHILD_PATH
    }
  });
  server.use(webpackDevMiddleware(compiler, {
    publicPath: CHILD_PATH
  }));
  server.use('/dist', express.static('dist'));
  server.get(config.childServer.path || '/test/child', function(req, res) {
    res.render('index', { parentOrigins: JSON.stringify(PARENT_ORIGINS) });
  });
  server.listen(config.childServer.port);
  logger.create('child-server').info("Child server started at http://" + config.childServer.host + ":" + config.childServer.port);
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
      'test/ift.js': ['webpack', 'sourcemap']
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
      {'framework:childServer': ['type', ChildServer]}
    ],

    childServer: {
      host: CHILD_HOST,
      port: CHILD_PORT,
      path: CHILD_PATH
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
