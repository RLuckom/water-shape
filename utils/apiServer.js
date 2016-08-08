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

  function handlePutToDb(request, reply) {
    if (!dbUtils.allowedTables[request.params.table]) {
      return reply(boom.badRequest(`Unknown table: ${request.params.table}`));
    } else {
      logger.log('info', JSON.stringify(_.keys(request)));
      logger.log('info', JSON.stringify(request.payload));
      logger.log('info', JSON.stringify(request.query));
    }
  }
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
        const id = request.params.id;
        if (!dbUtils.allowedTables[table].POST) {
          return callback(boom.badRequest(`Unknown table: ${table}`));
        } else {
          const objectToInsert = request.payload;
          objectToInsert[dbUtils.allowedTables[table].id] = objectToInsert[dbUtils.allowedTables[table].id] || uuid.v4();
          return dbUtils.handlePost(table, objectToInsert, reply);
        }
      }
    });

    server.route({
      method: 'POST',
      path: '/api/{table}/{id}',
      handler: function (request, reply) {
        const table = request.params.table;
        const id = request.params.id;
        if (!dbUtils.allowedTables[table].POST) {
          return callback(boom.badRequest(`Unknown table: ${table}`));
        } else {
          const objectToInsert = request.payload;
          if (objectToInsert[dbUtils.allowedTables[table].id] !== id) {
            logger.log('warn', `Got object in POST with different ID than endpoint. endpoint had: ${id} and object had ${objectToInsert[dbUtils.allowedTables[table].id]}`);
          } 
          objectToInsert[dbUtils.allowedTables[table].id] = id;
          return dbUtils.handlePost(table, objectToInsert, reply);
        }
      }
    });

    server.route({
      method: 'PUT',
      path: '/api/{table}/{id}',
      handler: function (request, reply) {
        const table = request.params.table;
        const id = request.params.id;
        if (!dbUtils.allowedTables[table].PUT) {
          return callback(boom.badRequest(`Unknown table: ${table}`));
        } else {
          const objectToInsert = request.payload;
          if (objectToInsert[dbUtils.allowedTables[table].id] !== id) {
            logger.log('warn', `Got object in PUT with different ID than endpoint. endpoint had: ${id} and object had ${objectToInsert[dbUtils.allowedTables[table].id]}`);
          } 
          objectToInsert[dbUtils.allowedTables[table].id] = id;
          return dbUtils.handlePost(table, objectToInsert, reply);
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
        return dbUtils.getFromDbById(request.params.table, request.params.id, reply);
      }
    });

    callback = callback || (err) => {
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
