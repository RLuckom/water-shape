'use strict';

var gpioLibFactory = require('../../../gpio/gpioLib');
var dbUtils = require('../../dbUtils.js');
var schema = require('../../../schema/schema.js');
const uuid = require('uuid');
const fs = require('fs');
const _ = require('lodash');
var sequenceUtilsFactory = require('../../../utils/sequenceManipulation.js');

describe('gpio utils sets gpio pins', function() {
  var gpioLib, registeredGpios = {};
  var sequence1, sequence2, onSequenceItem1, onSequenceItem2, offSequenceItem1, offSequenceItem2, pin1, pin2;

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
    gpioLib.stop();
  });

  beforeEach(function() {
    registeredGpios = {};
    tryToDelete(dbFile);
    sequence1 = ['sequence', {
      uid: uuid.v4(),
      name: 'sequence1',
      dateCreated: new Date().toString(),
      sequenceType: 'DURATION',
      defaultState: 1
    }];
    sequence2 = ['sequence', {
      uid: uuid.v4(),
      name: 'sequence2',
      dateCreated: new Date().toString(),
      sequenceType: 'DURATION',
      defaultState: 0
    }];
    onSequenceItem1 = ['sequenceItem', {
      uid: uuid.v4(),
      dateCreated: new Date().toString(),
      sequenceId: sequence1[1].uid,
      durationSeconds: .25,
      ordinal: 1,
      startTime: null,
      endTime: null,
      state: 1
    }];
    offSequenceItem1 = ['sequenceItem', {
      uid: uuid.v4(),
      dateCreated: new Date().toString(),
      sequenceId: sequence1[1].uid,
      durationSeconds: .25,
      ordinal: 2,
      startTime: null,
      endTime: null,
      state: 0
    }];
    onSequenceItem2 = ['sequenceItem', {
      uid: uuid.v4(),
      dateCreated: new Date().toString(),
      sequenceId: sequence2[1].uid,
      durationSeconds: .25,
      ordinal: 1,
      startTime: null,
      endTime: null,
      state: 1
    }];
    offSequenceItem2 = ['sequenceItem', {
      uid: uuid.v4(),
      dateCreated: new Date().toString(),
      sequenceId: sequence2[1].uid,
      durationSeconds: .5,
      ordinal: 2,
      startTime: null,
      endTime: null,
      state: 0
    }];
    pin1 = ['gpioPin', {
      pinNumber: 4,
      sequenceId: sequence1[1].uid
    }];
    pin2 = ['gpioPin', {
      pinNumber: 14,
      sequenceId: sequence2[1].uid
    }];
  });


  describe('need another beforeEach', function() {
    beforeEach(function(done) {
      const recordsToInsert = [
        sequence2,
        onSequenceItem2,
        offSequenceItem2,
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
      gpioLib = gpioLibFactory(logger, fakeGpio, deepSequences);
      gpioLib.start(function() {
        var pump = registeredGpios[14];
        expect(pump.callArguments.length).toBe(1);
        expect(pump.callArguments[0]).toBe(1);
        setTimeout(function() {
          expect(pump.callArguments.length).toBe(2);
          expect(pump.callArguments[1]).toBe(0);
        }, 400);
        setTimeout(function() {
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
        }, 900);
      });
    });
  });

  describe('need another beforeEach', function() {
    beforeEach(function(done) {
      const recordsToInsert = [
        sequence1,
        onSequenceItem1,
        offSequenceItem1,
        pin1,
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
      gpioLib = gpioLibFactory(logger, fakeGpio, deepSequences);
      gpioLib.start(function() {
        var lights = registeredGpios[4];
        expect(lights.callArguments.length).toBe(1);
        expect(lights.callArguments[0]).toBe(1);
        setTimeout(function() {
          expect(lights.callArguments.length).toBe(2);
          expect(lights.callArguments[1]).toBe(0);
        }, 300);
        setTimeout(function() {
          var recordsToDelete = [
            onSequenceItem1,
            offSequenceItem1,
            pin1, // shouldn't really delete this
            sequence1
          ];
          dbUtils.deleteRecordsFromTables(db, recordsToDelete, logger, function() {
            setTimeout(function() {
              expect(lights.callArguments.length).toBe(13);
              expect(lights.callArguments[2]).toBe(1);
              done();
            }, 3900);
          });
        }, 600);
      });
    });
  });
});
