'use strict';
var moment = require('moment');
var _ = require('lodash');

function gpioLibFactory(logger, gpio, getDeepSequences, setTimeoutFunction) {
  var setTimeout = setTimeoutFunction || setTimeout;

  var pump = new gpio(14, {mode: gpio.OUTPUT, pullUpDown:gpio.PUD_DOWN});
  var lights = new gpio(4, {mode: gpio.OUTPUT, pullUpDown:gpio.PUD_DOWN});

  var on = 0;
  var savedInterval;
  var sequencesInProgress = {};

  function startPinSequence(pin, sequenceItems) {
    var sequenceInProgress = {};
    sequenceInProgress.pinNumber = pin;
    sequenceInProgress.itemInProgress = 0;
    sequenceInProgress.items = _.cloneDeep(sequenceItems);
    sequenceInProgress.pin = new gpio(pin, {mode: gpio.OUTPUT, pullUpDown: gpio.PUD_DOWN});
    sequenceInProgress.pin.digitalWrite(sequenceItems[0].state);
    logger.log('starting timeout');
    sequenceInProgress.timeout = setTimeout(function() {
      nextSequenceItem(sequenceInProgress);
    }, sequenceItems[0].durationInSeconds * 1000);
    sequencesInProgress[sequenceInProgress.pinNumber] = sequenceInProgress;
  }

  function nextSequenceItem(sequenceInProgress) {
    sequenceInProgress.itemInProgress = sequenceInProgress.itemInProgress < sequenceInProgress.items.length + 1 ? sequenceInProgress.itemInProgress + 1 : 0;
    sequenceInProgress.pin.digitalWrite(sequenceInProgress.items[sequenceInProgress.itemInProgress].state);
    sequenceInProgress.timeout = setTimeout(function() {
      nextSequenceItem(sequenceInProgress);
    }, sequenceInProgress.items[sequenceInProgress.itemInProgress].durationInSeconds * 1000);
  }

  function startSequences(callback) {
    return function(deepSequences) {
      _.each(deepSequences, function(sq) {
        if (sq.sequence.sequenceType === 'DURATION') {
          logger.log('debug', 'starting sequence '  + sq.sequence.name);
          startPinSequence(sq.gpioPins[0].pinNumber, sq.sequenceItems);
        }
      });
      callback();
    }
  }

  function start(callback) {
    logger.log('debug', 'starting');
    return getDeepSequences(startSequences(callback));
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
