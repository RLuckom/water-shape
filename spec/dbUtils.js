'use strict';
const _ = require('lodash');
var async = require('async');

/*
 *  @param Array records : [[tableName, record]...]
 */
function insertRecordsIntoTables(dmi, records, callback) {
  var tasks = [];
  _.map(records, function(recordAndTable) {
    tasks.push(function(callback) {
      dmi[recordAndTable[0]].save(recordAndTable[1], callback)
    });
  });
  async.series(tasks, function(err, body) {
    if (err) {
      throw err;
    } else {
      callback(dmi);
    }
  });
}

function deleteRecordsFromTables(dmi, records, callback) {
  var tasks = [];
  _.map(records, function(recordAndTable) {
    tasks.push(function(callback) {
      dmi[recordAndTable[0]].delete(recordAndTable[1], callback)
    });
  });
  async.series(tasks, function(err, body) {
    if (err) {
      throw err;
    } else {
      callback(dmi);
    }
  });
}

module.exports = {
  insertRecordsIntoTables: insertRecordsIntoTables,
  deleteRecordsFromTables: deleteRecordsFromTables
};
