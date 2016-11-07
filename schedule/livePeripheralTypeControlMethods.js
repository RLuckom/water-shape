'use strict';
const _ = require('lodash');

function createControlMethods(logger) {
  const RELAY = {
    createController: function(dependencies) {
      if (dependencies.ground) {
        dependencies.ground.digitalWrite(0);
      }
      return {
        setState: function(state) {
          dependencies.signal.digitalWrite(state);
        },
        destroy: function() {dependencies.signal.digitalWrite(0);}
      };
    }
  };
  const CAMERA = {
    createController: function(dependencies) {
      return {
				trigger: function(callback, timeoutMS) {
          var error;
          var exited;
          var camera = new dependencies.camera({
            mode: 'photo',
            output: Date.now() + '.jpg',
            encoding: 'jpg',
          });

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
