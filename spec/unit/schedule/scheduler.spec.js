'use strict';

var schedulerFactory = require('../../../schedule/scheduler');
const controllerFactory = require('../../../schedule/livePeripheralTypeControlMethods');
const moment = require('moment');
var dbUtils = require('../../dbUtils.js');
var dmiFactory = require('../../../water-shape/api/demo-adapter.js');
var schema = require('../../../schema/schema.js');
const uuid = require('uuid');
const fs = require('fs');
const _ = require('lodash');
var peripheralsFactory = require('../../../utils/peripherals.js');

describe('gpio utils sets gpio pins', function() {
  var scheduler, dmi, registeredGpios = {};
  var peripheral1, peripheral2, peripheralType1, relayPeripheralType, peripheralRule1, peripheralRule2, peripheralType1Dependency, relayPeripheralTypeDependency, sequence1, sequence2, onSequenceItem1, onSequenceItem2, on2SequenceItem1, offSequenceItem1, offSequenceItem2, pin1, pin2;

  function fakeGpio(gpioDef, n) {
    var self = {};
    self.callArguments = [];
    self.callTimes = [];
    self.startTime = new Date().getTime();
    self.digitalWrite = function(n) {
      self.callArguments.push(n);
      self.callTimes.push(new Date().getTime() - self.startTime);
    };
    registeredGpios[gpioDef.pinNumber] = self;
    return self;
  }

  const config = {
    RELOAD_SCHEDULE_SECONDS: 1
  };

  const hardwareTypeMaps = {
    GPIO_OUTPUT: fakeGpio
  }; 

  function get(ioType, ioDef) {
    if (!hardwareTypeMaps[ioType]) {
      throw new Error(`No hardware type corresponding to ${ioType}`);
    }
    return hardwareTypeMaps[ioType](ioDef);
  }

  const hardwareManager = {get};

  const logger = {
    log: (level, message) => {
      return console.log(`[ ${level} ] ${message}`);
    }
  };

  const controllers = controllerFactory(logger);

  afterEach(function() {
    scheduler.stop();
  });

  beforeEach(function() {
    registeredGpios = {};
    relayPeripheralType = ['peripheralType', {
      name: 'RELAY',
      domain: 'CONTINUOUS'
    }];
    relayPeripheralTypeDependency = ['peripheralTypeDependency', {
      uid: uuid.v4(),
      name: 'On / Off Pin',
      peripheralType: 'RELAY',
      ioType: 'GPIO_OUTPUT'
    }];
    peripheralType1 = ['peripheralType', {
      name: 'CAMERA',
      domain: 'TRIGGERED'
    }];
    peripheralType1Dependency = ['peripheralTypeDependency', {
      uid: uuid.v4(),
      name: 'Lights',
      peripheralType: 'RELAY',
      ioType: 'CAMERA'
    }];
    peripheral1 = ['peripheral', {
      uid: uuid.v4(),
      name: 'Lights',
      peripheralType: 'RELAY'
    }];
    peripheral2 = ['peripheral', {
      uid: uuid.v4(),
      name: 'Pump',
      peripheralType: 'RELAY'
    }];
    sequence1 = ['sequence', {
      uid: uuid.v4(),
      name: 'sequence1',
      dateCreated: new Date().toString(),
      sequenceType: 'TIME',
      defaultState: 0
    }];
    sequence2 = ['sequence', {
      uid: uuid.v4(),
      name: 'sequence2',
      dateCreated: new Date().toString(),
      sequenceType: 'DURATION',
      defaultState: 0
    }];
    peripheralRule2 = ['peripheralRule', {
      uid: uuid.v4(),
      peripheralId: peripheral2[1].uid,
      alwaysOn: false,
      alwaysOff: false,
      sequenceId: sequence2[1].uid
    }];
    peripheralRule1 = ['peripheralRule', {
      uid: uuid.v4(),
      peripheralId: peripheral1[1].uid,
      alwaysOn: false,
      alwaysOff: false,
      sequenceId: sequence1[1].uid
    }];
    onSequenceItem2 = ['sequenceItem', {
      uid: uuid.v4(),
      dateCreated: new Date().toString(),
      sequenceId: sequence2[1].uid,
      durationSeconds: 1,
      ordinal: 1,
      startTime: null,
      endTime: null,
      state: 1
    }];
    offSequenceItem2 = ['sequenceItem', {
      uid: uuid.v4(),
      dateCreated: new Date().toString(),
      sequenceId: sequence2[1].uid,
      durationSeconds: 2,
      ordinal: 2,
      startTime: null,
      endTime: null,
      state: 0
    }];
    pin1 = ['gpioPin', {
      pinNumber: 4,
      peripheralTypeDependency: 'signal',
      peripheralId: peripheral1[1].uid
    }];
    pin2 = ['gpioPin', {
      pinNumber: 14,
      peripheralTypeDependency: 'signal',
      peripheralId: peripheral2[1].uid
    }];
  });

  describe('need another beforeEach', function() {
    beforeEach(function(done) {
      const recordsToInsert = [
        sequence2,
        relayPeripheralType,
        peripheral2,
        peripheralRule2,
        onSequenceItem2,
        offSequenceItem2,
        pin2
      ];
      function assigndb(populatedDb) {
        dmi = populatedDb;
        done();
      }
      dbUtils.insertRecordsIntoTables(dmiFactory(schema.schemaFactory(), logger), recordsToInsert, assigndb)
    });
    it('reads sequences from the dmi and sets up timeouts correctly based on sequenceItems', function(done) {
      scheduler = schedulerFactory(dmi, hardwareManager, controllers, config, logger);
      scheduler.start();
      // | 0----------1----------2----------3----------4----------5----------6 |
      // |            |1111111111 0000000000 0000000000 1111111111 0000000000
      // |            V
      // |      get sequence items
      setTimeout(function() {
        // 1200 ms
        var pump = registeredGpios[14];
        expect(pump.callArguments.length).toBe(2);
        expect(pump.callArguments[0]).toBe(0); // calls default on init
        expect(pump.callArguments[1]).toBe(1); // first SI is 1 for 1s
        console.log(pump);
        setTimeout(function() {
          // 2400 ms
          expect(pump.callArguments.length).toBe(3); // second SI 
          expect(pump.callArguments[2]).toBe(0); // 0 for 2s
          console.log(pump);
        }, 1000);
        setTimeout(function() {
          // 3400 ms
          expect(pump.callArguments.length).toBe(3); // still second si
          console.log(pump);
        }, 2000);
        setTimeout(function() {
          // 4400 ms
          expect(pump.callArguments.length).toBe(4); // third SI
          expect(pump.callArguments[3]).toBe(1); // 1 for 1s
          console.log(pump);
          var recordsToDelete = [
            onSequenceItem2,
            offSequenceItem2,
            peripheralRule2,
            peripheral2,
            sequence2
          ];
          dbUtils.deleteRecordsFromTables(dmi, recordsToDelete, function() {
            setTimeout(function() {
              // 6400 ms
              expect(pump.callArguments.length).toBe(6); 
              expect(pump.callArguments[4]).toBe(0); // start of second 0 period
              expect(pump.callArguments[5]).toBe(0); // destroy
              console.log(pump);
              done();
            }, 2000)
          });
        }, 3000);
      }, 1400);
    }, 40000);
  });

  describe('need another beforeEach', function() {
    beforeEach(function(done) {
      onSequenceItem1 = ['sequenceItem', {
        uid: uuid.v4(),
        dateCreated: new Date().toString(),
        sequenceId: sequence1[1].uid,
        durationSeconds: null,
        ordinal: null,
        startTime: moment().endOf('second').add(1, 'seconds'),
        endTime: moment().endOf('second').add(2, 'seconds'),
        state: 1
      }];
      offSequenceItem1 = ['sequenceItem', {
        uid: uuid.v4(),
        dateCreated: new Date().toString(),
        sequenceId: sequence1[1].uid,
        durationSeconds: null,
        ordinal: null,
        startTime: moment().endOf('second').add(2, 'seconds'),
        endTime: moment().endOf('second').add(4, 'seconds'),
        state: 0
      }];
      on2SequenceItem1 = ['sequenceItem', {
        uid: uuid.v4(),
        dateCreated: new Date().toString(),
        sequenceId: sequence1[1].uid,
        durationSeconds: null,
        ordinal: null,
        startTime: moment().endOf('second').add(4, 'seconds'),
        endTime: moment().endOf('second').add(5, 'seconds'),
        state: 1
      }];
      const recordsToInsert = [
        sequence1,
        relayPeripheralType,
        peripheral1,
        peripheralRule1,
        onSequenceItem1,
        offSequenceItem1,
        on2SequenceItem1,
        pin1
      ];
      function assigndb(populatedDb) {
        dmi = populatedDb;
        done();
      }
      dbUtils.insertRecordsIntoTables(dmiFactory(schema.schemaFactory(), logger), recordsToInsert, assigndb)
    });
    it('reads sequences from the dmi and sets up timeouts correctly based on sequenceItems', function(done) {
      scheduler = schedulerFactory(dmi, hardwareManager, controllers, config, logger);
      scheduler.start();
      // | 0----------1----------2----------3----------4----------5----------6 |
      // |            |1111111111 0000000000 0000000000 1111111111 0000000000
      // |            V
      // |      get sequence items
      setTimeout(function() {
        // 1400 ms
        var lights = registeredGpios[4];
        expect(lights.callArguments.length).toBe(2);
        expect(lights.callArguments[0]).toBe(0);
        expect(lights.callArguments[1]).toBe(1);
        setTimeout(function() {
          // 2400 ms
          expect(lights.callArguments.length).toBe(3);
          expect(lights.callArguments[2]).toBe(0);
          console.log(lights);
        }, 1000);
        setTimeout(function() {
          // 3400 ms
          expect(lights.callArguments.length).toBe(3);
          expect(lights.callArguments[2]).toBe(0);
          console.log(lights);
        }, 2000);
        setTimeout(function() {
          // 4400 ms
          expect(lights.callArguments.length).toBe(4);
          expect(lights.callArguments[3]).toBe(1);
          console.log(lights);
          var recordsToDelete = [
            onSequenceItem1,
            offSequenceItem1,
            on2SequenceItem1,
            peripheralRule1,
            peripheral1,
            sequence1
          ];
          dbUtils.deleteRecordsFromTables(dmi, recordsToDelete, function() {
            setTimeout(function() {
              expect(lights.callArguments.length).toBe(6);
              expect(lights.callArguments[4]).toBe(0);
              expect(lights.callArguments[5]).toBe(0);
              console.log(lights);
              done();
            }, 3000);
          });
        }, 3000);
      }, 1400);
    }, 40000);
  });
});
