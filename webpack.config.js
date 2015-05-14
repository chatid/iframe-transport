module.exports = {
  devtool: 'source-map',
  entry: {
    'ift': './library/ift',
    'IFTStorageService': './library/services/storage'
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name].js',
    library: '[name]',
    libraryTarget: 'umd'
  }
};
