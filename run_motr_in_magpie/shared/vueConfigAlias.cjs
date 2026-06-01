const path = require('path');

/** Resolve @motr-shared and @magpie-config for vue.config.cjs (spotlight_SONA/ or spotlight_PROLIFIC/). */
function motrSharedAlias(appDir) {
  return {
    '@motr-shared': path.resolve(appDir, '../shared'),
    '@magpie-config': path.resolve(appDir, 'src/magpie.config.js'),
  };
}

module.exports = { motrSharedAlias };
