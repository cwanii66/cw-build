const path = require('path');
const fs = require('fs');
const WebpackDevServer = require('webpack-dev-server');
const WebpackChain = require('webpack-chain');
const log = require('../utils/log');
const { getConfigFile, loadModule } = require('../utils/index');
const constant = require('./const');
const InitDevPlugin = require('../../plugins/InitDevPlugin');
const InitBuildPlugin = require('../../plugins/InitBuildPlugin');

const HOOK_KEYS = [
  constant.HOOK_START,
  constant.HOOK_PLUGIN
]; // allowed hooks

class Service {
  constructor(cmd, opts) {
    log.verbose('Service', opts);
    this.cmd = cmd;
    this.args = opts;
    this.config = {};
    this.hooks = {}; 
    this.plugins = []; 
    this.dir = process.cwd();
    this.webpackConfig = null;
    this.internalValue = {}; 
  }

  start = async () => {
    await this.resolveConfig();
    await this.registerHooks();
    // await this.emitHooks(constant.HOOK_START, 'hook', 'start'); // hook -> start service
    await this.registerPlugin();
    await this.execPlugin();
    if (!this.args.stopBuild) {
      await this.initWebpack();
      await this.startServer();
    }
  }

  startServer = async () => {
    let compiler;
    let devServer;
    let serverConfig;
    try {
      const webpack = require(this.webpack);
      const webpackConfig = this.webpackConfig.toConfig();
      compiler = webpack(webpackConfig, (err, stats) => {
        // fatal! webpack config error handler
        if (err) {
          log.error('ERROR!', err.stack || err);
          if (err.details) {
            log.error('ERROR DETAILS:', err.details);
          }
        } else {
          // compile error handler
          const res = stats.toJson({ all: false, errors: true, warnings: true, timings: true });
          if (stats.hasErrors()) {
            log.error('COMPILER ERROR!');
            res.errors.forEach(error => {
              log.error('ERROR MESSAGE', error.message); // parse error handler
            });
          } else if (stats.hasWarnings()) {
            // compile warnings handler
            res.warnings.forEach(warning => {
              log.warn('WARNING MESSAGE', warning.message);
            })
            log.warn('WARNING!',)
          } else {
            log.info('COMPILE SUCCESS!', `compile finished in ${res.time}ms`);
          }
        }
      });
      serverConfig = {
        static: {
          directory: path.resolve(process.cwd(), './dist'),
        },
        port: this.args.port || 8080,
        host: this.args.host || '0.0.0.0',
        https: this.args.https || false,
      };
      if (WebpackDevServer.getFreePort()) {
        devServer = new WebpackDevServer(serverConfig, compiler);
      } else {
        devServer = new WebpackDevServer(compiler, serverConfig);
      }
      function devServerErrorHandler(err) {
        if (err) {
          log.error('WEBPACK-DEV-SERVER ERROR!');
          log.error('ERROR MESSAGE', err.toString());
        } else {
          log.info('WEBPACK-DEV-SERVER LAUNCH SUCCESS!');
        }
      }
      if (devServer.startCallback) {
        devServer.startCallback((err) => {
          devServerErrorHandler(err);
        });
      } else {
        devServer.listen(serverConfig.port, serverConfig.host, (err) => {
          devServerErrorHandler(err);
        });
      }
    } catch (e) {
      log.error('error: ', e)
    }

  }

  initWebpack = async () => {
    const { customWebpackPath } = this.args;
    if (customWebpackPath) {
      if (fs.existsSync(customWebpackPath)) {
        let p = customWebpackPath;
        if (!path.isAbsolute(p)) {
          p = path.resolve(p)
        }
        this.webpack = require.resolve(p);
      }
    } else {
      this.webpack = require.resolve('webpack', {
        paths: [
          path.resolve(process.cwd(), 'node_modules'),
        ]
      });
    }

    log.verbose('webpack path: ', this.webpack, '\n\n');
    log.verbose('webpack config: ', this.webpackConfig.toConfig(), '\n\n');
  }

  resolveConfig = async () => {
    const { config } = this.args;
    let configFilePath = '';

    if (config) {
      if (path.isAbsolute(config)) {
        configFilePath = config;
      }
      configFilePath = path.resolve(config);
    } else {
      configFilePath = getConfigFile(this.dir);
    }

    if (configFilePath && fs.existsSync(configFilePath)) {
      this.config = await loadModule(configFilePath);
      log.verbose('config', this.config);
    } else {
      log.error('config file does not exist, end process...');
      process.exit(1);
    }

    this.webpackConfig = new WebpackChain();
  }

  registerHooks = async () => {
    const { hooks } = this.config;
    if (hooks && hooks.length > 0) {
      for (const hookDefArr of hooks) {
        const [hookName, hookFn] = hookDefArr;
        if (hookName && hookFn && typeof hookName === 'string' && HOOK_KEYS.includes(hookName)) {
          if (typeof hookFn === 'function') {
            const definedHook = this.hooks[hookName];
            if (!definedHook) {
              this.hooks[hookName] = [];
            }
            this.hooks[hookName].push(hookFn);
          } else if (typeof hookFn === 'string') {
            const newFn = await loadModule(hookFn);
            const definedHook = this.hooks[hookName];
            if (!definedHook) {
              this.hooks[hookName] = [];
            }
            this.hooks[hookName].push(newFn);
          }
        }
      }
    }
  }

  emitHooks = async (key, ...args) => {
    const hooks = this.hooks[key];
    try {
      for (let i = 0, hook; hook = hooks[i++];) {
        await hook.apply(this, args);
      }
    } catch (e) {
      log.error(e);
    }

  }

  registerPlugin = async () => {
    let { plugins } = this.config;

    const builtInPlugins = (this.cmd === 'start') ? [InitDevPlugin] : [InitBuildPlugin];

    builtInPlugins.forEach((plugin) => {
      this.plugins.push({
        mod: plugin
      });
    });
    if (plugins) {
      if (typeof plugins === 'function') {
        plugins = plugins();
      }
      if (Array.isArray(plugins)) {
        for (const plugin of plugins) {
          if (typeof plugin === 'string') {
            const mod = await loadModule(plugin);
            this.plugins.push({ mod });
          } else if (Array.isArray(plugin)) {
            const [pluginPath, pluginParam] = plugin;
            const mod = await loadModule(pluginPath);
            this.plugins.push({
              mod,
              params: pluginParam
            });
          } else if (typeof plugin === 'function') {
            this.plugins.push({
              mod: plugin
            });
          }
        }
      }
    }
  }

  execPlugin = async () => {
    const API = {
      getWebpackConfig: this.getWebpackConfig,
      emitHooks: this.emitHooks,
      setValue: this.setValue,
      getValue: this.getValue,
      log
    };
    for (const plugin of this.plugins) {
      const { mod, params = {} } = plugin;
      if (!mod) continue;
      const options = {
        ...params,
      };
      await mod(API, options);
    }
  }

  getWebpackConfig = () => {
    return this.webpackConfig;
  }

  setValue = (key, value) => {
    this.internalValue[key] = value;
  }

  getValue = (key) => {
    return this.internalValue[key];
  }
}

module.exports = Service;
