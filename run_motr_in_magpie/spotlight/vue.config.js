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
  },
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.tsv$/,
          loader: 'csv-loader',
          options: {
            dynamicTyping: true,
            header: true,
            skipEmptyLines: true,
            delimiter: '\t'
          }
        },
        {
          test: /\.csv$/,
          loader: 'csv-loader',
          options: {
            dynamicTyping: true,
            header: true,
            skipEmptyLines: true,
            delimiter: ','
          }
        }
      ]
    }
  },
  lintOnSave: false,
  pluginOptions: {
    lintStyleOnBuild: false,
    stylelint: {}
  },
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/'
};
