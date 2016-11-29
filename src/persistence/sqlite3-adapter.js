'use strict';

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

module.exports = function(filename, schema, logger, callback, _, async, sqlite3, uuid) {
  const treeTableFactory = require('../generic/tree')(_, async);
  const validatorTools = require('../generic/validatorWrapper.js')(_);
  validatorTools.guardValidators(schema);
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
      var qs = _.fill(Array(values.length), '?');
      var stmt = db.prepare(`INSERT OR REPLACE into ${table} (${columns.join(', ')}) VALUES (${qs.join(', ')});`, values);
      return db.get(`INSERT OR REPLACE into ${table} (${columns.join(', ')}) VALUES (${qs.join(', ')});`, values, (err, rows) => {
        if (err) {
          logger.log('error', `error upserting into ${table}: ${err}`);
          callback(err);
        } else {
          return getFromDbById(table, id, callback);
        }
      });
    }

    function upsertValidObjectIntoDb(table, object, callback) {
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
              object[idColumn] = id;
              return dbUpsert(table, object, idColumn, id, columns, callback);
            };
            return db.all(`SELECT ${idColumn} FROM ${table};`, idCallback);  
          }
        }
        return dbUpsert(table, object, idColumn, id, columns, callback);
      } else {
        return callback(new Error(`Unknown table: ${table}`));
      }
    }

    function upsertIntoDb(table, object, callback) {
      if (schema[table]) {
        if (schema[table].validate) {
            return schema[table].validate(object, dmi, function(err) {
              logger.log('error', err);
              if (err) {
                return callback(err);
              } else {
                return upsertValidObjectIntoDb(table, object, callback);
              }
            });
        } else {
          return upsertValidObjectIntoDb(table, object, callback);
        }
      } else {
        return callback(new Error(`Unknown table: ${table}`));
      }
    }

    function dbLogResponse(callback, op, table) {
      return function(error, rows) {
        if (error) {
          logger.log('error', 'db error: ' + error);
          return callback(new Error(`db error: ${error}`))
        } else {
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
        return db.get(`SELECT * FROM ${table} WHERE ${schema[table].id}=$id;`, {$id: id}, dbLogResponse(callback, 'searchById', table));
      } else {
        return callback(new Error(`Unknown table: ${table}`));
      }
    }

    function remove(table, obj, callback) {
      const id = _.get(obj, _.get(schema, `${table}.id`));
      if (_.isUndefined(id) || _.isNull(id)) { // '', 0, and false could be IDs
        return callback(new Error(`No ID found on delete from ${table}`));
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
        return db.get(`DELETE FROM ${table} WHERE ${schema[table].id}=$id;`, {$id: id}, dbLogResponse(callback, 'delete', table));
      } else {
        return callback(new Error(`Unknown table: ${table}`));
      }
    }

    function getAllRowsFromTable(table, callback) {
      // sqlite3 cannot parameterize table names per
      // https://github.com/mapbox/node-sqlite3/issues/330
      // so instead of using its input sanitation we just whitelist
      // the allowed table names.
      if (schema[table]) {
        return db.all(`SELECT * FROM ${table};`, dbLogResponse(callback, 'getAll', table));
      } else {
        return callback(new Error(`Unknown table: ${table}`));
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
          if (_.keys(schema[table].columns).indexOf(k) !== -1) {
            columns.push(`${k} is ?`);
            values.push(v);
          } else {
            logger.log('warn', `ignoring unknown query ${k}=${v}`);
          }
        });
        return db.all(`SELECT * FROM ${table} WHERE ${columns.join(', ')};`, values, dbLogResponse(callback, 'search', table));
      } else {
        return callback(new Error(`Unknown table: ${table}`));
      }
    }

    function buildSqliteSchema(schema) {
      var finishedTables = _.filter(_.map(schema, function(v, k) {
        if (v.type === 'TREE') {
          return k;
        }
      }));
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
            if (['uid', 'uuid'].indexOf(tableDescription.id) !== -1 && !val[tableDescription.id]) {
              val[tableDescription.id] = uuid.v4();
            } 
            var values = _.map(_.values(val), (v) => {
              if (_.isUndefined(v) || _.isNull(v)) {
                return 'null';
              } else if (_.isString(v)) {
                return '"' + v + '"';
              } else {
                return v;
              }
            });
            statements += `INSERT OR IGNORE INTO ${tableName} (${_.keys(val).join(', ')}) VALUES (${values.join(', ')});\n${indx === tableDescription.initialValues.length - 1 ? '\n' : ''}`;
          });
          finishedTables.push(tableName);
        });
      }
      return statements;
    }

    function createTablesAndDefaultValues(callback) {
      return db.exec(buildSqliteSchema(schema), callback);
    }

    var dmi = {
      schema: _.cloneDeep(schema),
      close: function(cb) {db.close(cb);},
      buildSqliteSchema: buildSqliteSchema,
      createTablesAndDefaultValues: createTablesAndDefaultValues,
      dbLogResponse:dbLogResponse,
      getFromDbById: getFromDbById,
      searchInTable: searchInTable,
      upsertIntoDb: upsertIntoDb,
      getAllRowsFromTable: getAllRowsFromTable
    };
    _.each(schema, function(tableDescription, tableName) {
      if (tableDescription.type !== 'TREE') {
        var tableMethods = {};
        tableMethods.save = _.partial(upsertIntoDb, tableName);
        tableMethods.update = function(instance, callback) {
          var id = instance[tableDescription.id];
          if (_.isNull(id) || _.isUndefined(id)) {
            return callback(new Error(`Can't save without id column: ${tableDescription.id}`));
          }
          return tableMethods.getById(id, function(err, record) {
            if (!record) {
              return callback(new Error(`Can't update nonexistent object: ${id}`));
            }
            return tableMethods.save(_.merge(record, instance), callback);
          });
        };
        tableMethods.delete = _.partial(remove, tableName);
        tableMethods.deleteById = _.partial(removeById, tableName);
        tableMethods.list = _.partial(getAllRowsFromTable, tableName);
        tableMethods.getById = _.partial(getFromDbById, tableName);
        tableMethods.search = _.partial(searchInTable, tableName);
        dmi[tableName] = tableMethods;
      } else {
        dmi[tableName] = treeTableFactory.createTreeTable(dmi, tableDescription, tableName);
      }
    });
    db.run('PRAGMA foreign_keys = ON;', function() {
      callback(dmi);
    });
  }
}
