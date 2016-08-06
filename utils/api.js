const _ = require('lodash');

//TODO: Add support for POST with ID in url
// Rationalize instance / options / callback args order
// Add the option to validate before PUT / POST, using 
// validation logic shared with server side, based on
// required data such as 'all models of this type' etc.
function apiFactory(schema, apiBaseUrl, request) {
  var api = {};
  _.each(schema, (v, k) => {
    var endpoint = _.cloneDeep(v);
    if (v.apiMethods.GET) {
      endpoint.get = function(options, callback) {
        if (_.isFunction(options)) {
          callback = options;
          options = {};
        }
        return request(_.merge({
          method: 'GET',
          url: apiBaseUrl + '/' + k,
          json: true
        }, options), callback);
      };
    }
    if (v.apiMethods.PUT) {
      endpoint.put = function(instance, options, callback) {
        var id = instance[v.id];
        if (_.isUndefined(id)) {
          throw new Error(`Cannot PUT; id field ${v.id} of instance ${JSON.stringify(instance)} is undefined`);
        }
        if (_.isFunction(options)) {
          callback = options;
          options = {};
        }
        return request(_.merge({
          method: 'PUT',
          url: `${apiBaseUrl}/${k}/${id}`,
          json: true
        }, options, {body: instance}), callback);
      };
    }
    if (v.apiMethods.POST) {
      endpoint.post = function(instance, options, callback) {
        if (_.isFunction(options)) {
          callback = options;
          options = {};
        }
        return request(_.merge({
          method: 'POST',
          url: apiBaseUrl + '/' + k,
          json: true
        }, options), callback);
      };
    }
    if (v.apiMethods.DELETE) {
      endpoint.delete = function(instance, options, callback) {
        var id = instance[v.id];
        if (_.isUndefined(id)) {
          throw new Error(`Cannot PUT; id field ${v.id} of instance ${JSON.stringify(instance)} is undefined`);
        }
        if (_.isFunction(options)) {
          callback = options;
          options = {};
        }
        return request(_.merge({
          method: 'DELETE',
          url: `${apiBaseUrl}/${k}/${id}`,
          json: true
        }, options), callback);
      };
    }
    api[k] = endpoint;
  });
  return api;
}
module.exports = apiFactory;
