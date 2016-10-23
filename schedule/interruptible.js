const _ = require('lodash');
/*
* interruptible.interrupt {Function (interrupt)} : force the peripheral to interrupt.state until
*     the interrupt is ended by calling endInterrupt with interrupt or interrupt.uid.
*     If interrupt.priority is specified, it is used to choose between competing interrupts.
*     If interrupt.priority is not specified, it is assumed to be lower than any specified priority.
*     If two interrupts have equal priority the last one wins.
*     Interrupts that 'lose' to higher priority or later interrupts are not deleted; if the winning
*     interrupt is ended before the losing interrupt, control will revert to the losing interrupt.
* interruptible.endInterrupt {Function (interrupt || interruptId)} : delete the interrupt and set state
*     as if the interrupt had never happened, assuming the schedule had proceeded as normal
*     for the duration interrupted.
* interruptible.activeInterrupts {Function} : return an array including all active interrupts
* interruptible.activeState {Function} : return the current state of the peripheral
*/
function interruptible(controller, defaultState=0) {
  const interrupts = [];
  let activeInterruptUid;
  let activeState;

  function onChange() {
    let maxPriority;
    let currentMaxInterrupt = {uid: null, state: defaultState};
    for (let n = 0; n < interrupts.length; n++) {
      if (!maxPriority || interrupts[n].priority >= maxPriority) {
        currentMaxInterrupt = interrupts[n];
        maxPriority = interrupts[n].priority;
      }
    }
    if (currentMaxInterrupt.uid !== activeInterruptUid || (currentMaxInterrupt.uid === null && activeState !== defaultState)) {
      controller.setState(currentMaxInterrupt.state);
      activeInterruptUid = currentMaxInterrupt.uid;
      activeState = currentMaxInterrupt.state;
    }
  }

  function interrupt(interrupt) {
    if (!interrupt) {
      throw new Error('interrupt must not be falsy');
    }
    if (!interrupt.uid) {
      throw new Error('interrupt.uid must not be falsy');
    }
    interrupts.push(interrupt);
    onChange();
  }

  function endInterrupt(interrupt) {
    _.remove(interrupts, ['uid', interrupt.uid || interrupt]);
    onChange();
  }

  function setDefault(state) {
    if (!_.isUndefined(state)) {
      defaultState = state;
      onChange();
    }
    return defaultState;
  }

  onChange();

  return {
    interrupt,
    endInterrupt,
    activeInterrupts: _.partial(_.cloneDeep, interrupts),
    defaultState: setDefault,
    activeState: function() {return _.cloneDeep(activeState);}
  };
}

module.exports = {
  interruptible
};
