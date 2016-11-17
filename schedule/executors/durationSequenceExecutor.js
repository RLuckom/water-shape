const _ = require('lodash');
const uuid = require('uuid');
const interruptible = require('../interruptible');
const timeParser = require('../../utils/timeParser');

function filterSequenceItems(sequenceItems, logger, name) {
  const filteredSequenceItems = _.filter(sequenceItems, function(si) {
    return (
      _.isNumber(si.durationSeconds)
      && _.isNumber(si.ordinal)
      && !_.isUndefined(si.state)
    );
  });
  const mostRepeatedOrdinal = _.max(_.values(_.countBy(filteredSequenceItems, 'ordinal')));
  if (mostRepeatedOrdinal > 1) {
    logger.log('error', `Cannot start a duration sequence  for peripheral ${name} with repeated ordinals`);
    throw new Error('Cannot start a duration sequence with repeated ordinals');
  }
  return _.orderBy(filteredSequenceItems, 'ordinal');
}

function durationSequenceExecutor(controller, sequence, sequenceItems, name, logger) {
  const sequenceInterruptible = interruptible.interruptible(controller, sequence.defaultState, name, logger);
  sequenceItems = filterSequenceItems(sequenceItems, logger, name);
  let peripheralTimeout;
  let currentInterrupt;
  let currentSequenceItemIndex = 0;
  let alignmentTime = sequence.alignment ? timeParser.toSeconds(sequence.alignment) : timeParser.toSeconds(new Date()); 
  function executeSequenceItem() {
    if (_.get(sequenceItems, 'length') < 1) {
      logger.log('error', `Peripheral ${name} has no sequenceItems so can't execute sequenceItem.`);
      return;
    }
    const currentSequenceItem = sequenceItems[currentSequenceItemIndex];
    let t = currentSequenceItem.durationSeconds;
    const previousInterrupt = currentInterrupt;
    currentInterrupt = {uid: uuid.v4(), state: currentSequenceItem.state};
    sequenceInterruptible.interrupt(currentInterrupt);
    if (previousInterrupt) {
      sequenceInterruptible.endInterrupt(previousInterrupt);
    }
    peripheralTimeout = setTimeout(executeSequenceItem, currentSequenceItem.durationSeconds * 1000);
    currentSequenceItemIndex = (currentSequenceItemIndex + 1) % sequenceItems.length;
  }
  function endSchedule() {
    logger.log('info', `ending schedule for peripheral ${name}`);
    clearTimeout(peripheralTimeout);
    if (currentInterrupt) {
      sequenceInterruptible.endInterrupt(currentInterrupt);
    }
    currentSequenceItemIndex = 0;
  }
  function replaceSequence(newSequence, newSequenceItems) {
    logger.log('info', `replacing sequence items for peripheral ${name}`);
    sequenceItems = filterSequenceItems(newSequenceItems);
    alignmentTime = newSequence.alignment ? timeParser.toSeconds(newSequence.alignment) : alignmentTime;
    sequenceInterruptible.defaultState(newSequence.defaultState);
    endSchedule();
    executeSequenceItem();
  }
  sequenceInterruptible.startSchedule = executeSequenceItem;
  sequenceInterruptible.endSchedule = endSchedule;
  sequenceInterruptible.replaceSequence = replaceSequence;
  return sequenceInterruptible;
}

module.exports = {
  executor: durationSequenceExecutor,
  filterSequenceItems: filterSequenceItems
};
