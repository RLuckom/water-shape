'use strict';
const winston = require('winston');
function makeLogger(fn) {
  winston.add(winston.transports.File, {
    filename: __dirname + fn
  });
  winston.remove(winston.transports.Console);
  return winston;
}

module.exports = makeLogger;
