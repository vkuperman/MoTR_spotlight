const path = require('path');
const { motrSharedAlias } = require('../shared/vueConfigAlias');

const sharedAlias = motrSharedAlias(__dirname);

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
    resolve: {
      alias: sharedAlias,
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
