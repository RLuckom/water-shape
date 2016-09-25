'use strict';
const _ = require('lodash');
const constructedTableFactory = require('../generic/constructed');

//TODO: Add support for POST with ID in url
// Add the option to validate before PUT / POST, using 
// validation logic shared with server side, based on
// required data such as 'all models of this type' etc.
function apiFactory(schema, apiBaseUrl, request) {
  function translateToGeneric(callback) {
    return function(e, r, b) {
      callback(e, b);
    };
  }
  var dmi = {};
  _.each(schema, (v, k) => {
    var endpoint = _.cloneDeep(v);
    if (v.constructed) {
      dmi[k] = constructedTableFactory.createConstructedTable(dmi, v, k);
      return;
    }
    if (v.apiMethods.GET) {
      endpoint.get = function(callback) {
        return request({
          method: 'GET',
          url: apiBaseUrl + '/' + k,
          json: true
        }, callback);
      };
      endpoint.list = function(callback) {
        return endpoint.get(translateToGeneric(callback));
      }
      endpoint.search = function(instance, callback) {
        return request({
          method: 'GET',
          qs: instance,
          url: apiBaseUrl + '/' + k,
          json: true
        }, translateToGeneric(callback));
      };
      endpoint.getById = function(id, callback) {
        return request({
          method: 'GET',
          url: `${apiBaseUrl}/${k}/${id}`,
          json: true
        }, translateToGeneric(callback));
      };
    }
    if (v.apiMethods.PUT) {
      endpoint.put = function(instance, callback) {
        var id = instance[v.id];
        if (_.isUndefined(id)) {
          throw new Error(`Cannot PUT; id field ${v.id} of instance ${JSON.stringify(instance)} is undefined`);
        }
        return request({
          method: 'PUT',
          url: `${apiBaseUrl}/${k}/${id}`,
          json: true,
          body: instance
        }, callback);
      };
      endpoint.update = function(instance, callback) {
        if (v.validate) {
          try {
            v.validate(instance, dmi, function(err, validate) {
              if (err) {
                callback(err)
              } else {
                endpoint.put(instance, translateToGeneric(callback));
              }
            });
          } catch(err) {
            callback(err);
          }
        } else {
          endpoint.put(instance, translateToGeneric(callback));
        }
      };
    }
    if (v.apiMethods.POST) {
      endpoint.post = function(instance, callback) {
        return request({
          method: 'POST',
          url: apiBaseUrl + '/' + k,
          json: true,
          body: instance
        }, callback);
      };
    }
    endpoint.save = function(instance, callback) {
      if (v.validate) {
        try {
          v.validate(instance, dmi, function(err, validate) {
            if (err) {
              callback(err)
            } else {
              endpoint.post(instance, translateToGeneric(callback));
            }
          });
        } catch(err) {
          callback(err);
        }
      } else {
        endpoint.post(instance, translateToGeneric(callback));
      }
    };
    if (v.apiMethods.DELETE) {
      endpoint.delete = function(instance, callback) {
        var id = instance[v.id];
        if (_.isUndefined(id)) {
          throw new Error(`Cannot DELETE; id field ${v.id} of instance ${JSON.stringify(instance)} is undefined`);
        }
        return endpoint.deleteById(id, callback);
      };
      endpoint.deleteById = function(id, callback) {
        return request({
          method: 'DELETE',
          url: `${apiBaseUrl}/${k}/${id}`,
          json: true
        }, translateToGeneric(callback));
      };
    }
    dmi[k] = endpoint;
  });
  return dmi;
}
module.exports = apiFactory;
