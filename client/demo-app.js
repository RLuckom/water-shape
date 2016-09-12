const schemaFactory = require('../schema/schema').schemaFactory;
const apiFactory = require('../water-shape/api/demo-adapter');
const appFactory = require('./appFactory.js');

appFactory(apiFactory(schemaFactory(()=>{})));;
