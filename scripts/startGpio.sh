#!/bin/bash
nohup /home/pi/.nvm/versions/node/v6.3.0/bin/node /home/pi/workspace/server/gpio/gpio.js& echo $! > /home/pi/workspace/server/pids/gpio.pid
