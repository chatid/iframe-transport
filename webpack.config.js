var webpack = require('webpack');

module.exports = {
    entry: "./src/main",
    output: {
        path: "./build",
        filename: 'main.js',
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
