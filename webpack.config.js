var webpack = require('webpack');

module.exports = {
    entry: {
      "main": "./src/main",
      "IFT": "./lib/IFT"
    },
    output: {
      libraryTarget: 'umd',
      library: 'iframe-transport',
      path: "./build",
      filename: '[name].js',
      publicPath: '/'
    },
    module: {
        loaders: [
            {
              test: /\.js?$/,
              exclude: /(node_modules)/,
              loader: 'babel?presets[]=es2015&presets[]=stage-0'
            },
            {
              test: /\.json?$/,
              loader: 'json'
            }
        ]
    },
    externals: {
      IFTmap: "IFTmap"
    }
};
