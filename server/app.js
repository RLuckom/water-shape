'use strict';
const dbUtilsFactory = require('../utils/db');
const logger = require('../utils/logger')( '/../logs/hydro.log');
const startServer = require('../utils/apiServer').startServer;

dbUtilsFactory(__dirname + '/../hydro.db', require('../utils/schema').schemaFactory(), logger, (dbUtils) => {return startServer(dbUtils, logger);});
