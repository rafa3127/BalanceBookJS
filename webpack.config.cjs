const path = require("path");

const common = {
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],          }
        }
      }
    ]
  }
};

const esmConfig = {
  ...common,
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'lib'),
    library: {
      type: 'module'
    }
  },
  experiments: {
    outputModule: true
  },
  optimization: {
    minimize: false
  },
  target: ['web', 'es5'],
};

module.exports = [esmConfig];
