#!/bin/bash
nohup /home/pi/.nvm/versions/node/v6.3.0/bin/node /home/pi/workspace/server/camera/camera.js &>>/home/pi/workspace/camera.log& echo $! > /home/pi/workspace/server/pids/camera.pid
