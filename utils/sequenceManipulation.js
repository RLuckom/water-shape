'use strict';
const async = require('async');
const _ = require('lodash');
const uuid = require('uuid');
const timeParser = require('../utils/timeParser.js');

function sequenceUtilsFactory(dmi) {

  function assignPin(pinNumber, availablePins, dependency, peripheral, callback) {
    var pin = _.find(availablePins, ['pinNumber', parseInt(pinNumber)]);
    if (!pin && !_.isNull(pinNumber)) {
      return callback(`Pin number ${pinNumber} is in use or oes not exist`);
    }
    if (_.isNull(pinNumber)) {
      return callback();
    }
    pin.peripheralTypeDependency = dependency.name;
    pin.peripheralId = peripheral.uid;
    pin.ioType = dependency.ioType;
    return dmi.gpioPin.update(pin, callback);
  }

  function releasePin(pin, callback) {
    if (!pin) {
      return callback();
    }
    pin.peripheralTypeDependency = null;
    pin.peripheralId = null;
    pin.ioType = null;
    return dmi.gpioPin.update(pin, callback);
  }

  function deletePeripheralAndFreeResources(peripheral, callback) {
    dmi.completePeripheral.getById(peripheral.uid, function(err, res) {
      if (err) {
        return callback(err);
      }
      function deletePeripheralRule(callback) {
        if (!res.peripheralRule) {
          return callback();
        }
        return dmi.peripheralRule.delete(res.peripheralRule, callback);
      }
      function deletePeripheralOverrideRules(callback) {
        async.parallel(
          _.map(
            _.concat(res.peripheralOverrideRules, res.overrides),
            function(or) {return _.partial(dmi.peripheralOverrideRule.delete, or);}
          ), callback
        );
      }
      function deleteSequenceItems(callback) {
        async.parallel(
          _.map(
            res.sequenceItems,
            function(sq) {return _.partial(dmi.sequenceItem.delete, sq);}
          ), callback
        );
      }
      function deleteSequence(callback) {
        if (!res.sequence) {
          return callback();
        }
        return dmi.sequence.delete(res.sequence, callback);
      }
      function freeGpios(callback) {
        async.parallel(_.map(res.gpioPins, function(pin) {
          return _.partial(releasePin, pin);
        }), callback);
      }
      function freeCameras(callback) {
        async.parallel(_.map(res.cameras, function(cam) {
          return _.partial(dmi.camera.delete, cam);
        }), callback);
      }
      return async.series([
        deletePeripheralRule,
        deletePeripheralOverrideRules,
        freeGpios,
        freeCameras,
        deleteSequenceItems,
        deleteSequence
      ], function(err, res) {
        if (err) {
          callback(err);
        } else {
          return dmi.peripheral.delete(peripheral, callback);
        }
      });
    });
  }
  function makeOnOffSequenceAndAssignToPin(name, peripheralType, onDuration, offDuration, pinNumber, defaultState, callback) {
    var peripheral = {
      uid: uuid.v4(),
      name: name,
      peripheralType: peripheralType
    };
    var sequence = {
      uid: uuid.v4(),
      name: name,
      alignment: '12:00AM',
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
      alignment: '12:00AM',
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
      startTime: onTime,
      endTime: offTime,
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
                  sqi.startTime = timeParser.parseTime(sqi.startTime);
                  sqi.endTime = timeParser.parseTime(sqi.endTime);
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
    deletePeripheralAndFreeResources: deletePeripheralAndFreeResources,
    assignPin: assignPin,
    releasePin: releasePin,
    getSequencesWithItemsAndPins: getSequencesWithItemsAndPins
  };
}

module.exports = sequenceUtilsFactory;
