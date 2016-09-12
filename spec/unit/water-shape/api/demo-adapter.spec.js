'use strict';
const dmiClientFactory = require('../../../../water-shape/api/demo-adapter');
const testGenericDataManipulationInterface = require('../dataManipulationInterfaceTest');
const uuid = require('uuid');
const _ = require('lodash');

const logger = {
  log: (level, message) => {
    return console.log(`[ ${level} ] ${message}`);
  }
};

describe('api tests', function() {

  var dbUtils, server;
  function setupTests(schema, callback) {
    callback(void(0), dmiClientFactory(schema, logger));
  };

  function teardownTests(dmi, callback) {
    return callback();
  };

  testGenericDataManipulationInterface('demo in-memory dmi', setupTests, teardownTests);
});
