'use strict';
const winston = require('winston');
winston.add(winston.transports.File, { filename: __dirname + '../logs/hydro.log' });
winston.remove(winston.transports.Console);

module.exports = winston;
