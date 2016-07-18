nat rules needed:

        iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080
        iptables -t nat -I OUTPUT -p tcp -d 127.0.0.1 --dport 80 -j REDIRECT --to-ports 8080

sample monit config line

        check process nodeserver with pidfile /home/pi/workspace/server/app.pid
          start program = "/home/pi/workspace/server/start.sh"
            as uid pi and gid pi
          if does not exist then start
