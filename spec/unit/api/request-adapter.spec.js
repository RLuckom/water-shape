'use strict';
const dbUtilsFactory = require('../../../src/persistence/sqlite3-adapter');
const startServer = require('../../../src/server/hapi-adapter').startServer;
const apiClientFactory = require('../../../src/api/request-adapter');
const testGenericDataManipulationInterface = require('../dataManipulationInterfaceTest');
const request = require('request');
const async = require('async');
const uuid = require('uuid');
const fs = require('fs');
const _ = require('lodash');
const hapi = require('hapi');
const sqlite3 = require('sqlite3');

const logger = {
  log: (level, message) => {
    return console.log(`[ ${level} ] ${message}`);
  }
};

describe('api tests', function() {

  var dbUtils, server;
  function setupTests(schema, callback) {
    const api = apiClientFactory(_.cloneDeep(schema), 'http://localhost:9090/api', request, _, async);
    var finished = {};
    function all(taskName) {
      finished[taskName] = false;
      return function() {
        finished[taskName] = true;
        if (_.every(finished)) {
          return callback(null, api);
        }
      };
    }
    try {
      fs.unlinkSync(__dirname + '/test.db');
    } catch(err) {logger.log('unlink', err);} // don't care
    dbUtilsFactory(__dirname + '/test.db', _.cloneDeep(schema), logger, function(dbu) {
      dbUtils = dbu;
      var createTableCallback = all('createTables');
      var startServerCallback = all('startServer');
      dbUtils.createTablesAndDefaultValues(createTableCallback);
      server = startServer({port: 9090, distPath: '/../../dist'}, dbUtils, logger, startServerCallback, hapi, require('inert'), _, uuid);
    }, _, async, sqlite3, uuid);
  };

  function teardownTests(dmi, callback) {
    var finished = {};
    function all(taskName) {
      finished[taskName] = false;
      return function() {
        finished[taskName] = true;
        if (_.every(finished)) {
          return callback();
        }
      };
    }
    try {
      fs.unlinkSync(__dirname + '/test.db');
    } catch(err) {logger.log('unlink', err);} // don't care
    var closeDbCallback = all('closeDb');
    var stopServerCallback = all('stopServer');
    dbUtils.close(closeDbCallback);
    server.stop(stopServerCallback);
  };

  describe('generics', function() {
    testGenericDataManipulationInterface('api', setupTests, teardownTests);
  });

  describe('nongeneric tests', function() {
    const schema = require('../fixtures/bucketBrainSchema').schemaFactory();
    const api = apiClientFactory(_.cloneDeep(schema), 'http://localhost:9090/api', request, _, async);
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
        fs.unlinkSync(__dirname + '/test.db');
      } catch(err) {logger.log('unlink', err);} // don't care
      dbUtilsFactory(__dirname + '/test.db', _.cloneDeep(schema), logger, function(dbu) {
        dbUtils = dbu;
        var createTableCallback = all('createTables');
        var startServerCallback = all('startServer');
        dbUtils.createTablesAndDefaultValues(createTableCallback);
        server = startServer({port: 9090, distPath: '/../../dist'}, dbUtils, logger, startServerCallback, hapi, require('inert'), _, uuid);
      }, _, async, sqlite3, uuid);
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
        fs.unlinkSync(__dirname + '/test.db');
      } catch(err) {logger.log('unlink', err);} // don't care
      var closeDbCallback = all('closeDb');
      var stopServerCallback = all('stopServer');
      dbUtils.close(closeDbCallback);
      server.stop(stopServerCallback);
    });

    function compareIgnoreId(a, b) {
      var aNew = _.cloneDeep(a);
      var bNew = _.cloneDeep(b);
      delete aNew.uid;
      delete bNew.uid;
      return _.isEqual(aNew, bNew);
    }

    function allEqualWithoutId(aList, bList) {
      return _.every(_.zip(aList, bList), (pair) => {
        return compareIgnoreId(pair[0], pair[1]);
      });
    }

    it('serves the API', function(done) {
      request({
        method: 'GET',
        url: 'http://localhost:9090/api/sequenceType',
        json: true
      }, function(e, r, b) {
        expect(allEqualWithoutId(b, schema.sequenceType.initialValues)).toBe(true);
        done();
      });
    });

    it('api can get a list of predefined values', function(done) {
      api.sequenceType.get(function(e, r, b) {
        expect(allEqualWithoutId(b, schema.sequenceType.initialValues)).toBe(true);
        done();
      });
    });

    it('api can post a sequence, get it, then delete it', function(done) {
      const sequenceToAdd = {
        uid: uuid.v4(),
        dateCreated: new Date().toString(),
        name: 'newSequence',
        sequenceType: 'DURATION',
        defaultState: 1
      };
      api.sequence.get(function(e, r, b) {
        expect(e).toBeNull();
        expect(b).toEqual([]);
        api.sequence.post(sequenceToAdd, function(e, r, b) {
          expect(e).toBeNull();
          expect(b).toEqual(sequenceToAdd);
          api.sequence.get(function(e, r, b) {
            expect(e).toBeNull();
            expect(b).toEqual([sequenceToAdd]);
            api.sequence.delete(sequenceToAdd, function(e, r, b) {
              expect(e).toBeNull();
              expect(b).toBeUndefined();
              api.sequence.get(function(e, r, b) {
                expect(e).toBeNull();
                expect(b).toEqual([]);
                done();
              });
            });
          });
        });
      });
    });
  });
});
