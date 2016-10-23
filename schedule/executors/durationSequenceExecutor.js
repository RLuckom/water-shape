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
  let alignmentTime = sequence.alignment ? timeParser.toSeconds(sequence.alignment) : timeParser.toSeconds(new Date()); 
  function executeSequenceItem() {
    const totalSequenceTime = _.sumBy(sequenceItems, 'durationSeconds');
    const currentTime = timeParser.toSeconds(new Date());
    const elapsed = currentTime < alignmentTime ? currentTime + (86400 - alignmentTime) : currentTime - alignmentTime;
    const position = elapsed % totalSequenceTime;
    let t = 0;
    let currentSequenceItemIndex = 0;
    while (t < position && currentSequenceItemIndex < sequenceItems.length - 1) {
      t += sequenceItems[currentSequenceItemIndex].durationSeconds;
      currentSequenceItemIndex++;
    }
    const secondsRemaining = t - elapsed;
    const currentSequenceItem = sequenceItems[currentSequenceItemIndex];
    const previousInterrupt = currentInterrupt;
    currentInterrupt = {uid: uuid.v4(), state: currentSequenceItem.state};
    sequenceInterruptible.interrupt(currentInterrupt);
    if (previousInterrupt) {
      sequenceInterruptible.endInterrupt(previousInterrupt);
    }
    peripheralTimeout = setTimeout(executeSequenceItem, currentSequenceItem.durationSeconds * 1000);
  }
  function endSchedule() {
    clearTimeout(peripheralTimeout);
    if (currentInterrupt) {
      sequenceInterruptible.endInterrupt(currentInterrupt);
    }
  }
  function replaceSequence(newSequence, newSequenceItems) {
    sequenceItems = filterSequenceItems(newSequenceItems);
    alignmentTime = newSequence.alignment ? timeParser.toSeconds(newSequence.alignment) : alignmentTime;
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
