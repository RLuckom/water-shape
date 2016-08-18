'use strict';
var gpio = require('pigpio').Gpio;
const logger = require('../utils/logger')( '/../logs/gpio.log');
var sequenceUtilsFactory = require('../utils/sequenceManipulation.js');
var gpioLibFactory = require('./gpioLib.js');
const dbUtils = require('./../water-shape/persistence/sqlite3-adapter.js');
const FILENAME = 'hydro.db';
const schema = require('../schema/schema.js').schemaFactory();

dbUtils(FILENAME, schema, logger, function(db) {
  var sequenceUtils = sequenceUtilsFactory(db);
  function deepSequences(callback) {
    return sequenceUtils.getSequencesWithItemsAndPins(function(err, res) {
      if (err) {
        throw err;
      } else {
        return callback(res);
      }
    });
  }
  gpioLibFactory(logger, gpio, deepSequences, setTimeout, setInterval).start();
});
