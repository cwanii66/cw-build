const log = require('npmlog');

const LOG_LEVELS = ['verbose', 'info', 'error', 'warn'];
const logLevel = (LOG_LEVELS.indexOf(process.env.LOG_LEVEL) >= 0) ? process.env.LOG_LEVEL : 'info';

log.level = logLevel;

module.exports = log;
