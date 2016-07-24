'use strict';
const _ = require('lodash');
const logger = require('./logger');
const boom = require('boom');

module.exports = function(db) {

  const allowedTables = {
    'sequences': {id: 'uid'},
    'gpioPins': {id: 'pinNumber'},
    'sequenceItems': {id: 'uid'},
    'sequenceTypes': {id: 'uid'},
  }

  function dbLogResponse(callback) {
    return function(error, rows) {
      if (error) {
        return logger.log('error', 'db error: ' + error);
        callback(new Error(`db error: ${error}`))
      } else if (!rows) {
        return callback(new Error('no results found'));
      } else {
        logger.log('info', 'e, r: ' + JSON.stringify(error) + JSON.stringify(rows));
        return callback(null, rows);
      }
    };
  }

  function getFromDbById(table, id, callback) {
    // sqlite3 cannot parameterize table names per
    // https://github.com/mapbox/node-sqlite3/issues/330
    // so instead of using its input sanitation we just whitelist
    // the allowed table names.
    if (allowedTables[table]) {
      return db.get(`SELECT * FROM ${table} WHERE ${allowedTables[table].id}=$id;`, {$id: id}, dbLogResponse(callback));
    } else {
      return callback(boom.badRequest(`Unknown table: ${table}`));
    }
  }

  function getAllRowsFromDb(table, callback) {
    // sqlite3 cannot parameterize table names per
    // https://github.com/mapbox/node-sqlite3/issues/330
    // so instead of using its input sanitation we just whitelist
    // the allowed table names.
    if (allowedTables[table]) {
      return db.get(`SELECT * FROM ${table};`, dbLogResponse(callback));
    } else {
      return callback(boom.badRequest(`Unknown table: ${table}`));
    }
  }

  return {
    allowedTables: _.cloneDeep(allowedTables),
    dbLogResponse:dbLogResponse,
    getFromDbById: getFromDbById,
    getAllRowsFromDb: getAllRowsFromDb
  };
}
