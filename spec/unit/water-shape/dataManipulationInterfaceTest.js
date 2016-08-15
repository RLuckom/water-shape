'use strict';
const _ = require('lodash');

/* Runs a suite of tests of the generic data manipulation interface.
 *
 * @param {String} dmiName name to use in the test descriptions
 * @param {Function} beforeEachFunction function(schema, callback) that will use schema to 
 *                                      populate the DMI and pass it as the second argument 
 *                                      to callback.
 * @param {Function} afterEachFunction function(dmi, callback) that cleans up after tests.
 */
function testGenericDataManipulationInterface(dmiName, beforeEachFunction, afterEachFunction) {
  const schema = {
    trees: {
      id: 'treeNumber',
      columns: {
        treeNumber: 'NUMBER',
        treeName: 'TEXT',
        treeType: 'TEXT',
      },
      constraints: {
        FOREIGN_KEYS: {
          treeType: 'treeTypes.name'
        },
        UNIQUE: [['treeName']]
      },
      apiMethods: {
        GET: true,
        POST: true,
        PUT: true,
        DELETE: true
      }
    },
    treeTypes: {
      id: 'uid',
      columns: {
        uid: 'TEXT',
        name: 'TEXT',
      },
      constraints: {
        UNIQUE: [['name']]
      },
      apiMethods: {
        GET: true,
        POST: true,
        PUT: true,
        DELETE: true
      },
      initialValues: [
        {uid: '78', name: 'walnut'},
        {uid: '79', name: 'oak'},
        {uid: '80', name: 'pine'}
      ]
    }
  };

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
      beforeEachFunction(schema, populatedCallback);
    });

    afterEach(function(done) {
      afterEachFunction(dmi, done)
    });

    it('can list the records in a table', function(done) {
      dmi.treeTypes.list(function(err, records) {
        expect(records).toEqual(schema.treeTypes.initialValues);
        done();
      });
    });

    it('can get a record by id', function(done) {
      dmi.treeTypes.getById('78', function(err, record) {
        expect(record).toEqual(schema.treeTypes.initialValues[0]);
        done();
      });
    });

    it('can search for a record by attribute', function(done) {
      dmi.treeTypes.search({name: 'walnut'}, function(err, records) {
        expect(records[0]).toEqual(schema.treeTypes.initialValues[0]);
        done();
      });
    });

    it('can update a record', function(done) {
      dmi.treeTypes.update({uid: '78', name: 'spruce'}, function(err, records) {
        dmi.treeTypes.getById('78', function(err, record) {
          expect(record).toEqual({uid: '78', name: 'spruce'});
          done();
        });
      });
    });

    it('can save a record', function(done) {
      dmi.treeTypes.save({uid: '57', name: 'crabapple'}, function(err, records) {
        dmi.treeTypes.getById('57', function(err, record) {
          expect(record).toEqual({uid: '57', name: 'crabapple'});
          done();
        });
      });
    });

    function verifyNotIn(arr, obj) {
      return !_.find(arr, obj, _.isEqual);
    }

    it('can delete a record using the record', function(done) {
      var typeToDelete = _.cloneDeep(schema.treeTypes.initialValues[0]);
      dmi.treeTypes.delete(typeToDelete, function(err, records) {
        dmi.treeTypes.list(function(err, records) {
          expect(verifyNotIn(records, typeToDelete)).toBe(true);
          done();
        });
      });
    });

    it('can delete a record using the id', function(done) {
      var typeToDelete = _.cloneDeep(schema.treeTypes.initialValues[0]);
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
