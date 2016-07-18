#!/bin/bash
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080
sudo iptables -t nat -I OUTPUT -p tcp -d 127.0.0.1 --dport 80 -j REDIRECT --to-ports 8080
nohup /home/pi/.nvm/versions/node/v6.3.0/bin/node /home/pi/workspace/server/app.js& echo $! > /home/pi/workspace/server/app.pid
