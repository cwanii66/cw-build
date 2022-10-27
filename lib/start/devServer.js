const chokidar = require('chokidar');
const path = require('path');
const cp = require('child_process');
const log = require('../utils/log');
const { getConfigFile } = require('../utils/index');

let child;

function runServer(arg = {}) {
  const { config = '', customWebpackPath = '', stopBuild = false } = arg;

  const scriptPath = path.resolve(__dirname, './devService.js');

  child = cp.fork(scriptPath, [
    '--port 8080',
    `--config ${config}`,
    `--customWebpackPath ${customWebpackPath}`,
    `--stop-build ${stopBuild}`
  ]);

  child.on('exit', (code) => {
    if (code) {
      process.exit(code);
    }
  });
}

function onChange() {
  log.verbose('config changes...');
  child.kill();
  runServer();
}

function runWatcher() {
  const configPath = getConfigFile();

  const watcher = chokidar.watch(configPath);
  watcher
    .on('change', onChange)
    .on('error', error => {
      console.error('file watch error: ', error);
      process.exit(1);
    });
}

module.exports = function startServer(opts, cmd) {
  runServer(opts);
  runWatcher();
};
