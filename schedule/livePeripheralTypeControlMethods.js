'use strict';
const _ = require('lodash');
const gpioLib = require('pigpio');
const cameraLib = require('raspicam');

function createControlMethods(logger) {
  const RELAY = {
    createController: function(gpioPins) {
      if (gpioPins.length !== 1 || gpioPins[0].ioType !== 'GPIO_OUTPUT') {
        throw new Error(`createController for RELAY needed 1 pin in GPIO_OUTPUT, got ${JSON.stringify(gpioPins)}`);
      }
      const gpio = new gpioLib.Gpio(gpioPins[0].pinNumber, {mode: gpioLib.OUTPUT});
      return {
        turnOn: function() {
          logger.log('debug', `turning on pin ${gpioPins[0].pinNumber}`);
          gpio.digitalWrite(1);
        },
        turnOff: function() {
          logger.log('debug', `turning off pin ${gpioPins[0].pinNumber}`);
          gpio.digitalWrite(0);
        }
      };
    }
  };
  const CAMERA = {
    createController: function() {
      return {
				trigger: function(callback, timeoutMS) {
					var camera = new cameraLib({
						mode: 'photo',
						output: Date.now() + '.jpg',
						encoding: 'jpg',
					});

          var error;
          var exited;

					camera.on('start', function( err, timestamp ){
						logger.log('debug', `photo started at ${timestamp} with err ${err}`);
          });

					camera.on('stop', function( err, timestamp ){
						logger.log('debug', `camera stopped at ${timestamp} with err ${err}, error ${error}`);
            if (exited) {
              callback(error);
            }
					});

					camera.on('read', function( err, timestamp, filename ){
						logger.log('debug', `photo captured at ${timestamp} with err ${err} in fn ${filename}`);
					});

					camera.on('exit', function( timestamp ){
						logger.log('debug', 'photo child process has exited at ' + timestamp );
            exited = true;
            clearTimeout(stopTimeout);
            camera.stop();
          });

          const stopTimeout = setTimeout(function() {
            error = new Error('camera stopped by timeout');
            camera.stop();
          }, timeoutMS);

					camera.start();
        }
      };
    }
  };
  return {
    CAMERA: CAMERA,
    RELAY: RELAY
  };
}

module.exports = createControlMethods;
