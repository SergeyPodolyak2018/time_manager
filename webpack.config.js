const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const glob = require('glob');

const mainFiles = glob.sync('build/static/?(js|css)/main.*.?(js|css)').map(f => path.resolve(__dirname, f));
module.exports = {
  entry: [...(mainFiles.length > 0 ? mainFiles : [])],
  output: {
    filename: 'build/static/js/index.js',
    publicPath: 'auto',
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist', 'static'),
    },
    port: 3000,
  },
  module: {
    rules: [
      {
        test: /\.(css)$/i,
        exclude: /node_modules/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(woff2|ttf|svg)$/,
        type: 'asset/inline',
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
};
