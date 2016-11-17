const _ = require('lodash');
const timeParser = require('../utils/timeParser.js');
const sequenceItemExecutors = require('./sequenceItemExecutors');

function createScheduler(dmi, hardwareManager, controllers, config, logger) {

  const RELOAD_SCHEDULE_INTERVAL = (config.RELOAD_SCHEDULE_SECONDS || 10) * 1000;
  const reloadSchedule = _.partial(dmi.completePeripheral.list, runUpdatedSchedule);

  let currentPeripherals = [];
  let updateScheduleInterval;
  let stopped;

  function runUpdatedSchedule(error, completePeripherals) {
    completePeripherals = _.filter(completePeripherals, function(per) {
      return per.peripheral && per.sequence && (_.isArray(per.sequenceItems));
    });
    if (error) {
      logger.log('error', `error getting completePeripherals in scheduler ${error.message || error}`);
      // TODO: Should we stop everything if the schedule can't update?
      return;
    }
    if (stopped) { // scheduler.stop could be called while we're fetching from db
      logger.log('info', 'Got completePeripherals in scheduler but scheduler has been stopped.');
      return;
    }
    const peripheralsToCompare = _.intersectionBy(
      currentPeripherals,
      completePeripherals,
      'peripheral.uid'
    );
    _.each(peripheralsToCompare, function(currentPeripheral) {
      return updatePeripheral(
        currentPeripheral,
        _.find(completePeripherals, ['peripheral.uid', currentPeripheral.peripheral.uid])
      );
    });
    const peripheralsToDelete = _.differenceBy(
      currentPeripherals,
      completePeripherals,
      'peripheral.uid'
    );
    _.each(peripheralsToDelete, stopPeripheral);
    const peripheralsToCreate = _.differenceBy(
      completePeripherals,
      currentPeripherals,
      'peripheral.uid'
    );
    _.each(peripheralsToCreate, startPeripheral);
  }

  function mustReplace(currentPeripheral, newPeripheral) {
    if (currentPeripheral.sequence.sequenceType !== newPeripheral.sequence.sequenceType) {
      return true;
    }
    if (_.differenceWith(currentPeripheral.gpioPins, newPeripheral.gpioPins, _.isEqual).length !== 0) {
      return true;
    }
    if (currentPeripheral.peripheral.peripheralType !== newPeripheral.peripheral.peripheralType) {
      return true;
    }
    if (anyDifferent(currentPeripheral.sequenceItems, newPeripheral.sequenceItems) && !currentPeripheral.executor) {
      return true;
    }
  }

  function anyDifferent(array1, array2) {
    return _.differenceWith(array1, array2, _.isEqual).length !== 0 || _.differenceWith(array2, array1, _.isEqual).length !== 0;
  }

  function updatePeripheral(currentPeripheral, newPeripheral) {
    if (mustReplace(currentPeripheral, newPeripheral)) {
      logger.log('info', `must replace ${currentPeripheral.peripheral.name}. Replacing.`);
      stopPeripheral(currentPeripheral);
      startPeripheral(newPeripheral);
      return;
    }
    let replace = false;
    if (newPeripheral.sequence.defaultState !== currentPeripheral.sequence.defaultState) {
      logger.log('info', `default state of ${currentPeripheral.peripheral.name} has changed. Replacing default state`);
      currentPeripheral.executor.setDefault(newPeripheral.sequence.defaultState);
      replace = true;
    }
    if (anyDifferent(currentPeripheral.sequenceItems, newPeripheral.sequenceItems)) {
      logger.log('info', `sequence items of ${currentPeripheral.peripheral.name} has changed. Replacing sequence items`);
      currentPeripheral.executor.replaceSequence(
        newPeripheral.sequence,
        newPeripheral.sequenceItems
      );
      replace = true;
    };
    if (replace) {
      _.remove(currentPeripherals, ['peripheral.uid', currentPeripheral.peripheral.uid])
      currentPeripherals.push(newPeripheral);
    }
  }

  function stopPeripheral(peripheral) {
    if (peripheral.executor) {
      try {
        peripheral.executor.endSchedule();
      } catch(err) {
        logger.log('error', `Error ending executor schedule ${err.message} stack ${err.stack}`);
      }
    } else {
      logger.log('info', `Peripheral ${peripheral.peripheral.name} has no executor. not trying to call endSchedule`);
    }
    if (peripheral.controller) {
      try {
        peripheral.controller.destroy();
      } catch(err) {
        logger.log('error', `Error destroying controller ${err.message} stack ${err.stack}`);
      }
    } else {
      logger.log('info', `Peripheral ${peripheral.peripheral.name} has no controller. not trying to call destroy`);
    }
    _.remove(currentPeripherals, ['peripheral.uid', peripheral.peripheral.uid])
  }

  function startPeripheral(peripheral) {
    try {
      peripheral = _.cloneDeep(peripheral);
      peripheral.controller = createController(
        hardwareManager,
        _.cloneDeep(peripheral.peripheralTypeDependencies),
        _.cloneDeep(peripheral.peripheral),
        _.cloneDeep(peripheral.gpioPins),
        _.cloneDeep(peripheral.cameras)
      );
      peripheral.executor = scheduledTaskExecutor(
        peripheral.controller,
        _.cloneDeep(peripheral.sequence),
        _.cloneDeep(peripheral.sequenceItems),
        peripheral.peripheral.name
      );
      peripheral.executor.startSchedule();
      currentPeripherals.push(peripheral);
    } catch(err) {
      logger.log('error', `Error creating peripheral ${peripheral.peripheral.name} controller and executor: ${err.message}`);
    }
  }

  function start() {
    stopped = false;
    updateScheduleInterval = setInterval(reloadSchedule, RELOAD_SCHEDULE_INTERVAL);
  }

  function stop() {
    stopped = true;
    clearInterval(updateScheduleInterval);
    _.each(currentPeripherals, stopPeripheral);
  }

  function createController(hardwareManager, peripheralTypeDependencies, peripheral, gpioPins, camera) {
    let dependencies = {};
    _.each(peripheralTypeDependencies, function(dep) {
      if (['GPIO_INPUT', 'GPIO_OUTPUT'].indexOf(dep.ioType) === -1) {
        logger.log('error', `Unsupported ioType ${dep.ioType} in peripheral ${peripheral.name}`);
        throw new Error(`Unsupported ioType ${dep.ioType} in peripheral ${peripheral.name}`);
      }
      let gpio = _.find(gpioPins, ['peripheralTypeDependency', dep.name]);
      if (!(dep.optional || gpio)) {
        logger.log('error', `No gpio assigned for required dependency ${dep.displayName} in peripheral ${peripheral.name}`);
        throw new Error(`No gpio assigned for required dependency ${dep.displayName} in peripheral ${peripheral.name}`);
      }
      if (gpio) {
        dependencies[dep.name] = hardwareManager.get(dep.ioType, gpio)
      }
    });
    logger.log('info', `creating controller for ${peripheral.peripheralType}`);
    return controllers[peripheral.peripheralType].createController(dependencies, peripheral.name, logger);
  }

  /* @param {controller} controller
   * @param {sequence} sequence
   * @param {sequenceItem[]} sequenceItems
   * @return {executor}
   */
  function scheduledTaskExecutor(controller, sequence, sequenceItems, name) {
    if (!sequenceItemExecutors[sequence.sequenceType]) {
      throw new Error(`Cannot create scheduled task executor for sequence type ${sequence.sequenceType}`);
    }
    return sequenceItemExecutors[sequence.sequenceType].executor(controller, sequence, sequenceItems, name, logger);
  }

  return {
    start,
    stop
  };
}

module.exports = createScheduler;
