const request = require('browser-request');
const schema = require('../testSchema');
const async = require('async');
const _ = require('lodash');
const apiFactory = require('../../../src/api/request-adapter');
window._ = require('lodash');

window.api = apiFactory(schema, window.location.href + 'api', request, _, async);
