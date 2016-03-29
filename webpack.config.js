var webpack = require('webpack');

module.exports = {
    entry: {
      "main": "./src/main",
      "IFT": "./lib/IFT"
    },
    output: {
      libraryTarget: 'commonjs2',
      library: 'iframe-transport',
      path: "./build",
      filename: '[name].js',
      publicPath: '/build/'
    },
    module: {
        loaders: [
            {
              test: /\.js?$/,
              exclude: /(node_modules)/,
              loader: 'babel?presets[]=es2015&presets[]=react&presets[]=stage-0'
            },
            {
              test: /\.json?$/,
              loader: 'json'
            }
        ]
    }
};
