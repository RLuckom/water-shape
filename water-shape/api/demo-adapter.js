const _ = require('lodash');
const constructedTableFactory = require('../generic/constructed');
const uuid = require('uuid');

//TODO: Add support for POST with ID in url
// Add the option to validate before PUT / POST, using 
// validation logic shared with server side, based on
// required data such as 'all models of this type' etc.
function dmiFactory(schema, logger) {
  function immediate(argsArray, cb) {
    setTimeout(function() {cb.apply({}, argsArray);}, 0);
  }
  var data = {};
  var dmi = {};
  _.each(schema, (v, k) => {
    data[k] = {};
    var endpoint = _.cloneDeep(v);
    if (v.constructed) {
      dmi[k] = constructedTableFactory.createConstructedTable(dmi, v, k);
      return;
    }
    endpoint.list = function(callback) {
      return immediate([void(0), _.cloneDeep(_.values(data[k]))], callback);
    }
    endpoint.search = function(instance, callback) {
      return immediate([void(0), _.cloneDeep(_.filter(data[k], instance))], callback);
    };
    endpoint.getById = function(id, callback) {
      return immediate([void(0), _.cloneDeep(data[k][id])], callback)
    };
    endpoint.update = function(instance, callback) {
      var id = instance[v.id];
      if (_.isUndefined(id)) {
        return immediate([new Error(`Cannot PUT; id field ${v.id} of instance ${JSON.stringify(instance)} is undefined`)], callback);
      }
      if (!data[k][id]) {
        return immediate([new Error('no record to update')], callback);
      }
      _.each(instance, function (v, field) {
        data[k][id][field] = v;
      });
      return immediate([void(0), data[k][id]], callback);
    };
    function addId(instance) {
      if (v.id === 'uid' && !instance.uid) {
        instance.uid = uuid.v4();
      }
    }
    endpoint.save = function(instance, callback) {
      if (schema[k].validate) {
        try {
          return schema[k].validate(instance, dmi, function(err) {
            if (err) {
              callback(err);
            } else {
              addId(instance);
              data[k][instance[v.id]] = instance;
              return immediate([void(0), instance], callback);
            }
          });
        } catch(err) {
          callback(err);
        }
      } else {
        addId(instance);
        data[k][instance[v.id]] = instance;
        return immediate([void(0), instance], callback);
      }
    };
    endpoint.delete = function(instance, callback) {
      var id = instance[v.id];
      if (_.isUndefined(id)) {
        return immediate([new Error(`Cannot DELETE; id field ${v.id} of instance ${JSON.stringify(instance)} is undefined`)], callback);
      }
      return endpoint.deleteById(id, callback);
    };
    endpoint.deleteById = function(id, callback) {
      delete data[k][id];
      return immediate([void(0), void(0)], callback);
    };
    if (v.initialValues) {
      _.each(v.initialValues, function(initialValue) {
        addId(initialValue);
        data[k][initialValue[v.id]] = initialValue;
      });
    }
    dmi[k] = endpoint;
  });
  return dmi;
}
module.exports = dmiFactory;
