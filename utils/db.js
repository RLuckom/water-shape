'use strict';
const _ = require('lodash');
const boom = require('boom');

/*
 * API for data access:
 *
 * //make API object
 * API = apiFromSchema(schema);
 *
 * Search within a table
 * API.<tableName>.search({columName: value...}, callback(err, data));
 *
 * Upsert a record
 *
 * API.<tableName>.save({columnName: value}, callback(err, status));
 * If the ID is supplied in the object, the object is updated, and any fields not
 *  supplied are unchanged from their current values. If the ID is not supplied,
 *  or if no object with the supplied ID exists, a new record is created.
 *
 *  Delete a record
 *
 *  API.<tableName>.delete({}, callback(err, status));
 *  If the argument is an object, delete the record identified by the key corresponding
 *  to the table's primary key column, e.g. 'uid' or 'gpioPin'. If the argument is not an
 *  object, treat it as the primary key of the object to delete.
 */

module.exports = function(db, schema, logger) {

  function dbUpsert(table, object, idColumn, id, columns, callback) {
    const values = _.reduce(columns, (r, v, k) => {
      r.push(_.isUndefined(object[v]) ? null : object[v]);
      return r;
    }, []);
    logger.log('debug', `inserting ${JSON.stringify(object)}`);
    var qs = _.fill(Array(values.length), '?');
    var stmt = db.prepare(`INSERT OR REPLACE into ${table} (${columns.join(', ')}) VALUES (${qs.join(', ')});`, values);
    logger.log('debug', JSON.stringify(stmt));
    return db.get(`INSERT OR REPLACE into ${table} (${columns.join(', ')}) VALUES (${qs.join(', ')});`, values, (err, rows) => {
      if (err) {
        logger.log('error', `error upserting into ${table}: ${error}`);
        callback(err);
      } else {
        return getFromDbById(table, id, callback);
      }
    });
  }

  function upsertIntoDb(table, object, callback) {
    if (schema[table]) {
      const idColumn = schema[table].id;
      const id = object[idColumn];
      const columns = _.values(schema[table].columns);
      return schema[table].validateAndSave(table, object, idColumn, id, columns, callback);
    } else {
      return callback(boom.badRequest(`Unknown table: ${table}`));
    }
  }

  function handlePost(table, object, callback) {
    if (schema[table]) {
      const id = object[object[schema[table].id]];
      return db.get(`SELECT * FROM ${table} WHERE ${schema[table].id}=$id;`, {$id: id}, (err, row) => {
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

  function dbLogResponse(callback) {
    return function(error, rows) {
      logger.log('debug', `insert complete. Error: ${JSON.stringify(error)}, rows: ${rows}`);
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
    if (schema[table]) {
      return db.get(`SELECT * FROM ${table} WHERE ${schema[table].id}=$id;`, {$id: id}, dbLogResponse(callback));
    } else {
      return callback(boom.badRequest(`Unknown table: ${table}`));
    }
  }

  function getAllRowsFromTable(table, callback) {
    // sqlite3 cannot parameterize table names per
    // https://github.com/mapbox/node-sqlite3/issues/330
    // so instead of using its input sanitation we just whitelist
    // the allowed table names.
    if (schema[table]) {
      return db.all(`SELECT * FROM ${table};`, dbLogResponse(callback));
    } else {
      return callback(boom.badRequest(`Unknown table: ${table}`));
    }
  }

  function searchInTable(table, query,  callback) {
    // sqlite3 cannot parameterize table names per
    // https://github.com/mapbox/node-sqlite3/issues/330
    // so instead of using its input sanitation we just whitelist
    // the allowed table names.
    if (schema[table]) {
      var columns = [];
      var values = [];
      _.each(query, function(v, k) {
        logger.log('info', `searching for ${k} in ${JSON.stringify(_.values(schema[table].columns))}`);
        if (_.values(schema[table].columns).indexOf(k) !== -1) {
          columns.push(`${k}=?`);
          values.push(v);
        } else {
          logger.log('warn', `ignoring unknown query ${k}=${v}`);
        }
      });
      return db.all(`SELECT * FROM ${table} WHERE ${columns.join(', ')};`, values, dbLogResponse(callback));
    } else {
      return callback(boom.badRequest(`Unknown table: ${table}`));
    }
  }

  return {
    schema: _.cloneDeep(schema),
    dbLogResponse:dbLogResponse,
    getFromDbById: getFromDbById,
    searchInTable: searchInTable,
    upsertIntoDb: upsertIntoDb,
    handlePost: handlePost,
    getAllRowsFromTable: getAllRowsFromTable
  };
}
