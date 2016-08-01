'use strict';
var _ = require('lodash');

/* sequence name is unique
 * sequence uid is unique
 * sequence type exists in sequenceTypes
 */
function validateSequence(sequence, sequencesByName, sequencesByUid, sequenceTypes) {
  return (
    // sequencesByName is falsy or has length 0
    (!sequencesByName || (sequencesByName.length === 0))
    // sequencesByUid is falsy or has length 0
    && (!sequencesByUid || (sequencesByUid.length === 0))
  // name and uid are defined
    && sequence.name && sequence.uid
    && _.find(sequenceTypes, 'sequenceId', sequence.sequenceType)
  );
}
validateSequence.restParams = ['sequencesByName', 'sequencesByUid'];

/* gpioPins can't be created but they can be modified.
 * Only the sequenceUid can be changed.
 */
function validateGpioPins(gpioPin, gpioPinByUid) {
  return (
    _.values(gpioPin).length === _.values(gpioPinByUid).length
    && _.every(_.values(this.columns), function(n) {
      return n === 'sequenceUid' ? true : gpioPin[n] === gpioPinByUid[n];
    })
  );
}

/* uid is unique
 * if sequenceType is duration, durationSeconds is defined and startTime and endTime are not.
 * if sequenceType is time, durationSeconds is not defined and startTime and endTime are.
 * if sequenceType is duration, there are no sequenceItems with the same ordinal and sequenceUid
 * if sequenceType is time, there are no sequenceItems in the same sequence that the startTime or endTime falls in.
 * state is defined
 */
function sequenceItems(sequenceItem, sequenceByUid, sequenceTypes, sequenceItemsBySequenceUid) {
  const sequenceTypeName = _.find(sequenceTypes, 'sequenceId', sequenceByUid.sequenceType).sequenceTypeName;
  const durationOk = (
    sequenceTypeName === 'TIME'
    || (
      !_.any(sequenceItemsBySequenceUid, 'ordinal', sequenceItem.ordinal)
      && (_.isNumber(sequenceItem.durationSeconds) 
      && !sequenceItem.startTime
      && !sequenceItem.endTime
      )
    ));
  const timeOk = (
    sequenceTypeName === 'DURATION'
  )
}

function schemaFactory(noOpValidate) {
  return  {
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
}

function buildSqliteSchema(schema) {
  var finishedTables = [];
  var tableDependencies = _.reduce(schema, function(acc, val, key) {
    var dependencies = [];
    var foreignKeyConstraints = _.get(val, 'constraints.FOREIGN_KEYS');
    if (foreignKeyConstraints) {
      _.each(foreignKeyConstraints, function(v, k) {
        // v  e.g.=  'sequences.uid'
        dependencies.push(v.split('.')[0]);
      });
      acc[key] = dependencies;
    }
    return acc;
  }, {});
  var statements = '';
  while (finishedTables.length !== _.keys(schema).length) {
    _.each(schema, function(tableDescription, tableName) {
      var unmetDependencies = _.some(
        tableDependencies[tableName], function(dependencyName) {
          return finishedTables.indexOf(dependencyName) === -1;
        }
      );
      if (finishedTables.indexOf(tableName) !== -1 || unmetDependencies) {
        return;
      }
      var createStatement = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
      var statementBodyList = [];
      _.each(tableDescription.columns, function(type, name) {
        statementBodyList.push(`  ${name} ${type}${tableDescription.id === name ? ' PRIMARY KEY' : ''}`);
      });

      _.each(_.get(tableDescription, 'constraints.UNIQUE'), function(uniqueList) {
        statementBodyList.push(`  UNIQUE (${uniqueList.join(', ')})`);
      });

      _.each(_.get(tableDescription, 'constraints.FOREIGN_KEY'), function(selfColumn, otherColumn) {
        statementBodyList.push(`  FOREIGN KEY(${selfColumn}) REFERENCES ${otherColumn.split('.')[0]}(${otherColumn.split('.')[1]})`);
      });
      createStatement += `${statementBodyList.join(',\n')}\n);\n\n`;
      statements += createStatement;
      _.each(tableDescription.initialValues, function(val, indx) {
        var values = _.map(_.values(val), (v) => {
          if (_.isUndefined(v) || _.isNull(v)) {
            return 'null';
          } else if (_.isString(v)) {
            return '"' + v + '"';
          } else {
            return v;
          }
        });
        statements += `INSERT OR ABORT INTO ${tableName} (${_.keys(val).join(', ')}) VALUES (${values.join(', ')});\n${indx === tableDescription.initialValues.length - 1 ? '\n' : ''}`;
      });
      finishedTables.push(tableName);
    });
  }
  return statements;
}

console.log(buildSqliteSchema(schemaFactory()));

module.exports = {
  schemaFactory: schemaFactory,
  buildSqliteSchema: buildSqliteSchema
};
