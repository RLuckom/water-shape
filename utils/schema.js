'use strict';

function schemaFactory(noOpValidate) {
  return  {
    'sequences': {
      id: 'uid',
      columnNames: ['uid', 'dateCreated', 'defaultState', 'name'],
      validateAndSave: noOpValidate, 
      GET: true,
      POST: true,
      PUT: true,
      DELETE: true,
    },
    'gpioPins': {
      id: 'pinNumber',
      columnNames: ['pinNumber', 'sequenceUid'],
      validateAndSave: noOpValidate, 
      GET: true,
      POST: false,
      PUT: true,
      DELETE: false
    },
    'sequenceItems': {
      id: 'uid',
      columnNames: [
        'uid',
        'dateCreated',
        'sequenceUid',
        'sequenceType',
        'durationSeconds',
        'ordinal',
        'startTime',
        'endTime',
        'state'
      ],
      validateAndSave: noOpValidate, 
      GET: true,
      POST: true,
      PUT: true,
      DELETE: true
    },
    'sequenceTypes': {
      id: 'sequenceId',
      columnNames: ['sequenceId', 'sequenceTypeName'],
      validateAndSave: noOpValidate, 
      GET: true,
      POST: false,
      PUT: false,
      DELETE: false
    }
  };
}

module.exports = {
  schemaFactory: schemaFactory
};
