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
              loader: 'babel',
              query: {
                presets: [
                  require.resolve('babel-preset-es2015'),
                  require.resolve('babel-preset-react'),
                  require.resolve('babel-preset-stage-0')
                ]
              }
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
