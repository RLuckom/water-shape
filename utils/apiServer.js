'use strict';
const Path = require('path');
var Inert = require('inert');
const Hapi = require('hapi');
const sqlite3 = require('sqlite3');
const boom = require('boom');
const _ = require('lodash');
const uuid = require('node-uuid');

function startServer(dbUtils, logger, callback) {
  logger = logger || {
    log: (level, message) => {
      return console.log(`[ ${level} ] ${message}`);
    }
  };
  const server = new Hapi.Server();

  server.register(Inert, function() {
    server.connection({ port: 8080 });

    server.route({
      method: 'GET',
      path: '/{param*}',
      handler: {
        directory: {
          path: __dirname + '/../dist'
        }
      }
    });

    server.route({
      method: 'POST',
      path: '/api/{table}',
      handler: function (request, reply) {
        const table = request.params.table;
        if (!_.get(dbUtils.schema, `${request.params.table}.apiMethods.POST`)) {
          return callback(boom.badRequest(`Unknown table: ${table}`));
        } else {
          logger.log('debug', `POST ${request.params.table}`)
          const objectToInsert = request.payload;
          objectToInsert[dbUtils.schema[table].id] = objectToInsert[dbUtils.schema[table].id] || uuid.v4();
          return dbUtils[table].save(objectToInsert, reply);
        }
      }
    });

    server.route({
      method: 'POST',
      path: '/api/{table}/{id}',
      handler: function (request, reply) {
        const table = request.params.table;
        const id = request.params.id;
        if (!dbUtils.schema[table].apiMethods.POST) {
          return callback(boom.badRequest(`Unknown table: ${table}`));
        } else {
          const objectToInsert = request.payload;
          if (objectToInsert[dbUtils.schema[table].id] !== id) {
            logger.log('warn', `Got object in POST with different ID than endpoint. endpoint had: ${id} and object had ${objectToInsert[dbUtils.schema[table].id]}`);
          } 
          objectToInsert[dbUtils.schema[table].id] = id;
          return dbUtils[table].save(objectToInsert, reply);
        }
      }
    });

    server.route({
      method: 'DELETE',
      path: '/api/{table}/{id}',
      handler: function (request, reply) {
        const table = request.params.table;
        const id = request.params.id;
        if (!dbUtils.schema[table].apiMethods.DELETE) {
          return callback(boom.badRequest(`Unknown table: ${table}`));
        } else {
          return dbUtils[table].removeById(id, reply);
        }
      }
    });

    server.route({
      method: 'PUT',
      path: '/api/{table}/{id}',
      handler: function (request, reply) {
        const table = request.params.table;
        const id = request.params.id;
        if (!dbUtils.schema[table].apiMethods.PUT) {
          return callback(boom.badRequest(`Unknown table: ${table}`));
        } else {
          const objectToInsert = request.payload;
          if (objectToInsert[dbUtils.schema[table].id] !== id) {
            logger.log('warn', `Got object in PUT with different ID than endpoint. endpoint had: ${id} and object had ${objectToInsert[dbUtils.schema[table].id]}`);
          } 
          objectToInsert[dbUtils.schema[table].id] = id;
          return dbUtils[table].save(objectToInsert, reply);
        }
      }
    });

    server.route({
      method: 'GET',
      path: '/api/{table}',
      handler: function(request, reply) {
        logger.log('info', `${JSON.stringify(_.keys(request))}`);
        logger.log('info', `1 searching in ${request.params.table} with query: ${JSON.stringify(request.query)}`);
        if (_.keys(request.query).length) {
          logger.log('info', `searching in ${request.params.table} with query: ${JSON.stringify(request.query)}`);
          return dbUtils.searchInTable(request.params.table, request.query, reply);
        } else {
          logger.log('info', `getting from ${request.params.table}`);
          return dbUtils.getAllRowsFromTable(request.params.table, reply);
        }
      }
    });

    server.route({
      method: 'GET',
      path: '/api/{table}/{id}',
      handler: function(request, reply) {
        logger.log('debug', `GET ${request.params.table}/${request.params.id}`)
        return dbUtils.getFromDbById(request.params.table, request.params.id, reply);
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
