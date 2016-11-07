const gpioLib = require('pigpio');
const cameraLib = require('raspicam');

function createOutputGpio(gpioDef) {
  return new gpioLib.Gpio(gpioDef.pinNumber, {mode: gpioLib.OUTPUT});
}

function createInputGpio(gpioDef) {
  return new gpioLib.Gpio(gpioDef.pinNumber, {mode: gpioLib.INPUT});
}

function createCamera(cameraDef) {
  return cameraLib;
}

const hardwareTypeMaps = {
  GPIO_INPUT: createInputGpio,
  GPIO_OUTPUT: createOutputGpio,
  CAMERA: createCamera
};

function get(ioType, ioDef) {
  if (!hardwareTypeMaps[ioType]) {
    throw new Error(`No hardware type corresponding to ${ioType}`);
  }
  return hardwareTypeMaps[ioType](ioDef);
}

module.exports = {get};
