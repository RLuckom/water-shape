'use strict';

var gpioLibFactory = require('../../../gpio/gpioLib');
var dbUtils = require('../../dbUtils.js');
var schema = require('../../../schema/schema.js');
const uuid = require('uuid');
const fs = require('fs');
var sequenceUtilsFactory = require('../../../utils/sequenceManipulation.js');

describe('gpio utils sets gpio pins', function() {
  var onTimeoutFunction, intervalMS, gpioLib, registeredGpios = {};
  function fakeSetTimeout(a, b) {
    onTimeoutFunction = a;
    intervalMS = b;
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
    tryToDelete(dbFile);
    var sequence1 = ['sequences', {
      uid: uuid.v4(),
      name: 'sequence1',
      dateCreated: new Date().toString(),
      sequenceType: 'DURATION',
      defaultState: 1
    }];
    var sequence2 = ['sequences', {
      uid: uuid.v4(),
      name: 'sequence2',
      dateCreated: new Date().toString(),
      sequenceType: 'DURATION',
      defaultState: 0
    }];
    var onSequenceItem1 = ['sequenceItems', {
      uid: uuid.v4(),
      dateCreated: new Date().toString(),
      sequenceUid: sequence1[1].uid,
      durationSeconds: 1,
      ordinal: 1,
      startTime: null,
      endTime: null,
      state: 1
    }];
    var offSequenceItem1 = ['sequenceItems', {
      uid: uuid.v4(),
      dateCreated: new Date().toString(),
      sequenceUid: sequence1[1].uid,
      durationSeconds: 2,
      ordinal: 2,
      startTime: null,
      endTime: null,
      state: 0
    }];
    var onSequenceItem2 = ['sequenceItems', {
      uid: uuid.v4(),
      dateCreated: new Date().toString(),
      sequenceUid: sequence2[1].uid,
      durationSeconds: 3,
      ordinal: 1,
      startTime: null,
      endTime: null,
      state: 1
    }];
    var offSequenceItem2 = ['sequenceItems', {
      uid: uuid.v4(),
      dateCreated: new Date().toString(),
      sequenceUid: sequence2[1].uid,
      durationSeconds: 4,
      ordinal: 2,
      startTime: null,
      endTime: null,
      state: 0
    }];
    var pin1 = ['gpioPins', {
      pinNumber: 4,
      sequenceUid: sequence1[1].uid
    }];
    var pin2 = ['gpioPins', {
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

  it('creates a gpio pin',function(done) {
    var sequenceUtils = sequenceUtilsFactory(db);
    function deepSequences(callback) {
      return sequenceUtils.getSequencesWithItemsAndPins(function(err, res) {
        if (err) {
          throw err;
        } else {
          logger.log('sequences', JSON.stringify(res, null, 2));
          return callback(res);
        }
      });
    }
    gpioLib = gpioLibFactory(logger, fakeGpio, deepSequences, fakeSetTimeout);
    gpioLib.start(function() {
      var pump = registeredGpios[14];
      logger.log('onTimeoutFunction', onTimeoutFunction);
      onTimeoutFunction();
      expect(pump.callArguments.length).toBe(2);
      expect(pump.callArguments[0]).toBe(1);
      expect(pump.callArguments[1]).toBe(0);
      done();
    });
  });
});
