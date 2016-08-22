'use strict';
const async = require('async');
const _ = require('lodash');
const uuid = require('uuid');

function peripheralsFactory(dmi) {

  function getDeepPeripheral(peripheral, callback) {
    const tasks = {
      gpioPins: _.partial(dmi.gpioPin.search, {peripheralId: peripheral.uid}),
      cameras: _.partial(dmi.camera.search, {peripheralId: peripheral.uid}),
      peripheralType: _.partial(dmi.peripheralType.getById, peripheral.peripheralType),
      sequence: ['peripheralRule', function(results, callback) {
        return dmi.sequence.getById(results.peripheralRule.sequenceId, callback);
      }],
      peripheralRule: function(callback) {
        return dmi.peripheralRule.search({peripheralId: peripheral.uid}, function(err, peripheralArray) {
          if (err) {
            callback(err);
          } else if (peripheralArray.length) {
            callback(void(0), peripheralArray[0]);
          }
        });
      },
      peripheralTypeDependencies: _.partial(dmi.peripheralTypeDependency.search, {peripheralType: peripheral.peripheralType}),
      sequenceItems: ['sequence', function(results, callback) {
        dmi.sequenceItem.search({sequenceId: results.sequence.uid}, function(err, d) {
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
      }]
    };
    return async.auto(tasks, callback);
  }
  
  function getDeepPeripherals(callback) {
    return dmi.peripheral.list(function(err, peripheralList) {
      if (err) {
        return callback(err);
      } else {
        const tasks = _.map(peripheralList, function(peripheral) {
          return function(callback) {
            return getDeepPeripheral(peripheral, function(e, o) {
              if (e) {
                return callback(e);
              } else {
                return callback(void(0), _.merge({sequence: peripheral}, o));
              }
            });
          };
        });
        return async.parallel(tasks, callback);
      }
    });
  }

  return {
    getDeepPeripherals: getDeepPeripherals
  };
}

module.exports = peripheralsFactory;
