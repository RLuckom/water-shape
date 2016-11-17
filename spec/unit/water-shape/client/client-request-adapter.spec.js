'use strict';
const dbUtilsFactory = require('../../../../water-shape/persistence/sqlite3-adapter');
const startServer = require('../../../../water-shape/server/hapi-adapter').startServer;
const testGenericDataManipulationInterface = require('../dataManipulationInterfaceTest');
const webpacker = require('./webpack.client.js');
const phantomPath = require('phantomjs-prebuilt').path;
const uuid = require('uuid');
const fs = require('fs');
const _ = require('lodash');
const webdriver = require('selenium-webdriver');

const logger = {
  log: (level, message) => {
    return console.log(`[ ${level} ] ${message}`);
  }
};

function makeApi(schema, driver) {
  function executeInBrowser(tableName, action, argsWithCommaAndSpaces, callback) {
    driver.executeAsyncScript(
      `var callback = arguments[arguments.length - 1];
      function translateToSingleArg(err, arg) {
        if (arg) {
          return callback(JSON.stringify({arg: arg}));
        } else {
          return callback(JSON.stringify({err: err}));
        }
      }
      api.${tableName}.${action}(${argsWithCommaAndSpaces}translateToSingleArg);`
    ).then(
      function(results) {
        results;
        try {
          results = JSON.parse(results);
          if (results.arg) {
            return callback(void(0), results.arg);
          } else if (results.err) {
            return callback(results.err);
          }
        } catch(err) {}
        return callback(results);
      },
      function(err) {console.log(`got error! ${err}`); return callback(err);}
    );
  }
  var api = []
  _.each(schema, function(v, k) {
    api[k] = {
      getById: function(s, callback) {
        return executeInBrowser(k, 'getById', `'${s}', `, callback);
      },
      list: function(callback) {
        return executeInBrowser(k, 'list', '', callback);
      },
      delete: function(instance, callback) {
        return executeInBrowser(k, 'delete', `${JSON.stringify(instance)}, `, callback);
      },
      deleteById: function(s, callback) {
        return executeInBrowser(k, 'deleteById', `'${s}', `, callback);
      },
      save: function(instance, callback) {
        return executeInBrowser(k, 'save', `${JSON.stringify(instance)}, `, callback);
      },
      search: function(instance, callback) {
        return executeInBrowser(k, 'search', `${JSON.stringify(instance)}, `, callback);
      },
      update: function(instance, callback) {
        return executeInBrowser(k, 'update', `${JSON.stringify(instance)}, `, callback);
      }
    };
  });
  return api;
}

describe('api tests', function() {

  beforeAll(function(done) {webpacker(done);}, 8000000);

  var dbUtils, server;
  function setupTests(schema, callback) {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 400000000;
    jasmine.getEnv().defaultTimeoutInterval = 400000000; 

    var customPhantom = webdriver.Capabilities.phantomjs();
    customPhantom.set("phantomjs.binary.path", phantomPath);
    var customChrome = webdriver.Capabilities.chrome();
    global.driver = new webdriver.Builder()
      .withCapabilities(customPhantom)
      .build();
    var finished = {};
    function all(taskName) {
      finished[taskName] = false;
      return function() {
        finished[taskName] = true;
        if (_.every(finished)) {
          driver.get('http://localhost:9090').then(function() {
            return callback(null, makeApi(schema, driver));
          });
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
      server = startServer({port: 9090, distPath: '/../../spec/unit/water-shape/client/dist'}, dbUtils, logger, startServerCallback);
    });
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
});
