const timeSequenceExecutor = require('./executors/timeSequenceExecutor');
const durationSequenceExecutor = require('./executors/durationSequenceExecutor');
/*
* The scheduled task executor is an interface for starting and stopping 
* running schedules, and interrupting running schedules to force a peripheral
* on or off.
*
* executor.startSchedule {Function} : start the schedule. Note that if the schedule
*     is a duration sequence with an alignment, the initial state may not be the first
*     state in the sequence, and may not last as long as the sequence specifies, because
*     the start time may be in the middle of one of the sequence items depending on the
*     alignment.
* executor.endSchedule {Function} : Turn the peripheral to its default state and end 
*     the schedule.
* executor.replaceSequenceItems {Function} : replace the running sequence items with
*     new ones.
* executor.interrupt {Function (interrupt)} : see interruptible.
* executor.endInterrupt {Function (interrupt || interrupt.id)} : see interruptible.
* executor.activeInterrupts {Function} : return an array including all active interrupts
* executor.activeState {Function} : return the current state of the peripheral
*/

module.exports = {
  TIME: timeSequenceExecutor,
  DURATION: durationSequenceExecutor
};
