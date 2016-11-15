const _ = require('lodash');
const uuid = require('uuid');
const interruptible = require('../interruptible');
const timeParser = require('../../utils/timeParser');

function filterSequenceItems(sequenceItems) {
  const filteredSequenceItems = _.filter(sequenceItems, function(si) {
    return (
      _.isNumber(si.durationSeconds)
      && _.isNumber(si.ordinal)
      && !_.isUndefined(si.state)
    );
  });
  const mostRepeatedOrdinal = _.max(_.values(_.countBy(filteredSequenceItems, 'ordinal')));
  if (mostRepeatedOrdinal > 1) {
    throw new Error('Cannot start a duration sequence with repeated ordinals');
  }
  return _.orderBy(filteredSequenceItems, 'ordinal');
}

function durationSequenceExecutor(controller, sequence, sequenceItems) {
  const sequenceInterruptible = interruptible.interruptible(controller, sequence.defaultState);
  sequenceItems = filterSequenceItems(sequenceItems);
  let peripheralTimeout;
  let currentInterrupt;
  let currentSequenceItemIndex = 0;
  let alignmentTime = sequence.alignment ? timeParser.toSeconds(sequence.alignment) : timeParser.toSeconds(new Date()); 
  function executeSequenceItem() {
    if (_.get(sequenceItems, 'length') < 1) {
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
    clearTimeout(peripheralTimeout);
    if (currentInterrupt) {
      sequenceInterruptible.endInterrupt(currentInterrupt);
    }
    currentSequenceItemIndex = 0;
  }
  function replaceSequence(newSequence, newSequenceItems) {
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
