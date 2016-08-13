'use strict';
const dbUtilsFactory = require('../water-shape/persistence/sqlite3-adapter');
const logger = require('../utils/logger')( '/../logs/hydro.log');
const startServer = require('../water-shape/server/hapi-adapter').startServer;
const _ = require('lodash');

dbUtilsFactory(__dirname + '/../hydro.db', require('../schema/schema').schemaFactory(), logger, (dbUtils) => {return dbUtils.createTablesAndDefaultValues(_.partial(startServer, dbUtils, logger));});
