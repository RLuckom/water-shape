const interruptible = require('../interruptible');
const uuid = require('uuid');
const timeParser = require('../../utils/timeParser')
const _ = require('lodash');

function filterSequenceItems(sequenceItems, logger, name) {
  const filteredSequenceItems =  _.filter(sequenceItems, function(si) {
    try {
      timeParser.parseTime(si.startTime);
      timeParser.parseTime(si.endTime);
    } catch(err) {
      return false;
    }
    return !_.isUndefined(si.state);
  });
  if (timeParser.anySequenceItemOverlaps(filteredSequenceItems)) {
    logger.log('error', `Cannot start a time sequence for ${name} with overlapping items`);
    throw new Error('Cannot start a time sequence with overlapping items');
  }
  return filteredSequenceItems;
}

function timeSequenceExecutor(controller, sequence, sequenceItems, name, logger) {
  const sequenceInterruptible = interruptible.interruptible(controller, sequence.defaultState, name, logger);
  let peripheralTimeout;
  let currentInterrupt;
  sequenceItems = filterSequenceItems(sequenceItems, logger, name);
  function executeSequenceItem() {
    if (_.get(sequenceItems, 'length') < 1) {
      logger.log('error', `No sequence items associated with ${name}. Not executing item.`);
      return;
    }
    const t = new Date();
    const boundary = timeParser.nearestBoundaryAfter(sequenceItems, t);
    const currentSequenceItem = boundary.sequenceItem;
    let previousInterrupt = currentInterrupt;
    if (currentSequenceItem) {
      currentInterrupt = {uid: uuid.v4(), state: currentSequenceItem.state};
      sequenceInterruptible.interrupt(currentInterrupt);
    } else {
      currentInterrupt = void(0);
    }
    if (previousInterrupt) {
      sequenceInterruptible.endInterrupt(previousInterrupt);
    }
    const secondsRemaining = timeParser.secondsBetween(t, boundary.boundary);
    peripheralTimeout = setTimeout(executeSequenceItem, secondsRemaining * 1000);
  }
  function endSchedule() {
    logger.log('info', `ending schedule for peripheral ${name}`);
    clearTimeout(peripheralTimeout);
    if (currentInterrupt) {
      sequenceInterruptible.endInterrupt(currentInterrupt);
    }
  }
  function replaceSequence(newSequence, newSequenceItems) {
    logger.log('info', `replacing sequence items for peripheral ${name}`);
    sequenceItems = filterSequenceItems(newSequenceItems);
    sequenceInterruptible.defaultState(newSequence.defaultState);
    endSchedule();
    executeSequenceItem();
  }
  sequenceInterruptible.startSchedule = executeSequenceItem;
  sequenceInterruptible.replaceSequence = replaceSequence;
  sequenceInterruptible.endSchedule = endSchedule;
  return sequenceInterruptible;
}

module.exports = {
  executor: timeSequenceExecutor,
  filterSequenceItems
};
