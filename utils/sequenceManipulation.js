'use strict';
const async = require('async');
const _ = require('lodash');
const uuid = require('uuid');

function sequenceUtilsFactory(dmi) {
  function makeOnOffSequenceAndAssignToPin(name, peripheralType, onDuration, offDuration, pinNumber, defaultState, callback) {
    var peripheral = {
      uid: uuid.v4(),
      name: name,
      peripheralType: peripheralType
    };
    var sequence = {
      uid: uuid.v4(),
      name: name,
      dateCreated: new Date().toString(),
      sequenceType: 'DURATION',
      defaultState: defaultState
    };
    var peripheralRule = {
      uid: uuid.v4(),
      peripheralId: peripheral.uid,
      sequenceId: sequence.uid
    };
    var onSequenceItem = {
      uid: uuid.v4(),
      dateCreated: new Date().toString(),
      sequenceId: sequence.uid,
      durationSeconds: onDuration,
      ordinal: 1,
      startTime: null,
      endTime: null,
      state: 1
    };
    var offSequenceItem = {
      uid: uuid.v4(),
      dateCreated: new Date().toString(),
      sequenceId: sequence.uid,
      durationSeconds: offDuration,
      ordinal: 2,
      startTime: null,
      endTime: null,
      state: 0
    };
    var pin = {
      pinNumber: pinNumber,
      sequenceId: sequence.uid
    };
    var tasks = [
      _.partial(dmi.peripheral.save, peripheral),
      _.partial(dmi.sequence.save, sequence),
      _.partial(dmi.peripheralRule.save, peripheralRule),
      _.partial(dmi.sequenceItem.save, onSequenceItem),
      _.partial(dmi.sequenceItem.save, offSequenceItem),
      _.partial(dmi.gpioPin.update, pin)
    ];
    async.series(tasks, callback);
  }

  function makeTimeSequenceAndAssignToPin(name, peripheralType, onTime, offTime, pinNumber, defaultState, callback) {
    var peripheral = {
      uid: uuid.v4(),
      name: name,
      peripheralType: peripheralType
    };
    var sequence = {
      uid: uuid.v4(),
      name: name,
      dateCreated: new Date().toString(),
      sequenceType: 'TIME',
      defaultState: defaultState
    };
    var peripheralRule = {
      uid: uuid.v4(),
      peripheralId: peripheral.uid,
      sequenceId: sequence.uid
    };
    var onSequenceItem = {
      uid: uuid.v4(),
      dateCreated: new Date().toString(),
      sequenceId: sequence.uid,
      durationSeconds: null,
      ordinal: null,
      startTime: JSON.stringify(onTime),
      endTime: JSON.stringify(offTime),
      state: 1
    };
    var pin = {
      pinNumber: pinNumber,
      sequenceId: sequence.uid
    };
    var tasks = [
      _.partial(dmi.peripheral.save, peripheral),
      _.partial(dmi.sequence.save, sequence),
      _.partial(dmi.peripheralRule.save, peripheralRule),
      _.partial(dmi.sequenceItem.save, onSequenceItem),
      _.partial(dmi.gpioPin.update, pin)
    ];
    async.series(tasks, callback);
  }

  function getSequenceItemsAndPinsAssociatedWithSequence(sequence, callback) {
    const tasks = {
      gpioPins: _.partial(dmi.gpioPin.search, {sequenceId: sequence.uid}),
      sequenceItems: function(callback) {
        dmi.sequenceItem.search({sequenceId: sequence.uid}, function(err, d) {
          if (err) {
            return callback(err);
          } else {
            _.each(d, function(sqi) {
              if (sqi.startTime) {
                try {
                  sqi.startTime = JSON.parse(sqi.startTime);
                  sqi.endTime = JSON.parse(sqi.endTime);
                } catch(error) {
                  callback(error);
                }
              }
            });
            return callback(void(0), d);
          }
        });
      }
    };
    return async.auto(tasks, callback);
  }
  
  function getSequencesWithItemsAndPins(callback) {
    return dmi.sequence.list(function(err, sequenceList) {
      if (err) {
        return callback(err);
      } else {
        const tasks = _.map(sequenceList, function(si) {
          return function(callback) {
            return getSequenceItemsAndPinsAssociatedWithSequence(si, function(e, o) {
              if (e) {
                return callback(e);
              } else {
                return callback(void(0), _.merge({sequence: si}, o));
              }
            });
          };
        });
        return async.parallel(tasks, callback);
      }
    });
  }

  return {
    makeOnOffSequenceAndAssignToPin: makeOnOffSequenceAndAssignToPin,
    makeTimeSequenceAndAssignToPin: makeTimeSequenceAndAssignToPin,
    getSequencesWithItemsAndPins: getSequencesWithItemsAndPins
  };
}

module.exports = sequenceUtilsFactory;
