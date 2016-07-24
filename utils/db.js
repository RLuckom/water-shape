'use strict';
const _ = require('lodash');
const logger = require('./logger');
const boom = require('boom');

module.exports = function(db) {

  function upsertIntoDb(table, object, callback) {
    if (allowedTables[table]) {
      const idColumn = allowedTables[table].id;
      const columns = allowedTables[table].columnNames;
      try {
        allowedTables[table].validate(object);
        const values = _.reduce(columns, (r, v, k) => {
          r.push(_.isUndefined(object[v]) ? null : object[v]);
          return r;
        }, []);
        console.log('inserting', object);
        var qs = _.fill(Array(values.length), '?');
        var stmt = db.prepare(`INSERT OR REPLACE into ${table} (${columns.join(', ')}) VALUES (${qs.join(', ')});`, values);
        console.log(JSON.stringify(stmt));
        return db.run(`INSERT OR REPLACE into ${table} (${columns.join(', ')}) VALUES (${qs.join(', ')});`, values, dbLogResponse(callback));
      } catch (err) {
        logger.log('error', `Error upserting: ${err.message}`);
        return callback(err);
      }
    } else {
      return callback(boom.badRequest(`Unknown table: ${table}`));
    }
  }

  function handlePost(table, object, callback) {
    if (allowedTables[table]) {
      const id = object[object[allowedTables[table].id]];
      return db.get(`SELECT * FROM ${table} WHERE ${allowedTables[table].id}=$id;`, {$id: id}, (err, row) => {
        if (err) {
          logger.log('error', `error getting object in POST: ${err.message}`);
          return callback(error);
        } else {
          return upsertIntoDb(table, _.merge(object || {}, row), callback);
        }
      });
    } else {
      return callback(boom.badRequest(`Unknown table: ${table}`));
    }
  }

  const allowedTables = {
    'sequences': {
      id: 'uid',
      columnNames: ['uid', 'dateCreated', 'defaultState', 'name'],
      validate: function() {},
      POST: true,
      PUT: true,
    },
    'gpioPins': {
      id: 'pinNumber',
      columnNames: ['pinNumber', 'sequenceUid'],
      validate: function() {},
      POST: false,
      PUT: true,
    },
    'sequenceItems': {
      id: 'uid',
      columnNames: [
        'uid',
        'dateCreated',
        'sequenceUid',
        'sequenceType',
        'durationSeconds',
        'ordinal',
        'startTime',
        'endTime',
        'state'
      ],
      validate: function() {},
      POST: true,
      PUT: true,
    },
    'sequenceTypes': {
      id: 'sequenceId',
      columnNames: ['sequenceId', 'sequenceTypeName'],
      validate: function() {},
      POST: false,
      PUT: false,
    },
  }

  function dbLogResponse(callback) {
    return function(error, rows) {
      console.log('inserted, ', error, rows);
      if (error) {
        return logger.log('error', 'db error: ' + error);
        callback(new Error(`db error: ${error}`))
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

  function getAllRowsFromTable(table, callback) {
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
    upsertIntoDb: upsertIntoDb,
    handlePost: handlePost,
    getAllRowsFromTable: getAllRowsFromTable
  };
}
