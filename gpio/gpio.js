var gpio = require('pigpio').Gpio;
var moment = require('moment');
const logger = require('../utils/logger')( '/../logs/gpio.log');

var pump = new gpio(14, {mode: gpio.OUTPUT, pullUpDown:gpio.PUD_DOWN});
var lights = new gpio(4, {mode: gpio.OUTPUT, pullUpDown:gpio.PUD_DOWN});

var on = 0;

setInterval(function() {
  try {
    on = on === 3 ? 0 : on + 1;
    logger.log('info', 'pump is ' + (on === 0 ? 1 : 0));
    pump.digitalWrite(on === 0 ? 1 : 0);
    var start = moment({hour: 5, minute: 30});
    var end = moment({hour: 20, minute: 30});
    if (moment().isBetween(start, end)) {
      logger.log('info', 'lights on');
      lights.digitalWrite(1);
    } else {
      logger.log('info', 'lights off');
      lights.digitalWrite(0);
    }
  } catch(err) {
    logger.log('error', err.message);
    logger.log('error', err.stack);
  }
}, 60000); 
