module.exports = {
  api: {
    demoAdapter: require('./src/api/demo-adapter'),
    requestAdapter: require('./src/api/request-adapter')
  },
  persistence: {
    sqlite3Adapter: require('./src/persistence/sqlite3-adapter')
  },
  server: {
    hapiAdapter: require('./src/server/hapi-adapter')
  }
};
