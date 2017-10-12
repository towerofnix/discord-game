const path = require('path')
const nodeExternals = require('webpack-node-externals')
const webpack = require('webpack')
const WebpackShellPlugin = require('webpack-shell-plugin')

module.exports = {
  devtool: 'source-map',
  target: 'node',

  entry: ['./src/main.js'],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },

  plugins: [
    // Activate source maps - in stack traces, see the ":/src/..." part after
    // the "dist/webpack" part.
    new webpack.BannerPlugin({
      banner: 'require("source-map-support").install();',
      raw: true, entryOnly: false
    }),

    // Run the server when the build ends.
    new WebpackShellPlugin({
      onBuildExit: ['node dist/bundle.js']
    })
  ],

  // Babel - disabled.. for now.
  /*
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ]
  },
  */

  // Don't include node_modules in the export - they eat up a lot of room and
  // are unnecessary.
  externals: [nodeExternals()]
}
