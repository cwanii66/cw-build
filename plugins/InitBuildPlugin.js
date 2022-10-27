const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = function (api, options) {
  const { getWebpackConfig } = api;
  const config = getWebpackConfig();
  const dir = process.cwd();

  // 获取构建模式
  const mode = process.env.CW_BUILD_MODE || 'development';

  config.mode(mode)

  // 配置entry
  config.entry('index')
    .add(path.resolve(dir, './src/index.js'))
    .end();

  config.output
    .filename('js/[name].js')
    .path(path.resolve(dir, './dist'));

  // 设置loader
  config.module
    .rule('css')
    .test(/\.css$/i)
    .exclude
    .add(/node_modules/)
    .end()
    .use('mini-css')
    .loader(MiniCssExtractPlugin.loader)
    .end()
    .use('css-loader')
    .loader('css-loader');

  config.module
    .rule('assets')
    .test(/\/(png|gif|svg|jpg|jpeg)$/i)
    .type('asset')
    .parser({
      dataUrlCondition: {
        maxSize: 8 * 1024
      }
    });
  config.module.rule('asset').set('generator', {
    filename: 'images/[name].[hash:6][ext]',
  });

  config.module
    .rule('ejs')
    .test(/\.ejs/)
    .exclude
    .add(/node_modules/)
    .end()
    .use('ejs-loader')
    .loader('ejs-loader')
    .options({
      esModule: false,
    });

  config
    .plugin('mini-css')
    .use(MiniCssExtractPlugin, [
      {
        filename: 'css/[name].css',
        chunkFilename: 'css/[name].chunk.css'
      }
    ]);

  config.plugin('HtmlWebpackPlugin')
    .use(HtmlWebpackPlugin, [
      {
        template: path.resolve(dir, './public/index.html'),
        filename: 'index.html',
        chunks: ['index']
      }
    ]);

  config
    .plugin('CleanPlugin')
    .use(CleanWebpackPlugin, []);

  config.optimization
    .usedExports(true);
  config.optimization
    .minimizer('TerserPlugin')
    .use(TerserPlugin, [
      {
        terserOptions: {
          sourceMap: true
        }
      }
    ]);
  config.optimization
    .minimizer('CssMinimizerPlugin')
    .use(CssMinimizerPlugin, []);
  config.optimization
    .splitChunks({
      chunks: 'all',
      minSize: 20000, // 压缩前的最小模块大小
      name: 'common',
      cacheGroups: {
        // 默认的规则不会打包，需要单独定义
        jquery: {
          // 抽离jquery
          name: 'jquery',
          test: /jquery\.js/,
          chunks: 'all',
        },
        'lodash-es': {
          name: 'lodash-es',
          test: /lodash-es/,
          chunks: 'all'
        }
      }
    });

  config.watch(true);
}
