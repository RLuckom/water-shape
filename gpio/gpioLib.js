'use strict';
var moment = require('moment');
var _ = require('lodash');

function gpioLibFactory(logger, gpio, getDeepSequences) {

  var pump = new gpio(14, {mode: gpio.OUTPUT, pullUpDown:gpio.PUD_DOWN});
  var lights = new gpio(4, {mode: gpio.OUTPUT, pullUpDown:gpio.PUD_DOWN});

  var on = 0;
  var savedInterval;
  var sequencesInProgress = {};

  function startDurationPinSequence(deepSequence) {
    const pin = deepSequence.gpioPins[0].pinNumber;
    const sequenceItems = deepSequence.sequenceItems;
    var sequenceInProgress = {};
    sequenceInProgress.pinNumber = pin;
    sequenceInProgress.itemInProgress = 0;
    sequenceInProgress.items = _.cloneDeep(sequenceItems);
    sequenceInProgress.pin = new gpio(pin, {mode: gpio.OUTPUT, pullUpDown: gpio.PUD_DOWN});
    sequenceInProgress.pin.digitalWrite(sequenceItems[0].state);
    sequenceInProgress.timeout = setTimeout(function() {
      nextSequenceItem(sequenceInProgress);
    }, sequenceItems[0].durationSeconds * 1000);
    sequenceInProgress.deepSequence = deepSequence;
    sequencesInProgress[sequenceInProgress.pinNumber] = sequenceInProgress;
  }

  function cancelSequence(oldSequence) {
    if (oldSequence.sequence.sequenceType === 'DURATION') {
      clearTimeout(sequencesInProgress[oldSequence.gpioPins[0].pinNumber].timeout);
      sequencesInProgress[oldSequence.gpioPins[0].pinNumber].pin.digitalWrite(0);
      delete sequencesInProgress[oldSequence.gpioPins[0].pinNumber];
    }
  }

  function updateSequence(oldSequence, newSequence) {
    if (oldSequence.sequence.sequenceType === 'DURATION') {
      cancelSequence(oldSequence);
      startDurationPinSequence(newSequence);
    }
  }

  function compareDeepSequences(oldList, newList) {
    _.each(oldList, function(oldDeepSequence) {
      var oldSequence = oldDeepSequence.sequence;
      var newSequence = _.find(newList, ['sequence.uid', oldSequence.uid]);
      if (!newSequence) {
        return cancelSequence(oldDeepSequence);
      } else if (!_.isEqual(oldDeepSequence, newSequence)) {
        return updateSequence(oldDeepSequence, newSequence);
      }
    });
    _.each(newList, function(newDeepSequence) {
      var newSequence = newDeepSequence.sequence;
      var oldSequence = _.find(oldList, ['sequence.uid', newSequence.uid]);
      if (!oldSequence) {
        return startDurationPinSequence(newDeepSequence);
      }
    });
  }

  function nextSequenceItem(sequenceInProgress) {
    sequenceInProgress.itemInProgress = sequenceInProgress.itemInProgress < sequenceInProgress.items.length - 1 ? sequenceInProgress.itemInProgress + 1 : 0;
    sequenceInProgress.pin.digitalWrite(sequenceInProgress.items[sequenceInProgress.itemInProgress].state);
    sequenceInProgress.timeout = setTimeout(function() {
      nextSequenceItem(sequenceInProgress);
    }, sequenceInProgress.items[sequenceInProgress.itemInProgress].durationSeconds * 1000);
  }

  function startSequences(deepSequences, callback) {
    _.each(deepSequences, function(sq) {
      if (sq.sequence.sequenceType === 'DURATION') {
        startDurationPinSequence(sq);
      }
    });
    if (_.isFunction(callback)) {
      callback();
    }
  }

  function start(callback) {
    function startInterval(sequences) {
      savedInterval = setInterval(function(callback) {
        var oldDeepSequences = _.map(sequencesInProgress, 'deepSequence');
        getDeepSequences(function(sequences) {
          compareDeepSequences(oldDeepSequences, sequences);
          if (_.isFunction(callback)) {
            return callback();
          }
        });
      }, 3000);
      startSequences(sequences, callback);
    }
    return getDeepSequences(startInterval);
  }

  function stop() {
    clearInterval(savedInterval);
    _.each(sequencesInProgress, function(v, k) {
      clearTimeout(v.timeout);
    });
  }

  return {
    start: start,
    stop: stop
  };
}

module.exports = gpioLibFactory;
