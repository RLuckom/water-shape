const _ = require('lodash');

//TODO: Add support for POST with ID in url
// Add the option to validate before PUT / POST, using 
// validation logic shared with server side, based on
// required data such as 'all models of this type' etc.
function apiFactory(schema, apiBaseUrl, request) {
  var api = {};
  _.each(schema, (v, k) => {
    var endpoint = _.cloneDeep(v);
    if (v.apiMethods.GET) {
      endpoint.get = function(callback) {
        return request({
          method: 'GET',
          url: apiBaseUrl + '/' + k,
          json: true
        }, callback);
      };
      endpoint.list = endpoint.get;
      endpoint.search = function(instance, callback) {
        return request({
          method: 'GET',
          qs: instance,
          url: apiBaseUrl + '/' + k,
          json: true
        }, callback);
      };
      endpoint.getById = function(id, callback) {
        var qs = {};
        qs[v.id] = id;
        endpoint.search(qs, callback);
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
      endpoint.update = endpoint.put;
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
        }, callback);
      };
    }
    endpoint.save = endpoint.post;
    api[k] = endpoint;
  });
  return api;
}
module.exports = apiFactory;
