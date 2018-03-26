var webpack = require('webpack');
var path = require('path');
var fs = require('fs');

var ExtractTextPlugin = require('extract-text-webpack-plugin');
var LiveReloadPlugin = require('webpack-livereload-plugin');

var inProduction = process.env.NODE_ENV === 'production';

var CASHBUSTER_FILE = './cachebuster.json';

function generateResourcesHash(hash) {
  if (!fs.existsSync(CASHBUSTER_FILE)) {
    fs.openSync(CASHBUSTER_FILE, 'w');
    fs.writeFileSync(
      path.join(__dirname, "", CASHBUSTER_FILE),
      "{}"
    );
  }
  
  var cacheBuster = JSON.parse(fs.readFileSync(path.join(__dirname, CASHBUSTER_FILE), "utf8"));
  
  cacheBuster.resourcesHash = hash
  
  fs.writeFileSync(
    path.join(__dirname, "", CASHBUSTER_FILE),
    JSON.stringify(cacheBuster)
  );
}

module.exports = {
  devtool: inProduction ? '' : 'source-map',
  entry: {
    main: [
      './src/js/main.js',
      './src/scss/style.scss'
    ]
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: inProduction ? 'main.bundle.[hash].js' : 'main.bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.s[ac]ss$/,
        use: ExtractTextPlugin.extract({
          use: [{
            loader: 'css-loader',
            options: {
              sourceMap: inProduction ? false : true,
              minimize: inProduction ? true : false
            }
          }, {
            loader: 'sass-loader',
            options: {
              sourceMap: inProduction ? false : true
            }
          }],
          publicPath: '/dist'
        })
      },
    ]
  },
  plugins: []
}

if (inProduction) {
  module.exports.plugins.push(
    new webpack.optimize.UglifyJsPlugin(),
    function() {
      this.plugin("done", function(statsData) {
        var stats = statsData.toJson();

        if (!stats.errors.length) {
          generateResourcesHash(stats.hash);
        }
      });
    },
    new ExtractTextPlugin({
      filename: function (getPath) {
        var hash = getPath('[hash]');
        
        generateResourcesHash(hash);
        
        return getPath('style.[hash].css');
      }
    })
  )
} else {
  module.exports.plugins.push(
    new ExtractTextPlugin('style.css'),
    new LiveReloadPlugin(),
  )
}

