'use strict';
const dbUtils = require('./../water-shape/persistence/sqlite3-adapter.js');
const _ = require('lodash');
var async = require('async');

/*
 *  @param Array records : [[tableName, record]...]
*/
function insertRecordsIntoTables(filename, schema, records, logger, callback) {
  function receiveDBAndPopulate(db) {
    db.createTablesAndDefaultValues(function() {
      var tasks = [];
      _.map(records, function(recordAndTable) {
        tasks.push(function(callback) {
          db[recordAndTable[0]].save(recordAndTable[1], callback)
        });
      });
      async.series(tasks, function(err, body) {
        if (err) {
          throw err;
        } else {
          callback(db);
        }
      });
    });
  }
  dbUtils(filename, schema, logger, receiveDBAndPopulate);
}

function deleteRecordsFromTables(db, records, logger, callback) {
  var tasks = [];
  _.map(records, function(recordAndTable) {
    tasks.push(function(callback) {
      db[recordAndTable[0]].delete(recordAndTable[1], callback)
    });
  });
  async.series(tasks, function(err, body) {
    if (err) {
      throw err;
    } else {
      callback(db);
    }
  });
}

module.exports = {
  insertRecordsIntoTables: insertRecordsIntoTables,
  deleteRecordsFromTables: deleteRecordsFromTables
};
