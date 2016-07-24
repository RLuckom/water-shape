var gpio = require('pigpio').Gpio;

var relay = new gpio(14, {mode: gpio.OUTPUT, pullUpDown:gpio.PUD_DOWN});

var on = 0;

setInterval(function() {
        on = on === 0 ? 1 : 0;
        relay.digitalWrite(on);
}, 60000); 
