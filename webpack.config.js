var webpack = require('webpack'),
    path = require('path');

module.exports = {
  devtool: 'source-map',
  entry: {
    'ift': './library/ift',
    'IFTStorageService': './library/services/storage'
  },
  output: {
    path: __dirname + '/build',
    filename: '[name].js',
    library: '[name]',
    libraryTarget: 'umd'
  },
  resolve: {
    root: [path.join(__dirname, 'bower_components')]
  },
  plugins: [
    new webpack.ResolverPlugin(
      new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('bower.json', ['main'])
    )
  ]
};
