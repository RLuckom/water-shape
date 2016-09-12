var path = require('path');
module.exports = {
  context: __dirname + "/client",
  entry: {
    javascript: "./demo-app.js",
    html: './index.html',
  },
  output: {
    filename: "app.js",
    path: __dirname + "/dist-demo",
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: [],
      loaders: ["react-hot", "babel-loader"],
    },
    {
      test: /\.html$/,
      loader: "file?name=[name].[ext]",
    },
    {test: /\.css$/, loader: "style-loader!css-loader" },
    {test: /\.scss$/, loaders: ["style", "css", "sass"]},
    {test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/font-woff"},
    {test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/font-woff2"},
    {test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,  loader: "url?limit=10000&mimetype=application/octet-stream"},
    {test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,  loader: "file"},
    {test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,  loader: "url?limit=10000&mimetype=image/svg+xml"},
    ]
  }
}
