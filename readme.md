![Travis CI Status Image](https://travis-ci.org/RLuckom/bucket-brain.svg)
System Description
==================

A web interface and persistence layer for a hydroponics system

The hydroponics system is a 5-gallon bucket with hydroponic nutrient solution filling it partway. There is
a pump in the bucket that sprays the hydroponic solution at the roots of plants growing in holes cut in the
lid of the bucket. There is a light over the bucket to help the plants grow. I used the plans from 
[gardenpool](https://gardenpool.org/online-classes/how-to-make-a-simple-5-gallon-bucket-aeroponics-system).

The control system is a raspberry pi. It is responsible for turning the pump on and off (currently one minute on,
three minutes off) and turning the light on at 5:30AM and off at 8:30PM. 


Requirements
============

I would like to add features to the control system. Specifically:

  1. Remote configuration of lights and pump on / off supportng both cycle-based control (1 on, 2 off) and time-based
     control (5:30AM on, 8:30PM off)
  2. Easy addition of features such as camera monitoring, etc.
  3. Configurable data storage, optimally making all writes to a usb stick or other non-SD storage 
     to reduce risk of corrupting the Pi's SD card.
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

currently two data-manipulation frameworks are implemented: the database manipulation library at 
`utils/db.js` and the api client library at `utils/apiClient.js`. Both of these, and any future 
data manipulation libraries, will implement the following core API and may implement environment-specific
API methods as appropriate.

Data Manipulation API
=====================

This core API must be implemented on any data access library so that domain-specific logic can be 
implemented once to run in all execution environments (server, client etc).


`<tableName>.save`: (Object instance, Function (err, data) callback) update or create a record of `instance`.

`<tableName>.update`: (Object instance, Function (err, data) callback) update the record of `instance`.

`<tableName>.delete`: (Object instance, Function (err, data) callback) delete the record of `instance`.

`<tableName>.deleteById`: (String | Number id,, Function (err, data) callback) delete the record identified by `id`.

`<tableName>.list`: (Function (err, data) callback) pass list of records to second param of `callback`.

`<tableName>.getById`: (String|Number id, Function (err, data) callback) pass record identified by `id` to second param of `callback`.

`<tableName>.search`: (Object instance, Function (err, data) callback) pass list of records matching populated fields of `instance` to second param of `callback`

Still deciding on the callback values for `save`, `update` and `delete` methods. The `update` methods *should* throw errors if the instances don't exist, but for now they're probably going to be copies of the `save` methods.

Data manipulation libraries may implement additional methods as appropriate to their execution environment, e.g. the api client library may implement `get`, `post`, `put` etc.

Technologies
============

I have chosen sqlite3 because it's lightweight, well-supported, and I'm familiar with it.

I've chosen JavaScript because I like it, and also because it's native to the browser.

I've chosen React-Webpack-Babel becaise I haven't used them before and want to see what all the
fuss is about. Fairly pleasantly surprised so far.

I've chosen Jasmine for testing because I'm familiar with it, but I'm starting to get annoyed enough
to look for alternatives.

I'm using Hapi.js for the server because it looked cool. It still seems cool, but so far my use
case is pretty basic. No complaints.

For e2e testing, I'm using Phantomjs because it fits neatly into CI automation and so far I haven't
run into a testing scenario where it differs from a headful browser in a way I care about.

For e2e testing I'm also using selenium webdriver's js api because it's entirely separate from the UI
framework it's testing.

There is no build system besides `npm` and node / bash scripts.
Currently supported `npm` commands are:

 * `npm test`: run Jasmine-based 'unit' (in reality they're closer to end-to-end, but excluding the ui) tests in `spec/unit`.
 * `npm run phantomTest`: Run e2e tests using selenium webdriver js, jasmine, and Phantom
 * `npm run compile`: Compile the React UI. 
 * `npm run serve`: Compile the React UI and start Hapi.

Decisions I Expect To Be Controversial And Why I Made Them
==========================================================

This is a project to do a useful, interesting thing that I need done, but it's also an
opportunity for me to try out some ideas and approaches that I don't think I could 
sell to anyone who was paying me. This section is an attempt to explain the reasons 
behind some choices I've made that may seem strange to those with experience in
professional software development, where speed of execution and minimization of risks in
implementation are high priorities. Specifically, I am trying to write an answer, in a
general form, to every question of the style "why didn't you just $X". The following 
paragraphs describe the design philosophy I'm using and my criteria for evaluating
technologies and implementation approaches.

This project is a test of a very simple design philosphy: Every useful thing has a fixed
complexity budget. Every effort should be made to conserve the complexity budget, because
it cannot be replenished. There may be different complexity budgets for different aspects
of a thing; in the case of this project, I as an author have to conserve my maintainer
complexity budget so that the code is easy to understand, fix, and extend. I also have to
conserve the related-but-distinct user complexity budget, so that a non-maintainer user
can use this project to acheive her purpose easily, without getting frustrated. 

The complexity budget of a thing includes its entire lifecycle and the set of its deployment
environments. The complexity budget of this project must include the costs of getting a
raspberry pi and required peripherals, installing `sqlite3`, `nvm`, `node 6.x`, `pigpio`,
`monit`, all the javascript dependencies, populating the database, configuring the networking,
and then validating that everything works properly. Many of these costs can be shifted from
the end-user's complexity budget to the maintainer's complexity budget through scripting and
automation, at the considerable cost of updating them as the lifecycle and deployment environments
change. Likewise, the complexity cost to a maintainer of using a particular opinionated
dependency can be reduced by siloing it behind an API that could reasonably be supported
by a competitor to that dependency, should continuing to use it become impractical.

The concept of a complexity budget provides a counterbalance to the otherwise overpowering
advice to never invent something that is already available in a third-party library. Instead,
for each need, I weigh the cost of developing, debugging, and maintaining a solution myself
against the complexity cost of integrating a third-party library. The easiest libraries to
embrace are those like `lodash` and `async` that are both beautiful in their APIs and extremely
general and unopinionated. Next are libraries like `uuid`, that provide simple functionality
in accordance with a spec or RFC I'd prefer not to have to read myself. Finally, there are
frameworks designed for specific domains, such as React-Webpack-Babel for UI, Request.js for
client-side API communication, and Hapi.js and sqlite3 for the server. These bring the greatest
costs in terms of complexity, and to reduce those costs it is necessary to silo them off
behind simple, consistent interfaces.

The maintainer complexity budget for this project is invested heavily in the description
of the database schema defined in `schema/schema.js`. Any new maintainer will need
to learn to understand the format of that object and the meanings of its parts. If I can
editorialize for a moment, it is a matter of respect for the new maintainer that when I ask
them to do something like 'learn the structure of this schema object,' I should try to
make that knowledge as valuable as possible by making it widely applicable to the design
of the overall application. So from that schema object comes the basic structure of each of
the data manipulation objects, the server's API, and the schema of the database itself. When
a new maintainer learns the schema object and one of the data manipulation objects, that
is enough to write domain logic, as well as generic tests that will run against all
the data manipulation objects to further sharpen their API. When I am adding new functionality,
I aggressively try to tie it back to the concepts and metaphors I have already introduced.
Thus data validation and RBAC, as and when they are needed, will be layered over the existing
schema description so that they can be enforced on the server side but also communicated on
the client side without duplication of effort.

The complexity budget extends to testing as well as implementation. Respecting the complexity
budget during implementation itself makes testing easier, because the components to test
tend to be similar and amenable to generic testing. But it goes deeper than that. Each test
should test a user-visible piece of functionality (though the user in question may be a maintainer).

The best example of this is the API client tests. The classic way to unit test an API client
would be to expect it to make certain http calls, mock the resonses, and expect certain behaviors
on each response. But there is no user who wants that functionality. The user doesn't care about
expected requests or behavior on mocked responses. The user cares about the ability of the API
client to manipulate the the data maintained by the app. So to avoid spending our precious testing
complexity budget on tests of functionality that no one wants, we should test the API client
against a running version of the server, itself backed by a live database. This is well beyond
any sane version of unit testing, but because we've respected the complexity budget in building
the application, it is possible without too much trouble. In fact, the tests for the generic data
manipulation interface as applied to the API client demonstrate that the database connector, 
server, api client, and tests can all be run in the same process (and the test can access the
server, database, filesystem, and API client), giving the test author unlimited flexibility
to test the api client under arbitrary conditions.

Another example of conserving the complexity budget is the lack of a build system like `gulp` or
`grunt`. My experience (which is to say YMMV) of using these tools has been that I do not tend
to learn how they work. Instead, I google for whatever piece of functionality (testing, serving,
incremental building) I need right now and attempt to hack it into the configuration file however
it fits. This usually works fine, but it short-circuits the part of the process during which I
should be thinking carefully about what I actually want from the piece of functionality I'm trying
to add, and instead presents me with a flurry of `npm install -g` commands. The worst case here is
not that something doesn't work--things not working is usually easy to solve. The worst case is
that an application ends up with a build script whose job is to write an `index.html` file for a
compilation script whose job is to compile the client code plus the `index.html` file and some test
code so that a test *runner* script can start a headless browser and point it to the `index.html`,
which includes the test code to be executed to test the client code, while the test *runner* script
polls the visible text on the window of the headless browser to try to ascertain when the test
script has finished and what its results are. That this process is a massive, ridiculous kludge
is instantly obvious to anyone *except* someone who has just googled 'how to run jasmine tests
on phantomjs in ci' and chosen one of the plugins to the popular js build tools without reading
the fine print (spoiler alert, that person has been me, many times). I expect that after
refusing to use a build system for long enough, I'll have a good enough handle on the tools
I like and how they actually work that I'll be able to save time by using a `grunt` or `gulp`
to manage the things I know I want to do. But for now I can't afford them in my complexity
budget.

Hopefully this has explained why I didn't just do $X or just use $Y. If it doesn't explain it,
and you're interested in seeing where this thing goes, consider opening an issue or sending a
pull request. If it doesn't explain it but you can explain why I'm an idiot, consider a
fork instead.

Stuff I've Needed to Do To Get Things Working But Haven't Documented Elsewhere
==============================================================================
 
        sudo apt-get install pigpio
        sudo apt-get install sqlite3
        sudo apt-get install monit
        npm install sqlite3 --build-from-source
        npm rebuild node-sass

        allow access to camera for pi:pi
        sudo chmod 666 /dev/vchiq

        nat rules needed:

        iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080
        iptables -t nat -I OUTPUT -p tcp -d 127.0.0.1 --dport 80 -j REDIRECT --to-ports 8080

        sample monit config line

        check process nodeserver with pidfile /home/pi/workspace/server/app.pid
          start program = "/home/pi/workspace/server/start.sh"
            as uid pi and gid pi
          if does not exist then start

          avconv (ffmpeg probably the same) for making video from *sequentially* named jpegs
          avconv -framerate 25 -i %04d.jpg -c:v libx264 -profile:v high -crf 20 -pix_fmt yuv420p output.mp4

###RPi GPIO layout

                              Edge of Board
                                   ^
                                   |
      
      |5v|5v|Gr|14|15|18|Gr|23|24|Gr|25|08|07|Ep|Gr|12|Gr|16|20|21|
      |3v|02|03|04|Gr|17|27|22|3v|10|09|11|Gr|Ep|05|06|13|19|26|Gr|
      
      Numbered - GPIO outputs
      3v - 3.3 volts
      5v - 5 volts
      Gr - Ground
      Ep - IO EEPROM (don't touch)

