const webpack = require("webpack");

module.exports = {
  context: __dirname + '/public/js',

  entry: {
    main: "./main.js",
    webhook: "./webhook.js"
  },

  output: {
    path: __dirname + '/public/dist',
    filename: "./[name].bundle.js"
  },

	plugins: [
		new webpack.optimize.UglifyJsPlugin()
	],
}
