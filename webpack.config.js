const path = require('path')
const nodeExternals = require('webpack-node-externals')
const webpack = require('webpack')
const WebpackShellPlugin = require('webpack-shell-plugin')

module.exports = {
  devtool: 'source-map',

  target: 'node',
  node: {
    __dirname: false,
    __filename: false
  },

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

    // Set up the regenerator runtime, for Babel.
    new webpack.BannerPlugin({
      banner: 'require("regenerator-runtime/runtime");',
      raw: true, entryOnl: false
    }),

    // Run the server when the build ends.
    new WebpackShellPlugin({
      onBuildExit: ['node dist/bundle.js'],
      dev: true
    })
  ],

  module: {
    rules: [
      // Babel config.
      // No Babel plugins, yet. In the future we should definitely be careful to
      // choose plugins carefully. Remember that we aren't targeting any old
      // versions of Node - only the current one. So, only add plugins which are
      // useful to current versions of Node. Later, we'll want to transform async
      // functions into generator syntax so that we get better async stack traces.
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            // ...Babel options here...
            presets: [
              'flow',
            ],
            plugins: [
              // Disabled because they don't actually do anything to help with
              // at <anonymous>. Sorry, alex :)
              /*
              'transform-es2015-classes',
              'transform-async-to-generator'
              */
            ]
          }
        }
      },

      {
        test: /\.mp3$/,
        use: {
          loader: 'file-loader'
        }
      }
    ]
  },

  // Don't include node_modules in the export - they eat up a lot of room and
  // are unnecessary.
  externals: [nodeExternals()]
}
