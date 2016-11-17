'use strict';
const Path = require('path');
var Inert = require('inert');
const Hapi = require('hapi');
const sqlite3 = require('sqlite3');
const boom = require('boom');
const _ = require('lodash');
const uuid = require('node-uuid');

function startServer(opts, dmi, logger, callback) {
  logger = logger || {
    log: (level, message) => {
      return console.log(`[ ${level} ] ${message}`);
    }
  };
  if (callback && !_.isFunction(callback)) {
    throw new Error(`callback is ${callback}, not function`);
  }
  const server = new Hapi.Server();

  server.register(Inert, function() {
    server.connection({ port: opts.port });

    server.route({
      method: 'GET',
      path: '/{param*}',
      handler: {
        directory: {
          path: __dirname + opts.distPath
        }
      }
    });

    server.route({
      method: 'POST',
      path: '/api/{table}',
      handler: function (request, reply) {
        const table = request.params.table;
        if (!_.get(dmi.schema, `${request.params.table}.apiMethods.POST`)) {
          return callback(boom.badRequest(`Unknown table: ${table}`));
        } else {
          var objectToInsert = request.payload;
          if (_.isString(objectToInsert)) {
            try {
              objectToInsert = JSON.parse(objectToInsert);
            } catch (err) {
              logger.log('error', 'Got non-JSON object and could not parse')
            }
          }
          objectToInsert[dmi.schema[table].id] = objectToInsert[dmi.schema[table].id] || uuid.v4();
          return dmi[table].save(objectToInsert, reply);
        }
      }
    });

    server.route({
      method: 'POST',
      path: '/api/{table}/{id}',
      handler: function (request, reply) {
        const table = request.params.table;
        const id = request.params.id;
        if (!dmi.schema[table].apiMethods.POST) {
          return callback(boom.badRequest(`Unknown table: ${table}`));
        } else {
          var objectToInsert = request.payload;
          if (_.isString(objectToInsert)) {
            try {
              objectToInsert = JSON.parse(objectToInsert);
            } catch (err) {
              logger.log('error', 'Got non-JSON object and could not parse')
            }
          }
          if (objectToInsert[dmi.schema[table].id] !== id) {
            logger.log('warn', `Got object in POST with different ID than endpoint. endpoint had: ${id} and object had ${objectToInsert[dmi.schema[table].id]}`);
          } 
          objectToInsert[dmi.schema[table].id] = id;
          return dmi[table].save(objectToInsert, reply);
        }
      }
    });

    server.route({
      method: 'DELETE',
      path: '/api/{table}/{id}',
      handler: function (request, reply) {
        const table = request.params.table;
        const id = request.params.id;
        if (!dmi.schema[table].apiMethods.DELETE) {
          return callback(boom.badRequest(`Unknown table: ${table}`));
        } else {
          return dmi[table].deleteById(id, reply);
        }
      }
    });

    server.route({
      method: 'PUT',
      path: '/api/{table}/{id}',
      handler: function (request, reply) {
        const table = request.params.table;
        const id = request.params.id;
        if (!dmi.schema[table].apiMethods.PUT) {
          return callback(boom.badRequest(`Unknown table: ${table}`));
        } else {
          var objectToInsert = request.payload;
          if (_.isString(objectToInsert)) {
            try {
              objectToInsert = JSON.parse(objectToInsert);
            } catch (err) {
              logger.log('error', 'Got non-JSON object and could not parse')
            }
          }
          if (objectToInsert[dmi.schema[table].id] !== id) {
            logger.log('warn', `Got object in PUT with different ID than endpoint. endpoint had: ${id} and object had ${objectToInsert[dmi.schema[table].id]}`);
          } 
          objectToInsert[dmi.schema[table].id] = id;
          return dmi[table].update(objectToInsert, reply);
        }
      }
    });

    server.route({
      method: 'GET',
      path: '/api/{table}',
      handler: function(request, reply) {
        if (_.keys(request.query).length) {
          return dmi[request.params.table].search(request.query, reply);
        } else {
          logger.log('info', `GET ${request.params.table}`);
          return dmi[request.params.table].list(reply);
        }
      }
    });

    server.route({
      method: 'GET',
      path: '/api/{table}/{id}',
      handler: function(request, reply) {
        logger.log('debug', `GET ${request.params.table}/${request.params.id}`)
        return dmi[request.params.table].getById(request.params.id, reply);
      }
    });

    callback = callback || function(err) {
      if (err) {
        throw err;
      }
      logger.log('info', 'Server running at: ' + server.info.uri);

    };
    server.start(callback);
  });

  return server;
}

module.exports = {
  startServer: startServer
};
