'use strict';
const Path = require('path');
var Inert = require('inert');
const Hapi = require('hapi');
const sqlite3 = require('sqlite3');
const winston = require('winston');

winston.add(winston.transports.File, { filename: __dirname + '/hydro.log' });
winston.remove(winston.transports.Console);

function startServer(db) {
  const server = new Hapi.Server();
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
      method: 'GET',
      path: '/api/gpioPins',
      handler: function(request, reply) {
        winston.log('error', 'get gpio');
        db.all('SELECT * FROM gpioPins;', reply);
      }  
    });

    server.start((err) => {

      if (err) {
        throw err;
      }
      console.log('Server running at:', server.info.uri);

    });
  });
}

var db = new sqlite3.Database(__dirname + '/hydro.db');
db.on('open', () => {startServer(db)});
