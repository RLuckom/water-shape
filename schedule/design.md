Scheduling System
=================

The scheduling system is responsible for turning peripherals on and off
when appropriate. It is required to handle the following forms of
scheduling requests:

 1. Turn `x` on from 5:30AM to 6:30PM
 2. Turn `x` on for one minute, then off for four minutes, indefinitely
 3. Trigger `x` every 5 minutes. While `x` is running, turn `y` off and `z` on.

It is currently not required to handle scheduling requests in the form:

 1. Trigger `x` when condition `y` occurs.
 2. Turn `x` on for one minute when condition `y` occurs.
 3. Turn `x` on while condition `y` is true.
 4. Turn `x` on when condition `y` occurs and leave it on until condition `z`
    occurs.

although those are expected to be supported eventually.

### Design

#### Interface

Ouside code can communicate to the scheduler via its DMI dependency and via
its exported `start` and `stop` methods.

#### Operation

When `start`ed, the scheduler will run in a control loop style, performing
the following steps:

 1. Query the [DMI](#dmi) for the current [scheduling rules](#scheduling-rules).
 2. Find the current state of the [variables](#variables) required by the rules
 2. Translate the database representation of the current scheduling rules, and the
    current state, into a propositional logic formula in regard to the on / off
    state of the [peripherals](#peripherals).
 3. Solve the propositional logic formula to determine the correct state for all
    of the peripherals.
 4. Set the peripherals to the correct state.

When `stop`ed, the scheduler will turn off all peripherals, wait for them to
finish or for a given time, and then indicate that it has stopped by calling
a callback.

#### Definitions

##### DMI

Data Manipulation Interface. Documented in the `readme`, this is the object
providing access to the data described in `schema/schema.js`. It may be a db
object or an api object or some kind of in-memory data store.

##### Peripherals

Peripherals are sensors or actuators controlled by the system. They are 
created and defined by the user. To create a peripheral, the user will give
it a unique name and assign it a type based on the physical type of sensor
or actuator being controlled, such as "Relay" or "Camera" or "DS18B20". The
user will be prompted to assign physical I/O devices to the peripheral as
required by the selected type.

###### Peripheral Domains

For scheduling purposes, there are at least two distinct domains of peripherals:

  1. Continuously-Actuated peripherals are peripherals like switches that are ON
     for as long as an output is held high, and OFF for as long as it is held low.
     For scheduling purposes, there is no delay between the scheduler telling the
     peripheral to be ON or OFF and the peripheral reaching that state. Most
     Continuously-Actuated peripherals will be actuators.
  2. Triggered peripherals are peripherals like cameras, which are triggered at
     a particular instant, but require a variable amount of time to complete
     their task. For scheduling puroposes, a Triggered peripheral is ON from
     the time it is triggered until it calls a callback to indicate that it is
     finished. To guard against failures in Triggered peripherals, a timeout
     may be set to 'force OFF' a triggered peripheral as far as the scheduler
     is concerned. Most Triggered peripherals will be sensors.

###### Peripheral Type Definitions

Peripheral type definitions will be provided as modules along with this system, and the
user will only be able to select a type for which a module exists. The type
definition will specify the name of the peripheral, its domain, and the number and
identifiers of I/O devices it requires (such as, for a relay, one pin that will be
called the 'on / off' pin).

The type definitions will also include code that, given access to objects representing
the required I/O devices, will return an object with a standard control interface
(to be determined later) for controlling the peripheral. There may be separate interfaces
for the Continuously Actuated and Triggered peripheral domains.

##### Scheduling Rules

Each peripheral will have one scheduling rule object associated to it. This
rule object will contain one main rule governing when the peripheral should
be turned on and off. The main rule may be a repeating sequence, a set of times,
or `always` or `never`. In the case of Triggered peripherals, the `always` rule
will not be available, the repeating sequence rule will be in the form
'trigger after `x` seconds', and the set of times rule will be in the form
'trigger at `x` times on the clock'.

In addition to the main rule, the rule object may have a set of override rules
regarding times when the main rule should be ignored. The override rules for now
will have the form, "when `other peripheral` is `on | off`, I am `on | off`".
These rules may be assigned priority explicitly or randomly to adjudicate 
conflicts. 

Triggered peripherals will not be triggered again if they are ON. For repeating
sequences, the trigger instants will be calculated from the process start time;
e.g. if a camera is set to be triggered every 10 seconds, and it is triggered
at 00:10 after the process starts, and takes 2 seconds to complete, it will
be triggered again at 00:20, NOT 00:22.

##### Variables

To apply the rules correctly, the scheduler must know the state of the variables
they refer to, such as a point in time to count from when considering repeating
sequence rules, or the current time when considering time-based rules. Each
variable required by any rule will be associated with an asynchronous function
to get the current value of that variable. The currently-required variables are

 1. Elapsed Time Since Start: this will allow the scheduler to tell the correct
    current state for a repeating sequence.
 2. Wall Clock Time: this will allow the scheduler to tell the correct current
    state for time-based sequences.
 3. Current State Per Peripheral: this will allow the scheduler to apply the 
    override rules correctly.
