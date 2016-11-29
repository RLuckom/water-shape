'use strict';
var _ = require('lodash');
var async = require('async');

module.exports = function(_, async) {
  return {
    createTreeTable: function createTreeTable(dmi, tableDescription, tableName) {
      var tableMethods = {};
      tableMethods.list = function(callback) {
        var autoArgs = {};
        var results = [];
        var required = tableDescription.root;
        _.each(tableDescription.structure, function(component, key) {
          if (!component.select) {
            autoArgs[key] = function(callback) {
              return dmi[component.table].list(function(err, records) {
                if (err) {
                  return callback(err);
                } else {
                  _.each(records, function(record) {
                    var resultItem = {};
                    resultItem[key] = record;
                    results.push(resultItem);
                  });
                  return callback(void(0), records);
                }
              });
            }
          } else {
            var dependencies = _.map(_.filter(component.select, ['type', 'COMPUTED']), function(v) {return _.split(v.key, '.', 1)[0];});
            if (dependencies.indexOf(required) === -1) {
              dependencies.push(required);
            }
            dependencies.push(function(autoResults, callback) {
              var tasks = _.map(results, function(result) {
                return function(callback) {
                  var searchArgs = {};
                  _.each(_.pickBy(component.select, ['type', 'COMPUTED']), function(v, k) {
                    searchArgs[k] = _.get(result, v.key);
                  });
                  _.each(_.pickBy(component.select, ['type', 'LITERAL']), function(v, k) {
                    searchArgs[k] = v.value;
                  });
                  return dmi[component.table].search(searchArgs, function(err, records) {
                    if (err) {
                      return callback(err);
                    } else {
                      if (_.isArray(records) && component.single) {
                        result[key] = records[0];
                      } else {
                        result[key] = records;
                      }
                      return callback(void(0), records);
                    }
                  });
                };
              });
              return async.parallel(tasks, callback);
            });
            autoArgs[key] = dependencies.length === 1 ? dependencies[0] : dependencies;
          }
        });
        return async.auto(autoArgs, function(err) {
          callback(err, results);
        });
      };
      tableMethods.getById = function(id, callback) {
        var autoArgs = {};
        var result = {};
        var required = tableDescription.root;
        _.each(tableDescription.structure, function(component, key) {
          if (!component.select) {
            autoArgs[key] = function(callback) {
              return dmi[component.table].getById(id, function(err, record) {
                if (err) {
                  return callback(err);
                } else {
                  result[key] = record;
                  return callback(void(0), record)
                }
              });
            }
          } else {
            var dependencies = _.map(_.filter(component.select, ['type', 'COMPUTED']), function(v) {return _.split(v.key, '.', 1)[0];});
            if (dependencies.indexOf(required) === -1) {
              dependencies.push(required);
            }
            dependencies.push(function(autoResults, callback) {
              var searchArgs = {};
              _.each(_.pickBy(component.select, ['type', 'COMPUTED']), function(v, k) {
                searchArgs[k] = _.get(result, v.key);
              });
              _.each(_.pickBy(component.select, ['type', 'LITERAL']), function(v, k) {
                searchArgs[k] = v.value;
              });
              return dmi[component.table].search(searchArgs, function(err, records) {
                if (err) {
                  return callback(err);
                } else {
                  if (_.isArray(records) && component.single) {
                    result[key] = records[0];
                  } else {
                    result[key] = records;
                  }
                  return callback(void(0), records);
                }
              });
            });
            autoArgs[key] = dependencies;
          }
        });
        return async.auto(autoArgs, function(err) {
          callback(err, result);
        });
      };
      return tableMethods;
    }
  };
}
