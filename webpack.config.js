var webpack = require('webpack'),
    path = require('path');

module.exports = {
  entry: {
    'ift': ['./library/ift.js'],
    'storage': ['./library/services/storage.js'],
    'storage-compat': ['./library/services/storage-compat.js'],
    'example-parent': './example/parent.js',
    'example-child': './example/child.js'
  },
  output: {
    path: __dirname +'/build',
    filename: '[name].js'
  },
  resolve: {
    root: [path.join(__dirname, "bower_components")]
  },
  plugins: [
    new webpack.ResolverPlugin(
      new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin("bower.json", ["main"])
    )
  ]
};
