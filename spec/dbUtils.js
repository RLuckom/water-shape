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
        logger.log('pushing', recordAndTable);
        tasks.push(function(callback) {
          function cb(err) {
            logger.log('err', err);
            callback();
          }
          db[recordAndTable[0]].save(recordAndTable[1], cb)
        });
      });
      logger.log('task', tasks);
      async.series(tasks, function(err, body) {
        logger.log('debug in insert', `${err} ${body} ${records}`)
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

module.exports = {
  insertRecordsIntoTables: insertRecordsIntoTables
};
