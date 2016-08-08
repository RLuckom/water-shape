'use strict';
const _ = require('lodash');
const boom = require('boom');
const sqlite3 = require('sqlite3');
const uuid = require('uuid');

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

module.exports = function(filename, schema, logger, callback) {
  logger = logger || {
    log: (level, message) => {
      return console.log(`[ ${level} ] ${message}`);
    }
  };
  var db = new sqlite3.Database(filename, onDbReady);
  function onDbReady(err) {
    if (err) {
      throw err;
    }
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
        const columns = _.keys(schema[table].columns);
        const idColumn = schema[table].id;
        var id = object[idColumn];
        if (!id) {
          if (['uid', 'uuid'].indexOf(idColumn) !== -1) {
            id = uuid.v4();
            object[idColumn] = id;
          } else if (schema[table].columns[idColumn] === 'NUMBER') {
            logger.log('warn', 'Making best effort to choose unused number ID. May overwrite existing record');
            var idCallback = function(err, rows) {
              if (err) {
                logger.log('error', `Got error ${err} trying to read ${table} ids`);
                return callback(err);
              }
              id = _.toInteger(_.maxBy(rows, (r) => {return _.toInteger(r[idColumn]);})[idColumn]) + 1;
              logger.log('info', id);
              object[idColumn] = id;
              return dbUpsert(table, object, idColumn, id, columns, callback);
            };
            return db.all(`SELECT ${idColumn} FROM ${table};`, idCallback);  
          }
        }
        return dbUpsert(table, object, idColumn, id, columns, callback);
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

    function remove(table, obj, callback) {
      const id = _.get(obj, _.get(schema, `${table}.id`));
      if (_.isUndefined(id) || _.isNull(id)) { // '', 0, and false could be IDs
        return callback(boom.badRequest(`No ID found on delete from ${table}`));
      } else {
        return removeById(table, id, callback);
      }
    }

    function removeById(table, id, callback) {
      // sqlite3 cannot parameterize table names per
      // https://github.com/mapbox/node-sqlite3/issues/330
      // so instead of using its input sanitation we just whitelist
      // the allowed table names.
      if (schema[table]) {
        return db.get(`DELETE * FROM ${table} WHERE ${schema[table].id}=$id;`, {$id: id}, dbLogResponse(callback));
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
          logger.log('info', `searching for ${k} in ${JSON.stringify(_.keys(schema[table].columns))}`);
          if (_.keys(schema[table].columns).indexOf(k) !== -1) {
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

    function buildSqliteSchema(schema) {
      var finishedTables = [];
      var tableDependencies = _.reduce(schema, function(acc, val, key) {
        var dependencies = [];
        var foreignKeyConstraints = _.get(val, 'constraints.FOREIGN_KEYS');
        if (foreignKeyConstraints) {
          _.each(foreignKeyConstraints, function(v, k) {
            // v  e.g.=  'sequences.uid'
            dependencies.push(v.split('.')[0]);
          });
          acc[key] = dependencies;
        }
        return acc;
      }, {});
      var statements = '';
      while (finishedTables.length !== _.keys(schema).length) {
        _.each(schema, function(tableDescription, tableName) {
          var unmetDependencies = _.some(
            tableDependencies[tableName], function(dependencyName) {
              return finishedTables.indexOf(dependencyName) === -1;
            }
          );
          if (finishedTables.indexOf(tableName) !== -1 || unmetDependencies) {
            return;
          }
          var createStatement = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
          var statementBodyList = [];
          _.each(tableDescription.columns, function(type, name) {
            statementBodyList.push(`  ${name} ${type}${tableDescription.id === name ? ' PRIMARY KEY' : ''}`);
          });

          _.each(_.get(tableDescription, 'constraints.UNIQUE'), function(uniqueList) {
            statementBodyList.push(`  UNIQUE (${uniqueList.join(', ')})`);
          });

          _.each(_.get(tableDescription, 'constraints.FOREIGN_KEYS'), function(otherColumn, selfColumn) {
            statementBodyList.push(`  FOREIGN KEY(${selfColumn}) REFERENCES ${otherColumn.split('.')[0]}(${otherColumn.split('.')[1]})`);
          });
          createStatement += `${statementBodyList.join(',\n')}\n);\n\n`;
          statements += createStatement;
          _.each(tableDescription.initialValues, function(val, indx) {
            var values = _.map(_.values(val), (v) => {
              if (_.isUndefined(v) || _.isNull(v)) {
                return 'null';
              } else if (_.isString(v)) {
                return '"' + v + '"';
              } else {
                return v;
              }
            });
            statements += `INSERT OR ABORT INTO ${tableName} (${_.keys(val).join(', ')}) VALUES (${values.join(', ')});\n${indx === tableDescription.initialValues.length - 1 ? '\n' : ''}`;
          });
          finishedTables.push(tableName);
        });
      }
      return statements;
    }

    function createTablesAndDefaultValues(callback) {
      return db.exec(buildSqliteSchema(schema), callback);
    }

    var response = {
      schema: _.cloneDeep(schema),
      close: function(cb) {db.close(cb);},
      buildSqliteSchema: buildSqliteSchema,
      createTablesAndDefaultValues: createTablesAndDefaultValues,
      dbLogResponse:dbLogResponse,
      getFromDbById: getFromDbById,
      searchInTable: searchInTable,
      upsertIntoDb: upsertIntoDb,
      handlePost: handlePost,
      getAllRowsFromTable: getAllRowsFromTable
    };
    _.each(schema, function(tableDescription, tableName) {
      var tableMethods = {};
      tableMethods.save = _.partial(upsertIntoDb, tableName);
      tableMethods.search = _.partial(searchInTable, tableName);
      tableMethods.getAll = _.partial(getAllRowsFromTable, tableName);
      tableMethods.getById = _.partial(getFromDbById, tableName);
      tableMethods.removeById = _.partial(removeById, tableName);
      tableMethods.remove = _.partial(remove, tableName);
      response[tableName] = tableMethods;
    });
    callback(response);
  }
}
