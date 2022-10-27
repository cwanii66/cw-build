const path = require('path');
const fg = require('fast-glob');
const fs = require('fs');

const DEAFULT_CONFIG_NAME = ['cw-config.(mjs|js|json)'];

function getConfigFile(cwd = process.cwd()) {
  const [configFile] = fg.sync(DEAFULT_CONFIG_NAME, { cwd, absolute: true });
  return configFile;
}

/**
 * @param {*} modulePath
 * @returns {module}
 * @description pass into a path string, return a function module
 */
async function loadModule(modulePath) {
  let hookFnPath;

  if (modulePath.startsWith('/') || modulePath.startsWith('.')) {
    hookFnPath = path.isAbsolute(modulePath) ? modulePath : path.resolve(modulePath);
  } else {
    hookFnPath = require.resolve(modulePath, {
      paths: [
        path.resolve(process.cwd(), 'node_modules')
      ]
    });
  }

  if (fs.existsSync(hookFnPath)) {
    const isMjs = hookFnPath.endsWith('mjs');
    if (isMjs) {
      return (await import(hookFnPath)).default;
    } else {
      return require(hookFnPath);
    }
  }
  return null;
}

module.exports = {
  getConfigFile,
  loadModule
}
