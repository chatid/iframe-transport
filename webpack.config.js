var webpack = require('webpack');

module.exports = {
  entry: {
    'ift': ['./library/ift.js'],
    'storage': ['./library/services/storage.js'],
    'storage-compat': ['./library/services/storage-compat.js']
  },
  output: {
    path: __dirname +'/build',
    filename: '[name].js'
  }
};
