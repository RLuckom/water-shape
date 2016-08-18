'use strict';
var gpio = require('pigpio').Gpio;
const logger = require('../utils/logger')( '/../logs/gpio.log');
var gpioLibFactory = require('./gpioLib.js');

gpioLibFactory(logger, gpio);
