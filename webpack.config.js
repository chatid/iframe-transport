module.exports = {
  entry: {
    'ift': './library/ift',
    'IFTStorageService': './library/services/storage',
    'Exec': './library/services/exec'
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name].js',
    library: '[name]',
    libraryTarget: 'umd'
  }
};
