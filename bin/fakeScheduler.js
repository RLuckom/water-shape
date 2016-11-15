const dmiFactory = require('./../water-shape/persistence/sqlite3-adapter.js');
const FILENAME = __dirname + '/../hydro.db';
const schema = require('../schema/schema.js').schemaFactory();
const logger = require('../utils/logger')( '/../logs/scheduler.log');
const schedulerFactory = require('../schedule/scheduler');
const controllers = require('../schedule/livePeripheralTypeControlMethods')(logger);
const config = {
  RELOAD_SCHEDULE_SECONDS: 1
};

function createOutputGpio(gpioDef) {
  console.log('on output');
  return {digitalWrite: function(s) {
    console.log(`Writing ${s} to gpio ${gpioDef.pinNumber}`);
  }};
}

function createInputGpio(gpioDef) {
  return {digitalRead: function(s) {
    console.log(`Writing ${s} to gpio ${gpioDef.pinNumber}`);
  }};
}

function createCamera(cameraDef) {
  return;
}

const hardwareTypeMaps = {
  GPIO_INPUT: createInputGpio,
  GPIO_OUTPUT: createOutputGpio,
  CAMERA: createCamera
};

function get(ioType, ioDef) {
  if (!hardwareTypeMaps[ioType]) {
    throw new Error(`No hardware type corresponding to ${ioType}`);
  }
  return hardwareTypeMaps[ioType](ioDef);
}

const hardwareManager = {
  get
}

dmiFactory(FILENAME, schema, logger, function(dmi) {
  console.log('dmi');
  dmi.sequence.list(function(e, s) {console.log(s);});
  schedulerFactory(dmi, hardwareManager, controllers, config, logger).start();
});
