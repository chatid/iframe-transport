var webpack = require('webpack');

module.exports = {
    entry: {
      "main": "./src/main",
      "IFT": "./lib/IFT",
      "example": "./example/example.js"
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
              loader: 'babel?presets[]=es2015&presets[]=react&presets[]=stage-0'
            },
            {
              test: /\.json?$/,
              loader: 'json'
            }
        ]
    },
    externals: {
      IFTmap: "IFTmap"
    },
    plugins: [
      new webpack.DefinePlugin({
        __TEST__: JSON.stringify(process.env.TEST)
      })
    ]
};
