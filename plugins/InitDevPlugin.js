const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = function (api, options) {
  const { getWebpackConfig } = api;
  const config = getWebpackConfig();
  const dir = process.cwd();

  // 获取构建模式
  const mode = 'development';

  config.mode(mode)

  // 配置entry
  config.entry('index')
    .add(path.resolve(dir, './src/index.js'))
    .end();
  config.output
    .filename('js/[name].js')
    .path(path.resolve(dir, './dist'));

  config.module
    .rule('vue')
    .test(/\.vue$/)
    .use('vue-loader')
    .loader('vue-loader');

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



  config.watch(true);
}
