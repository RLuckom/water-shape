const schemaTools = require('../../utils/schema');
const fs = require('fs');
const path = require('path');

describe('the schema can be turned into a sql document', function() {
  var schema = {
    'sequences': {
      id: 'uid',
      columns: {
        'uid': 'TEXT',
        'dateCreated': 'TEXT',
        'sequenceType': 'NUMBER',
        'defaultState': 'TEXT'
      },
      apiMethods: {
        GET: true,
        POST: true,
        PUT: true,
        DELETE: true
      }
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

  it('can be done', function() {
    expect(schemaTools.buildSqliteSchema(schema)).toEqual(fs.readFileSync(path.join(__dirname, '../fixtures/schema.sql'), 'utf8'));
  });
});
