const controlMethodsFactory = require('./schedule/livePeripheralTypeControlMethods.js');

const logger = {
  log: (level, message) => {
    return console.log(`[ ${level} ] ${message}`);
  }
};

const gpioPins = [{pinNumber:14, ioType: 'GPIO_OUTPUT'}];

const controlMethods = controlMethodsFactory(logger);

const relayController = controlMethods.RELAY.createController(gpioPins);

relayController.turnOn();
setTimeout(relayController.turnOff, 5000);

setTimeout(function() {
  const cameraController = controlMethods.CAMERA.createController();
  cameraController.trigger(
    function(err) {
      logger.log('camera', `camera finished with error ${err}`);
    }, 600
  );
}, 10000);

setTimeout(function() {
  const cameraController = controlMethods.CAMERA.createController();
  cameraController.trigger(
    function(err) {
      logger.log('camera', `camera finished with error ${err}`);
    }, 60000
  );
}, 20000);
