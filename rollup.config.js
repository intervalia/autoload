//const {init, BUILD_TYPES} = require('./node_modules/component-build-tools/rollup.root.config');
const {init, BUILD_TYPES} = require('./rollup.files');

const config = {
  distPath: {
    CJS: 'static/modules/cjs',
    CJS5: 'static/modules/cjs5'
  },
  dstExtCJS: '.js',
  dstExtCJS5: '.js',
  buildTypes: [ BUILD_TYPES.CJS, BUILD_TYPES.CJS5 ], // Set this to any build styles you want.
  srcFiles: ['static/modules/mjs/**/*'] // Set this to any folder you want to have rollup process
};

const results = init(config);
console.log(JSON.stringify(results,0,2));
module.exports = results;
