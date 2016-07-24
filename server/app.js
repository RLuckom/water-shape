'use strict';
const Path = require('path');
var Inert = require('inert');
const Hapi = require('hapi');
const sqlite3 = require('sqlite3');
const boom = require('boom');
const _ = require('lodash');
const dbUtilsFactory = require('../utils/db');
const logger = require('../utils/logger');

function validateSequence() {
}

function validateGpioPin() {
  throw new Error('Not allowed to save pins.');
}

function validateSequenceItem() {
}

function validateSequenceType() {
  throw new Error('Not allowed to save sequence types.');
}

function startServer(db) {
  const server = new Hapi.Server();
  const dbUtils = dbUtilsFactory(db);

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
          path: __dirname + '/dist'
        }
      }
    });

    server.route({
      method: 'PUT',
      path: '/api/{table?}',
      handler: handlePutToDb
    });

    server.route({
      method: 'GET',
      path: '/api/{table}',
      handler: function(request, reply) {
        return dbUtils.getAllRowsFromTable(request.params.table, reply);
      }
    });

    server.route({
      method: 'GET',
      path: '/api/{table}/{id}',
      handler: function(request, reply) {
        return dbUtils.getFromDbById(request.params.table, request.params.id, reply);
      }
    });

    server.start((err) => {

      if (err) {
        throw err;
      }
      logger.log('info', 'Server running at: ' + server.info.uri);

    });
  });
}

var db = new sqlite3.Database(__dirname + '/../hydro.db');
db.on('open', () => {startServer(db)});
