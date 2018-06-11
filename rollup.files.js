const fs = require('fs');
const glob = require('glob');
const path = require('path');
const getFileArrayFromGlob = require('./node_modules/component-build-tools/getFileArrayFromGlob.js');
const readFile = require('./node_modules/component-build-tools/readFile.js');
const PLUGIN_BUBLE = require('rollup-plugin-buble')({ transforms: { dangerousTaggedTemplateString: true } });
const PLUGIN_UGLIFY = require('rollup-plugin-uglify-es')();
const DIST_PATH_DEFAULT = 'dist/js';
const ROOT = process.cwd();
const BUILD_TYPES = {
  IIFE: 'IIFE', // IFFE output
  IIFE5: 'IIFE5', // IFFE output with ES5 transpile
  CJS: 'CJS', // Common JS (require)
  CJS5: 'CJS5', // Common JS (require) with ES5 transpile
  MJS: 'MJS' // ES6 Modules (import)
};
const globOptions = { cwd: '/', root: '/' };
const getSrcFiles = (...pathParts) => glob.sync(path.resolve(...pathParts), globOptions);

function init(theirConfig = {}) {
  const rollupOptionsArray = [];
  const config = Object.assign({
    buildTypes: [ BUILD_TYPES.CJS, BUILD_TYPES.CJS5 ],
    distPath: DIST_PATH_DEFAULT, // Path into which the distribution files will be placed
    dstExtCJS: '.cjs.js',
    dstExtCJS5: '.cjs5.js',
    dstExtIIFE: '.iife.js',
    dstExtIIFE5: '.iife5.js',
    dstExtMJS: '.mjs',
    makeMinFiles: false,
    sourcemap: false,
    srcFiles: [] // Source files to process. User must supply these
  }, theirConfig);

  var tempFiles = Array.isArray(config.srcFiles) ? config.srcFiles : [config.srcFiles];
  const srcFiles = getFileArrayFromGlob(ROOT, tempFiles);

  srcFiles.forEach(
    srcPath => {
      config.buildTypes.forEach(
        buildType => {
          const varName = srcPath.replace(/[.]/g, '_');
          const plugins = [];
          const { format, needToTranspile, outputPath, file } = getBuildStepInfo(buildType, srcPath, varName, config);
          if (needToTranspile) {
            plugins.push(PLUGIN_BUBLE);
          }

          const buildItem = {
            input: srcPath,
            plugins,
            output: {
              file,
              format,
              //name: varName,
              sourcemap: config.sourcemap
            }
          };

          rollupOptionsArray.push(buildItem);

          if (config.makeMinFiles) {
            const buildItem2 = Object.assign({}, buildItem);
            buildItem2.plugins = [...buildItem2.plugins, PLUGIN_UGLIFY]; // Keep this set of plugins separated from the other set.
            buildItem2.output = Object.assign({}, buildItem.output, {file: buildItem.output.file.replace(/(.[a-z]+$)/, '.min$1')});
            rollupOptionsArray.push(buildItem2);
          }
        }
      );
    }
  );

  return rollupOptionsArray;
}

function getBuildStepInfo(buildType, srcPath, varName, config) {
  let format = buildType;
  let needToTranspile = false;
  let ext = path.extname(srcPath);
  let dstName = path.basename(srcPath, ext);
  let outputPath = config.distPath;

  // If `config.distPath` is an object then we need to get the correct path out of the object.
  if (typeof outputPath === 'object') {
    outputPath = outputPath[buildType];
  }

  if (buildType === BUILD_TYPES.IIFE5) {
    dstName += config.dstExtIIFE5;
    needToTranspile = true;
    format = BUILD_TYPES.IIFE;
    // istanbul ignore else
    if (!varName) {
      varName = srcPath.replace(/[.-]/g, '_');
    }
  }
  else if (buildType === BUILD_TYPES.IIFE) {
    dstName += config.dstExtIIFE;
    // istanbul ignore else
    if (!varName) {
      varName = srcPath.replace(/[.-]/g, '_');
    }
  }
  else if (buildType === BUILD_TYPES.CJS5) {
    dstName += config.dstExtCJS5;
    needToTranspile = true;
    format = BUILD_TYPES.CJS;
  }
  else if (buildType === BUILD_TYPES.CJS) {
    dstName += config.dstExtCJS;
  }
  else {
    dstName += config.dstExtMJS;
    format = 'es';
  }

  format = format.toLowerCase();

  const file = config.includePath ? path.resolve(ROOT, outputPath, srcPath, dstName) : path.resolve(ROOT, outputPath, dstName);

  return {
    format, needToTranspile, outputPath, file
  };
}

module.exports = {
  init,
  BUILD_TYPES
};
