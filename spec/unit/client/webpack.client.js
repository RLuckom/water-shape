var path = require('path');
var webpack = require('webpack');

module.exports = function(callback) {
  return webpack({
    context: __dirname,
    entry: {
      javascript: "./client.app.js",
      html: './index.html',
    },
    output: {
      filename: "app.js",
      path: __dirname + "/dist",
    },
    module: {
      loaders: [{
        test: /\.js$/,
        exclude: [],
        loaders: ["babel-loader"],
      },
      {
        test: /\.html$/,
        loader: "file?name=[name].[ext]",
      },
      ]
    }
  }, callback);
}
