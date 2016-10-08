'use strict';
const _ = require('lodash');
const schema = require('./testSchema');

/* Runs a suite of tests of the generic data manipulation interface.
 *
 * @param {String} dmiName name to use in the test descriptions
 * @param {Function} beforeEachFunction function(schema, callback) that will use schema to 
 *                                      populate the DMI and pass it as the second argument 
 *                                      to callback.
 * @param {Function} afterEachFunction function(dmi, callback) that cleans up after tests.
 */
function testGenericDataManipulationInterface(dmiName, beforeEachFunction, afterEachFunction) {

  function jsonCycle(o) {
    return JSON.parse(JSON.stringify(o));
  }

  describe('Generic Data Manipulation interface tests running against ' + dmiName, function() {
    var dmi;
    beforeEach(function(done) {
      function populatedCallback(err, populatedObject) {
        if (err) {
          throw err;
        }
        dmi = populatedObject;
        done();
      }
      beforeEachFunction(_.cloneDeep(schema), populatedCallback);
    });

    afterEach(function(done) {
      afterEachFunction(dmi, done)
    });

    it('tolerates validators that never call callback or throw', function(done) {
      dmi.treeHouse.save({name: '42'}, function(err, records) {
        expect(err).not.toBeUndefined();
        expect(records).toBeUndefined();
        done();
      });
    });

    it('when validators call callback multiple times, the first call wins and others have no effect on the db - success case', function(done) {
      var n = 0;
      dmi.treeTrunk.save({name: '42'}, function(err, records) {
        if (n === 0) {
          expect(err).toBeFalsy();
          expect(records).not.toBeFalsy();
        } else {
          expect(true).toBe(false);
        }
        n++;
        setTimeout(function() {
          dmi.treeTrunk.list(function(err, results) {
            expect(err).toBeFalsy();
            expect(_.filter(results, ['name', '42']).length).toEqual(1);
            done();
          }, 2000);
        });
      });
    });

    it('when validators call callback multiple times, the first call wins and others have no effect on the db - failure case', function(done) {
      var n = 0;
      dmi.treeSwing.save({name: '42'}, function(err, records) {
        if (n === 0) {
          expect(err).not.toBeFalsy();
          expect(records).toBeFalsy();
        } else {
          expect(true).toBe(false);
        }
        n++;
        setTimeout(function() {
          dmi.treeSwing.list(function(err, results) {
            expect(err).toBeFalsy();
            expect(_.filter(results, ['name', '42']).length).toEqual(0);
            done();
          }, 2000);
        });
      });
    });

    it('can insert validated values', function(done) {
      dmi.leafType.save({name: 'Leaf3'}, function(err, records) {
        expect(err).toBeFalsy();
        expect(records.name).toEqual('Leaf3');
        dmi.leafType.getById(records.uid, function(err, record) {
          expect(err).toBeFalsy();
          expect(records.name).toEqual('Leaf3');
          done();
        });
      });
    });

    it('can list the records in a tree table', function(done) {
      const treesWithTypes = [
        {
          tree: {treeNumber: 1, treeName: 'Bob', treeType: 'walnut'},
          typeSpecimen: void(0),
          treeType: {uid: '78', name: 'walnut', description: 'cool tree'},
          treefrog: [{uid: 'A', name: 'Cool Tree Frog'}],
          leaves: [
            {uid: 1, name: 'Bob1', tree: 1},
            {uid: 2, name: 'Bob2', tree: 1},
            {uid: 3, name: 'Bob3', tree: 1}
          ]
        },
        {
          typeSpecimen: void(0),
          tree: {treeNumber: 2, treeName: 'Samantha', treeType: 'oak'},
          treefrog: [{uid: 'A', name: 'Cool Tree Frog'}],
          treeType: {uid: '79', name: 'oak', description: 'ok tree'},
          leaves: []
        }
      ];
      dmi.treesWithType.list(function(err, records) {
        expect(jsonCycle(records)).toEqual(jsonCycle(treesWithTypes));
        done();
      });
    });

    it('can get a record in a tree table by id', function(done) {
      const treeWithType = {
        tree: {treeNumber: 1, treeName: 'Bob', treeType: 'walnut'},
        treeType: {uid: '78', name: 'walnut', description: 'cool tree'},
        treefrog: [{uid: 'A', name: 'Cool Tree Frog'}],
        typeSpecimen: void(0),
        leaves: [
          {uid: 1, name: 'Bob1', tree: 1},
          {uid: 2, name: 'Bob2', tree: 1},
          {uid: 3, name: 'Bob3', tree: 1}
        ]
      };
      dmi.treesWithType.getById(1, function(err, records) {
        expect(jsonCycle(records)).toEqual(jsonCycle(treeWithType));
        done();
      });
    });

    it('can list the records in a table', function(done) {
      dmi.treeTypes.list(function(err, records) {
        expect(jsonCycle(records)).toEqual(jsonCycle(schema.treeTypes.initialValues));
        done();
      });
    });

    it('can validate inserted values', function(done) {
      dmi.leafType.save({name: 'Bad'}, function(err, records) {
        expect(err).not.toBeUndefined();
        expect(records).toBeUndefined();
        done();
      });
    });

    it('can validate inserted values with the dmi', function(done) {
      dmi.leafType.save({name: 'Leaf2'}, function(err, records) {
        expect(err).not.toBeUndefined();
        expect(records).toBeUndefined();
        done();
      });
    });

    it('catches errors validating inserted values', function(done) {
      var lt = {uid: 'hgfjxk', name: 42};
      dmi.leafType.update(lt, function(err, records) {
        expect(err).not.toBeUndefined();
        expect(records).toBeUndefined();
        done();
      });
    });

    it('catches errors validating inserted values on update', function(done) {
      dmi.leafType.update({name: 42}, function(err, records) {
        expect(err).not.toBeUndefined();
        expect(records).toBeUndefined();
        done();
      });
    });

    it('can get a record by id', function(done) {
      dmi.treeTypes.getById('78', function(err, record) {
        expect(jsonCycle(record)).toEqual(jsonCycle(schema.treeTypes.initialValues[0]));
        done();
      });
    });

    it('can search for a record by attribute', function(done) {
      dmi.treeTypes.search({name: 'walnut'}, function(err, records) {
        expect(jsonCycle(records[0])).toEqual(jsonCycle(schema.treeTypes.initialValues[0]));
        done();
      });
    });

    it('can update a record', function(done) {
      dmi.treeTypes.update({uid: '80', name: 'spruce'}, function(err, records) {
        dmi.treeTypes.getById('80', function(err, record) {
          expect(record.uid).toEqual('80');
          expect(record.name).toEqual('spruce');
          expect(record.description).toEqual('also cool tree');
          done();
        });
      });
    });

    it('can save a record', function(done) {
      dmi.treeTypes.save({uid: '57', name: 'crabapple', description: 'useless tree'}, function(err, records) {
        dmi.treeTypes.getById('57', function(err, record) {
          expect(jsonCycle(record)).toEqual(jsonCycle({uid: '57', name: 'crabapple', description: 'useless tree'}));
          done();
        });
      });
    });

    function verifyNotIn(arr, obj) {
      return !_.find(arr, obj, _.isEqual);
    }

    it('can delete a record using the record', function(done) {
      var typeToDelete = _.cloneDeep(schema.treeTypes.initialValues[2]);
      dmi.treeTypes.delete(typeToDelete, function(err, records) {
        dmi.treeTypes.list(function(err, records) {
          expect(verifyNotIn(records, typeToDelete)).toBe(true);
          done();
        });
      });
    });

    it('can delete a record using the id', function(done) {
      var typeToDelete = _.cloneDeep(schema.treeTypes.initialValues[2]);
      dmi.treeTypes.deleteById(typeToDelete.uid, function(err, records) {
        dmi.treeTypes.list(function(err, records) {
          expect(verifyNotIn(records, typeToDelete)).toBe(true);
          done();
        });
      });
    });
  });
}

module.exports = testGenericDataManipulationInterface;
