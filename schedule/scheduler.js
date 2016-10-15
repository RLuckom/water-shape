const _ = require('lodash');

function createScheduler(dmi, hardwareManager, controllers, config, logger) {

  const RELOAD_SCHEDULE_INTERVAL = (config.RELOAD_SCHEDULE_SECONDS || 10) * 1000;
  const TICK_LENGTH = (config.TICK_LENGTH || 1) * 1000;
  const reloadSchedule = _.partial(dmi.completePeripherals.list, runUpdatedSchedule);

  let currentPeripherals;
  let newPeripherals;
  let state;
  let updateScheduleInterval;
  let mainLoopTimeout;
  let newScheduleIsAvailable;

  function runUpdatedSchedule(error, completePeripherals) {
    if (error) {
      logger.log('error', error);
      // TODO: Should we stop everything if the schedule can't update?
      return;
    }
    if (!currentSchedule) {
      currentPeripherals = completePeripherals;
      mainLoopTimeout = setTimeout(mainLoop, TICK_LENGTH);
      return;
    } else {
      newPeripherals = completePeripherals;
      newScheduleIsAvailable = true;
      return;
    }
  }

  function createScheduleFromPeripherals(completePeripherals) {
    const schedule = _.keyBy(completePeripherals, 'peripheral.uid');
  }

  function newState() {
    var now = new Date();
    state = {
      startTime: now.getTime();
      time: now.getTime(),
      hour: now.getHour(),
      minute: now.getMinute(),
      second: now.getSecond(),
      elapsed: 0,
    }
  }

  function start() {
    // Maybe write start conditions to a DB?
    // If we're supposed to wait an hour, then do something for one
    // second. If we break after 45, 55 minutes of waiting, we should not
    // reset to 0 again. But if the scheduler starts running at 5:00AM,
    // and at 8:55 a user adds the peripheral described above, and then we
    // break at 8:56, then if we're going by a 5:00AM start time, the
    // peripheral will come on at 9:00, 5 minutes after it was added.
    // So maybe write start conditions for each peripheral to db? But if so,
    // does every peripheral maintain its own state?
    updateScheduleInterval = setInterval(reloadSchedule, RELOAD_SCHEDULE_INTERVAL);
  }

  function updateState(state, date) {
    var now = date || new Date();
    state.time = now.getTime();
    state.elapsed = state.time - state.startTime;
    state.hour = now.getHour();
    state.minute = now.getMinute();
    state.second = now.getSecond();
    return state;
  }

  function peripheralToScheduleFunction(completePeripheral, scheduler) {
    let state = newState();
    let dependencies = {}
    _.each(completePeripheral.peripheralTypeDependencies, function(dep) {
      if (['GPIO_INPUT', 'GPIO_OUTPUT'].indexOf(dep.ioType) === -1) {
        throw new Error(`Unsupported ioType ${dep.ioType} in peripheral ${completePeripheral.peripheral.name}`);
      }
      let gpio = _.find(completePeripheral.gpioPins, ['peripheralTypeDependency', dep.uid]);
      if (!(dep.optional || gpio)) {
        throw new Error(`No gpio assigned for required dependency ${dep.displayName} in peripheral ${completePeripheral.peripheral.name}`);
      }
      dependencies[dep.name] = hardwareManager.get(dep.ioType, gpio)
    });
    let controller = controllers[completePeripheral.peripheral.peripheralType].createController(dependencies);
    if (completePeripheral.sequence.sequenceType === 'DURATION') {
      let peripheralTimeout;
      let sequenceItems = _.orderBy(completePeripheral.sequenceItems, 'ordinal');
      let currentSequenceItemIndex = 0;
      function executeSequenceItem() {
        let currentSequenceItem = sequenceItems[currentSequenceItemIndex];
        controller.setState(currentSequenceItem.state);
        currentSequenceItemIndex++;
        peripheralTimeout = setTimeout(executeSequenceItem, currentSequenceItem.durationSeconds * 1000);
      }
      peripheralTimeout = setTimeout(executeSequenceItem, 0);
      return {stop: function() {clearTimeout(peripheralTimeout);}};
    } else if (completePeripheral.sequence.sequenceType === 'TIME') {
      function updateSequenceState(date) {
        updateState(state, date);
        _.each(completePeripheral.sequenceItems, function(item) {
          if (timeParser.isWithin(sequenceItem, date)) {
            controller.setState(sequenceItem.state)
          }
        });
      }
      scheduler.onTick(updateSequenceState);
    }
  }

  function mainLoop() {
    updateState();
    if (newScheduleIsAvailable) {
      if (!_.equals(currentPeripherals, newPeripherals)) {
        // reconcile schedules
      }
    }
    // turn things on and off
    mainLoopTimeout = setTimeout(
      mainLoop,
      // Tick length - control loop time
      TICK_LENGTH - (new Date.getTime() - state.time)
    ); 
  }
}
