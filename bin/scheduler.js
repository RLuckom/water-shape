const dmiFactory = require('./../water-shape/persistence/sqlite3-adapter.js');
const FILENAME = 'hydro.db';
const schema = require('../schema/schema.js').schemaFactory();
const logger = require('../utils/logger')( '/../logs/scheduler.log');
const schedulerFactory = require('../schedule/scheduler');
const hardwareManager = require('../schedule/hardwareManager');
const controllers = require('../schedule/livePeripheralTypeControlMethods')(logger);
const config = {
  RELOAD_SCHEDULE_SECONDS: 4
};

dmiFactory(FILENAME, schema, {log: function(){}}, function(dmi) {
  schedulerFactory(dmi, hardwareManager, controllers, config, logger).start();
});
