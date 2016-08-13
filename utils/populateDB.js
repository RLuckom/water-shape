'use strict';
const dbUtilsFactory = require('../water-shape/persistence/sqlite3-adapter');
const logger = require('../utils/logger')( '/../logs/hydro.log');
const _ = require('lodash');
const async = require('async');
const sequenceUtilsFactory = require('./sequenceManipulation.js');

dbUtilsFactory(__dirname + '/../hydro.db', require('../schema/schema').schemaFactory(), logger, (dbUtils) => {return dbUtils.createTablesAndDefaultValues(_.partial(populateDB, dbUtils));});

/* Populate the database with records for testing. */
function populateDB(db, callback) {

  const sequenceUtils = sequenceUtilsFactory(db);

  /* Pump sequence
   *
   * The pump is controlled via 1 GPIO pin and one ground pin (or 2 GPIOs).
   * The pump should have a duration-based duty cycle, with 4 minutes off and 1
   * minute on per cycle. The pump uses GPIO pin 4.
   */
  const populatePumpSequence = _.partial(
    sequenceUtils.makeOnOffSequenceAndAssignToPin,
    60, // 60 seconds on
    240, // 4 mins off
    4, // pin 4
    1 // default on
  );

  /* Light sequence
   *
   * The light is controlled via 1 GPIO pin and one ground pin (or 2 GPIOs).
   * The light should have a time-based duty cycle, and be on from 5:30AM to 
   * 6:30PM. The light uses GPIO pin 14.
   */
  const populateLightSequence = _.partial(
    sequenceUtils.makeTimeSequenceAndAssignToPin,
    {hour: 5, minute: 30, second: 0}, // 5:30 AM on
    {hour: 18, minute: 30, second: 0}, // 6:30PM off
    14, // pin 14
    0 // default off
  );

  async.series([
    populatePumpSequence,
    populateLightSequence
  ]);
}
