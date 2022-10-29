const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = function(api, options) {
    const { getWebpackConfig } = api;
    const config = getWebpackConfig();
    const dir = process.cwd();

    config.plugin('HtmlPlugin2')
        .use(HtmlWebpackPlugin, [
            {
                template: path.resolve(dir, 'public/index2.html'),
                filename: 'index2.html',
                chunks: ['index'], // To include only certain chunks you can limit the chunks being used
            }
        ])
}