const webpack = require('webpack');
const { motrSharedAlias } = require('../shared/vueConfigAlias.cjs');

const sharedAlias = motrSharedAlias(__dirname);
const prolificMaxUploadBodyChars = Math.floor(2.5 * 1024 * 1024);

module.exports = {
  chainWebpack(config) {
    config.module
      .rule('xlsx')
      .test(/\.xlsx$/)
      .exclude.add(/node_modules/)
      .end()
      .use('file-loader')
      .loader('file-loader')
      .options({ name: 'xlsx/[name].[contenthash:8][ext]' });
    config.resolve.alias.set('@motr-shared', sharedAlias['@motr-shared']);
    config.resolve.alias.set('@magpie-config', sharedAlias['@magpie-config']);
  },
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        'process.env.MOTR_MAX_UPLOAD_BODY_CHARS': JSON.stringify(prolificMaxUploadBodyChars),
      }),
    ],
    resolve: {
      alias: {
        ...sharedAlias,
      },
    },
    module: {
      rules: [
        {
          test: /\.tsv$/,
          loader: 'csv-loader',
          options: {
            dynamicTyping: true,
            header: true,
            skipEmptyLines: true,
            delimiter: '\t',
          },
        },
        {
          test: /\.csv$/,
          loader: 'csv-loader',
          options: {
            dynamicTyping: true,
            header: true,
            skipEmptyLines: true,
            delimiter: ',',
          },
        },
      ],
    },
  },
  lintOnSave: false,
  pluginOptions: {
    lintStyleOnBuild: false,
    stylelint: {},
  },
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
};
