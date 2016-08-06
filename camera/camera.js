var RaspiCam = require("raspicam");
var path = require('path');
const logger = require('../utils/logger')('/../logs/camera.log');

function takePicture(fn) {
  var camera = new RaspiCam({
    mode: "photo",
    output: fn,
    encoding: "jpg",
  });

  camera.on("start", function( err, timestamp ){
    logger.info(`photo started at ${timestamp} with err ${err}`);
  });

  camera.on("read", function( err, timestamp, filename ){
    logger.info(`photo captured at ${timestamp} with err ${err} in fn ${filename}`);
  });

  camera.on("exit", function( timestamp ){
    logger.info("photo child process has exited at " + timestamp );
    camera.stop();
  });

  camera.start();
}

setInterval(function() {
  var fn = path.join(__dirname, `/../../aeroponicsPictures/${Date.now()}-aeroponics.jpg`);
  takePicture(fn)
}, 60000 * 5);
