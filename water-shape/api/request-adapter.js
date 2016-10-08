'use strict';
const _ = require('lodash');
const constructedTableFactory = require('../generic/constructed');
const validatorTools = require('../generic/validatorWrapper.js');

//TODO: Add support for POST with ID in url
// Add the option to validate before PUT / POST, using 
// validation logic shared with server side, based on
// required data such as 'all models of this type' etc.
function apiFactory(schema, apiBaseUrl, request) {
  validatorTools.guardValidators(schema);
  function tryParse(b) {
    try {
      return JSON.parse(b);
    } catch(err) {
      return b;
    }
  }
  function translateToGeneric(callback) {
    return function(e, r, b) {
      return callback(e, tryParse(b));
    };
  }
  var dmi = {};
  _.each(schema, (v, k) => {
    var endpoint = _.cloneDeep(v);
    if (v.constructed) {
      var constructedMethods = constructedTableFactory.createConstructedTable(dmi, v, k);
      function createRevert(manualFunction, callback) {
        return function revertToManual(err, response, body) {
          if (err || !(parseInt(response.statusCode) >= 200 && parseInt(response.statusCode) <= 300)) {
            return manualFunction(callback);
          } else {
            return callback(err, tryParse(body));
          }
        };
      }
      dmi[k] = {
        list: function(callback) {
          return request({
            method: 'GET',
            url: apiBaseUrl + '/' + k,
            json: true
          }, createRevert(constructedMethods.list, callback));
        },
        getById: function(id, callback) {
          return request({
            method: 'GET',
            url: `${apiBaseUrl}/${k}/${id}`,
          }, createRevert(_.partial(constructedMethods.getById, id), callback));
        }
      }
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
        }, translateToGeneric(callback));
      };
      endpoint.getById = function(id, callback) {
        return request({
          method: 'GET',
          url: `${apiBaseUrl}/${k}/${id}`,
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
          body: instance,
          json: true
        }, callback);
      };
      endpoint.update = function(instance, callback) {
        var id = instance[v.id];
        if (v.validate) {
          return v.validate(instance, dmi, function(err, validate) {
            if (err) {
              return callback(err)
            } else {
              return request({
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                url: `${apiBaseUrl}/${k}/${id}`,
                body: JSON.stringify(instance),
              },  translateToGeneric(callback));
            }
          });
        } else {
          return request({
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            url: `${apiBaseUrl}/${k}/${id}`,
            body: JSON.stringify(instance)
          },  translateToGeneric(callback));
        }
      };
    }
    if (v.apiMethods.POST) {
      endpoint.post = function(instance, callback) {
        return request({
          method: 'POST',
          url: apiBaseUrl + '/' + k,
          body: instance,
          json: true
        }, callback);
      };
    }
    endpoint.save = function(instance, callback) {
      if (v.validate) {
        return v.validate(instance, dmi, function(err, validate) {
          if (err) {
            return callback(err)
          } else {
            return request({
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              url: apiBaseUrl + '/' + k,
              body: JSON.stringify(instance)
            },  translateToGeneric(callback));
          }
        });
      } else {
        return request({
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          url: apiBaseUrl + '/' + k,
          body: JSON.stringify(instance)
        },  translateToGeneric(callback));
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
        }, translateToGeneric(callback));
      };
    }
    dmi[k] = endpoint;
  });
  return dmi;
}
module.exports = apiFactory;
