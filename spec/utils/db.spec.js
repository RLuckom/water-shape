const db = require('../../utils/db');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const uuid = require('uuid');

describe('the schema can be turned into a sql document', function() {
  var schema = {
    'sequences': {
      id: 'uid',
      columns: {
        'uid': 'TEXT',
        'dateCreated': 'TEXT',
        'sequenceType': 'NUMBER',
        'defaultState': 'NUMBER'
      },
      apiMethods: {
        GET: true,
        POST: true,
        PUT: true,
        DELETE: true
      },
      constraints: {
        FOREIGN_KEYS: {
          sequenceType : 'sequenceTypes.sequenceId'
        }
      },
    },
    'gpioPins': {
      id: 'pinNumber',
      columns: {
        'pinNumber': 'NUMBER', 
        'sequenceUid': 'TEXT',
      },
      apiMethods: {
        GET: true,
        POST: false,
        PUT: true,
        DELETE: false
      },
      constraints: {
        FOREIGN_KEYS: {
          sequenceUid : 'sequences.uid'
        }
      },
      initialValues: [
        {pinNumber: 14, sequenceUid: null},
        {pinNumber: 15, sequenceUid: null},
        {pinNumber: 18, sequenceUid: null},
        {pinNumber: 23, sequenceUid: null},
        {pinNumber: 24, sequenceUid: null},
        {pinNumber: 25, sequenceUid: null},
        {pinNumber: 8, sequenceUid: null},
        {pinNumber: 7, sequenceUid: null},
        {pinNumber: 2, sequenceUid: null},
        {pinNumber: 3, sequenceUid: null},
        {pinNumber: 4, sequenceUid: null},
        {pinNumber: 17, sequenceUid: null},
        {pinNumber: 27, sequenceUid: null},
        {pinNumber: 22, sequenceUid: null},
        {pinNumber: 10, sequenceUid: null},
        {pinNumber: 9, sequenceUid: null},
        {pinNumber: 11, sequenceUid: null}
      ]
    },
    'sequenceItems': {
      id: 'uid',
      columns: {
        'uid': 'TEXT',
        'dateCreated': 'TEXT',
        'sequenceUid': 'TEXT',
        'durationSeconds': 'NUMBER',
        'ordinal': 'NUMBER',
        'startTime': 'TEXT',
        'endTime': 'TEXT',
        'state': 'TEXT'
      },
      apiMethods: {
        GET: true,
        POST: true,
        PUT: true,
        DELETE: true
      },
      constraints: {
        FOREIGN_KEYS: {
          sequenceUid: 'sequences.uid',
          sequenceType: 'sequenceTypes.sequenceId'
        },
        UNIQUE: [['sequenceUid', 'ordinal']],
      }
    },
    'sequenceTypes': {
      id: 'sequenceId',
      columns: {
        'sequenceId': 'NUMBER',
        'sequenceTypeName': 'TEXT'
      },
      apiMethods: {
        GET: true,
        POST: false,
        PUT: false,
        DELETE: false
      },
      constraints: {
        UNIQUE: [['sequenceTypeName']],
      },
      initialValues: [
        {sequenceId: 1, sequenceTypeName: 'DURATION'},
        {sequenceId: 2, sequenceTypeName: 'TIME'}
      ]
    }
  };

  var dbUtils;

  beforeEach(function(done) {
    try {
      fs.unlinkSync('test.db');
    } catch(err) {} // don't care
    db('test.db', schema, null, function(dbu) {
      dbUtils = dbu;
      done();
    });
  });

  afterEach(function(done) {
    try {
      fs.unlinkSync('test.db');
    } catch(err) {} // don't care
    dbUtils.close(done);
  });

  describe('database creation', function() {
    it('creates a database schema based on the schema object', function() {
      expect(dbUtils.buildSqliteSchema(schema)).toEqual(fs.readFileSync(path.join(__dirname, '../fixtures/schema.sql'), 'utf8'));
    });

    it('can populate the database based on the schema object', function(done) {
      dbUtils.createTablesAndDefaultValues(function() {
        dbUtils.sequenceTypes.list(function(err, rows) {
          if (err) {
            console.log(err);
            expect(true).toBe(false);
          }
          expect(_.isEqual(rows, schema.sequenceTypes.initialValues)).toBe(true);
          done();
        });
      });
    });
  });

  describe('database insertion', function() {
    beforeEach(function(done) {
      dbUtils.createTablesAndDefaultValues(done);
    });

    it('can insert a row into the database and read it out', function(done) {
      const id = uuid.v4();
      const insertRow = {
        uid: id,
        dateCreated: new Date().toString(),
        defaultState: 0,
        sequenceType: 1
      }
      dbUtils.sequences.save(insertRow, function(err, row) {
        expect(row).toEqual(insertRow);
        done();
      });
    });

    it('will add a uid before saving if not supplied', function(done) {
      const uidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const insertRow = {
        dateCreated: new Date().toString(),
        defaultState: 0,
        sequenceType: 1
      }
      dbUtils.sequences.save(insertRow, function(err, row) {
        expect(row.dateCreated).toEqual(insertRow.dateCreated);
        expect(row.defaultState).toEqual(insertRow.defaultState);
        expect(row.sequenceType).toEqual(insertRow.sequenceType);
        expect(uidRegex.test(row.uid)).toBe(true);
        done();
      });
    });

    it('will add a number id before saving if not supplied', function(done) {
      const insertRow = {
        sequenceTypeName: 'TRIGGERED'
      }
      dbUtils.sequenceTypes.save(insertRow, function(err, row) {
        expect(row.sequenceTypeName).toEqual(insertRow.sequenceTypeName);
        expect(row.sequenceId).toBe(3);
        done();
      });
    });

  });
  describe('database search', function() {
    beforeEach(function(done) {
      dbUtils.createTablesAndDefaultValues(done);
    });

    it('will find the correct row', function(done) {
      const insertRow = {
        sequenceId: 1
      }
      dbUtils.sequenceTypes.search(insertRow, function(err, rows) {
        const row = rows[0];
        expect(row.sequenceTypeName).toEqual('DURATION');
        expect(row.sequenceId).toBe(1);
        done();
      });
    });

    it('will find the correct row by not id', function(done) {
      const insertRow = {
        sequenceTypeName: 'DURATION'
      }
      dbUtils.sequenceTypes.search(insertRow, function(err, rows) {
        const row = rows[0];
        expect(row.sequenceTypeName).toEqual('DURATION');
        expect(row.sequenceId).toBe(1);
        done();
      });
    });
  });
});
