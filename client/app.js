const request = require('browser-request');
const schemaFactory = require('../schema/schema').schemaFactory;
const apiFactory = require('../water-shape/api/request-adapter');
const appFactory = require('./appFactory.js');

appFactory(apiFactory(schemaFactory(()=>{}), window.location.href + 'api', request));;
