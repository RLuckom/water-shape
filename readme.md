![Travis CI Status Image](https://travis-ci.org/RLuckom/bucket-brain.svg)

sudo apt-get install pigpio
sudo apt-get install sqlite3
sudo apt-get install monit
npm install sqlite3 --build-from-source
npm rebuild node-sass

# allow access to camera for pi:pi
sudo chmod 666 /dev/vchiq

nat rules needed:

        iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080
        iptables -t nat -I OUTPUT -p tcp -d 127.0.0.1 --dport 80 -j REDIRECT --to-ports 8080

sample monit config line

        check process nodeserver with pidfile /home/pi/workspace/server/app.pid
          start program = "/home/pi/workspace/server/start.sh"
            as uid pi and gid pi
          if does not exist then start


System Description
==================

A web interface and persistence layer for a hydroponics system

The hydroponics system is a 5-gallon bucket with hydroponic nutrient solution filling it partway. There is
a pump in the bucket that sprays the hydroponic solution at the roots of plants growing in holes cut in the
lid of the bucket. There is a light over the bucket to help the plants grow. I used the plans from 
[gardenpool](https://gardenpool.org/online-classes/how-to-make-a-simple-5-gallon-bucket-aeroponics-system).

The control system is a raspberry pi. It is responsible for turning the pump on and off (currently one minute on,
two minutes off) and turning the light on at 5:30AM and off at 8:30PM. 


Requirements
============

I would like to add features to the control system. Specifically:

  1. Remote configuration of lights and pump on / off supportng both cycle-based control (1 on, 2 off) and time-based
     control (5:30AM on, 8:30PM off)
  2. Easy addition of features such as camera monitoring, etc.
  3. Separation of the gpio control process (which pretty much has to run as root) and the interface process
     (which should not run as root, being available at least over an intranet, possibly over the internet).
  4. Easy, configuration-based extension of the server and client code.


Application Data
================

There will be at least 3 execution environments for the code in this interface (browser, gpio control process,
server process) but all of them need to share access to the application's data. This data will include identifying
gpio pins, specifying their duty cycles, and identifying the type of duty cycle. 

Instead of rewriting the data access code for each program that needs it, I'm writing some code to parse a data
structure representing the layout of the database and generate a database schema, a server-side API, and an API
client to be used as the model layer in the browser. This code will enable data access from any enviroment, as well
as data validation on saves and easy extensibility.


Technologies
============

I have chosen sqlite3 because it's lightweight, well-supported, and I'm familiar with it.

I've chosen JavaScript because I like it, and also because it's native to the browser.
