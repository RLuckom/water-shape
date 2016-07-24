'use strict';
const Path = require('path');
var Inert = require('inert');
const Hapi = require('hapi');
const sqlite3 = require('sqlite3');
const winston = require('winston');
const boom = require('boom');
const _ = require('lodash');

winston.add(winston.transports.File, { filename: __dirname + '../logs/hydro.log' });
winston.remove(winston.transports.Console);

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

const allowedTables = {
  'sequences': {id: 'uid'},
  'gpioPins': {id: 'pinNumber'},
  'sequenceItems': {id: 'uid'},
  'sequenceTypes': {id: 'uid'},
}

function startServer(db) {
  const server = new Hapi.Server();

  function dbReply(reply) {
    return function(error, rows) {
      if (error) {
        return winston.log('error', 'db error: ' + error);
      } else {
        winston.log('info', 'e, r: ' + JSON.stringify(error) + JSON.stringify(rows));
        return reply(null, rows);
      }
    };
  }

  function getFromDbById(table, id, callback) {
    // sqlite3 cannot parameterize table names per
    // https://github.com/mapbox/node-sqlite3/issues/330
    // so instead of using its input sanitation we just whitelist
    // the allowed table names.
    if (allowedTables[table]) {
      return db.get(`SELECT * FROM ${table} WHERE ${allowedTables[table].id}=$id;`, {$id: id}, dbReply(callback));
    } else {
      return callback(boom.badRequest(`Unknown table: ${table}`));
    }
  }

  function getAllRowsFromDb(table, callback) {
    // sqlite3 cannot parameterize table names per
    // https://github.com/mapbox/node-sqlite3/issues/330
    // so instead of using its input sanitation we just whitelist
    // the allowed table names.
    if (allowedTables[table]) {
      return db.get(`SELECT * FROM ${table};`, dbReply(callback));
    } else {
      return callback(boom.badRequest(`Unknown table: ${table}`));
    }
  }

  function handlePutToDb(request, reply) {
    if (!allowedTables[request.params.table]) {
      return reply(boom.badRequest(`Unknown table: ${request.params.table}`));
    } else {
      winston.log('info', JSON.stringify(_.keys(request)));
      winston.log('info', JSON.stringify(request.payload));
      winston.log('info', JSON.stringify(request.query));
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
        return getAllRowsFromTable(request.params.table, reply);
      }
    });

    server.route({
      method: 'GET',
      path: '/api/{table}/{id}',
      handler: function(request, reply) {
        return getFromDbById(request.params.table, request.params.id, reply);
      }
    });

    server.start((err) => {

      if (err) {
        throw err;
      }
      winston.log('info', 'Server running at: ' + server.info.uri);

    });
  });
}

var db = new sqlite3.Database(__dirname + '/../hydro.db');
db.on('open', () => {startServer(db)});
