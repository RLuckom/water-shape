'use strict';

var gpioLibFactory = require('../../../gpio/gpioLib');
var dbUtils = require('../../dbUtils.js');
var schema = require('../../../schema/schema.js');
const uuid = require('uuid');
const fs = require('fs');
const _ = require('lodash');
var sequenceUtilsFactory = require('../../../utils/sequenceManipulation.js');

describe('gpio utils sets gpio pins', function() {
  var intervalCalls = [], timeoutCalls = [], gpioLib, registeredGpios = {};
  var sequence1, sequence2, onSequenceItem1, onSequenceItem2, offSequenceItem1, offSequenceItem2, pin1, pin2;
  function fakeSetTimeout(a, b) {
    timeoutCalls.push({
      callback: a,
      timeoutMS: b
    });
  }
  function fakeSetInterval(a, b) {
    intervalCalls.push({
      callback: a,
      intervalMS: b
    });
  }

  function fakeGpio(pinNumber, options) {
    var self = this;
    this.callArguments = []
    this.digitalWrite = function(n) {
      self.callArguments.push(n);
    };
    registeredGpios[pinNumber] = this;
  }

  const logger = {
    log: (level, message) => {
      return console.log(`[ ${level} ] ${message}`);
    }
  };

  var db;

  function tryToDelete(s) {
    try{
      fs.unlinkSync(s);
    } catch(err) {} // don't care
  }

  const dbFile = 'test.db';

  afterEach(function() {
    tryToDelete(dbFile);
  });

  beforeEach(function(done) {
    intervalCalls = [];
    timeoutCalls = [];
    registeredGpios = {};
    tryToDelete(dbFile);
    sequence1 = ['sequences', {
      uid: uuid.v4(),
      name: 'sequence1',
      dateCreated: new Date().toString(),
      sequenceType: 'DURATION',
      defaultState: 1
    }];
    sequence2 = ['sequences', {
      uid: uuid.v4(),
      name: 'sequence2',
      dateCreated: new Date().toString(),
      sequenceType: 'DURATION',
      defaultState: 0
    }];
    onSequenceItem1 = ['sequenceItems', {
      uid: uuid.v4(),
      dateCreated: new Date().toString(),
      sequenceUid: sequence1[1].uid,
      durationSeconds: 1,
      ordinal: 1,
      startTime: null,
      endTime: null,
      state: 1
    }];
    offSequenceItem1 = ['sequenceItems', {
      uid: uuid.v4(),
      dateCreated: new Date().toString(),
      sequenceUid: sequence1[1].uid,
      durationSeconds: 2,
      ordinal: 2,
      startTime: null,
      endTime: null,
      state: 0
    }];
    onSequenceItem2 = ['sequenceItems', {
      uid: uuid.v4(),
      dateCreated: new Date().toString(),
      sequenceUid: sequence2[1].uid,
      durationSeconds: 3,
      ordinal: 1,
      startTime: null,
      endTime: null,
      state: 1
    }];
    offSequenceItem2 = ['sequenceItems', {
      uid: uuid.v4(),
      dateCreated: new Date().toString(),
      sequenceUid: sequence2[1].uid,
      durationSeconds: 4,
      ordinal: 2,
      startTime: null,
      endTime: null,
      state: 0
    }];
    pin1 = ['gpioPins', {
      pinNumber: 4,
      sequenceUid: sequence1[1].uid
    }];
    pin2 = ['gpioPins', {
      pinNumber: 14,
      sequenceUid: sequence2[1].uid
    }];
    const recordsToInsert = [
      sequence1,
      sequence2,
      onSequenceItem1,
      offSequenceItem1,
      onSequenceItem2,
      offSequenceItem2,
      pin1,
      pin2
    ];
    function assigndb(populatedDb) {
      db = populatedDb;
      done();
    }
    dbUtils.insertRecordsIntoTables('test.db', schema.schemaFactory(), recordsToInsert, logger, assigndb)
  });

  it('reads sequences from the db and sets up timeouts correctly based on sequenceItems', function(done) {
    var sequenceUtils = sequenceUtilsFactory(db);
    function deepSequences(callback) {
      return sequenceUtils.getSequencesWithItemsAndPins(function(err, res) {
        if (err) {
          throw err;
        } else {
          return callback(res);
        }
      });
    }
    gpioLib = gpioLibFactory(logger, fakeGpio, deepSequences, fakeSetTimeout, fakeSetInterval);
    gpioLib.start(function() {
      var pump = registeredGpios[14];
      var pumpTimeoutFunction = _.find(timeoutCalls, ['timeoutMS', 3000]).callback;
      expect(pump.callArguments.length).toBe(1);
      expect(pump.callArguments[0]).toBe(1);
      pumpTimeoutFunction();
      expect(pump.callArguments.length).toBe(2);
      expect(pump.callArguments[1]).toBe(0);
      pumpTimeoutFunction = _.find(timeoutCalls, ['timeoutMS', 4000]).callback;
      pumpTimeoutFunction();
      expect(pump.callArguments.length).toBe(3);
      expect(pump.callArguments[2]).toBe(1);
      var recordsToDelete = [
        onSequenceItem2,
        offSequenceItem2,
        pin2, // shouldn't really delete this
        sequence2
      ];
      dbUtils.deleteRecordsFromTables(db, recordsToDelete, logger, function() {
        done();
      });
    });
  });

  it('reads sequences from the db and sets up timeouts correctly based on sequenceItems', function(done) {
    var sequenceUtils = sequenceUtilsFactory(db);
    function deepSequences(callback) {
      return sequenceUtils.getSequencesWithItemsAndPins(function(err, res) {
        if (err) {
          throw err;
        } else {
          return callback(res);
        }
      });
    }
    gpioLib = gpioLibFactory(logger, fakeGpio, deepSequences, fakeSetTimeout, fakeSetInterval);
    gpioLib.start(function() {
      var pump = registeredGpios[14];
      var pumpTimeoutFunction = _.find(timeoutCalls, ['timeoutMS', 3000]).callback;
      expect(pump.callArguments.length).toBe(1);
      expect(pump.callArguments[0]).toBe(1);
      pumpTimeoutFunction();
      expect(pump.callArguments.length).toBe(2);
      expect(pump.callArguments[1]).toBe(0);
      var recordsToDelete = [
        onSequenceItem2,
        offSequenceItem2,
        pin2, // shouldn't really delete this
        sequence2
      ];
      dbUtils.deleteRecordsFromTables(db, recordsToDelete, logger, function() {
        expect(intervalCalls.length).toEqual(1);
        expect(intervalCalls[0].intervalMS).toEqual(3000);
        intervalCalls[0].callback(function() {
          expect(pump.callArguments.length).toBe(3);
          expect(pump.callArguments[2]).toBe(0);
          done();
        });
      });
    });
  });
});
