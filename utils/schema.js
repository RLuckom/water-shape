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
  return {
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
}

module.exports = {
  schemaFactory: schemaFactory,
};
