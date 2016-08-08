'use strict';
const dbUtilsFactory = require('../../utils/db');
const startServer = require('../../utils/apiServer').startServer;
const schema = require('../../utils/schema').schemaFactory();
const request = require('request');
const _ = require('lodash');

const logger = {
  log: (level, message) => {
    return console.log(`[ ${level} ] ${message}`);
  }
};

describe('api tests', function() {

  var dbUtils, server;

  beforeEach(function(done) {
    var finished = {};
    function all(taskName) {
      finished[taskName] = false;
      return function() {
        finished[taskName] = true;
        if (_.every(finished)) {
          return done();
        }
      };
    }
    try {
      fs.unlinkSync('test.db');
    } catch(err) {} // don't care
    dbUtilsFactory('test.db', schema, logger, function(dbu) {
      dbUtils = dbu;
      var createTableCallback = all('createTables');
      var startServerCallback = all('startServer');
      dbUtils.createTablesAndDefaultValues(createTableCallback);
      server = startServer(dbUtils, logger, startServerCallback);
    });
  });

  afterEach(function(done) {
    var finished = {};
    function all(taskName) {
      finished[taskName] = false;
      return function() {
        finished[taskName] = true;
        if (_.every(finished)) {
          return done();
        }
      };
    }
    try {
      fs.unlinkSync('test.db');
    } catch(err) {} // don't care
    var closeDbCallback = all('closeDb');
    var stopServerCallback = all('stopServer');
    dbUtils.close(closeDbCallback);
    server.stop(stopServerCallback);
  });

  it('serves the API', function(done) {
    request({
      method: 'GET',
      url: 'http://localhost:8080/api/sequenceTypes',
      json: true
    }, function(e, r, b) {
      logger.log('error', e);
      logger.log('body', b);
      expect(b).toEqual(schema.sequenceTypes.initialValues);
      done();
    });
  });
});
