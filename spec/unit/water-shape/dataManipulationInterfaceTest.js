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
      },
      initialValues: [
        {treeNumber: 1, treeName: 'Bob', treeType: 'walnut'},
        {treeNumber: 2, treeName: 'Samantha', treeType: 'oak'}
      ]
    },
    treeTypes: {
      id: 'uid',
      columns: {
        uid: 'TEXT',
        name: 'TEXT',
        description: 'TEXT'
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
        {uid: '78', name: 'walnut', description: 'cool tree'},
        {uid: '79', name: 'oak', description: 'ok tree'},
        {uid: '80', name: 'pine', description: 'also cool tree'}
      ]
    },
    leaves: {
      id: 'uid',
      columns: {
        uid: 'NUMBER',
        name: 'TEXT',
        tree: 'NUMBER'
      },
      apiMethods: {
        GET: true,
        POST: true,
        PUT: true,
        DELETE: true
      },
      constraints: {
        FOREIGN_KEYS: {
          tree: 'trees.treeNumber'
        }
      },
      initialValues: [
        {uid: 1, name: 'Bob1', tree: 1},
        {uid: 2, name: 'Bob2', tree: 1},
        {uid: 3, name: 'Bob3', tree: 1}
      ]
    },
    leafType: {
      id: 'uid',
      columns: {
        uid: 'TEXT',
        name: 'TEXT',
      },
      apiMethods: {
        GET: true,
        POST: true,
        PUT: true,
        DELETE: true
      },
      constraints: {
      },
      validate: function(val, dmi, callback) {
        if (typeof val.name === 'number') {
          throw new Error('numbers not allowed')
        }
        if (!val.name || val.name[0] !== 'L') {
          callback('Must be a string starting with l');
        } else {
          dmi.leafType.search({name: val.name}, function(err, instances) {
            if (instances.length) {
              callback('Cannot add duplicate name');
            } else {
              callback();
            }
          });
        }
      },
      initialValues: [
        {uid: 'hgfjxk', name: 'Leaf2'}
      ]
    },
    treesWithType: {
      constructed: true,
      structure: {
        tree: {
          single: true,
          table: 'trees'
        },
        treeType: {
          single: true,
          table: 'treeTypes',
          select: {
            name: 'tree.treeType'
          }
        },
        leaves: {
          table: 'leaves',
          select: {
            tree: 'tree.treeNumber'
          }
        }
      }
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
      dmi.leafType.save({name: 42}, function(err, records) {
        expect(err).not.toBeUndefined();
        expect(records).toBeUndefined();
        done();
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

    it('can list the records in a constructed table', function(done) {
      const treesWithTypes = [
        {
          tree: {treeNumber: 1, treeName: 'Bob', treeType: 'walnut'},
          treeType: {uid: '78', name: 'walnut', description: 'cool tree'},
          leaves: [
            {uid: 1, name: 'Bob1', tree: 1},
            {uid: 2, name: 'Bob2', tree: 1},
            {uid: 3, name: 'Bob3', tree: 1}
          ]
        },
        {
          tree: {treeNumber: 2, treeName: 'Samantha', treeType: 'oak'},
          treeType: {uid: '79', name: 'oak', description: 'ok tree'},
          leaves: []
        }
      ];
      dmi.treesWithType.list(function(err, records) {
        expect(records).toEqual(treesWithTypes);
        done();
      });
    });

    it('can get a record in a constructed table by id', function(done) {
      const treeWithType = {
        tree: {treeNumber: 1, treeName: 'Bob', treeType: 'walnut'},
        treeType: {uid: '78', name: 'walnut', description: 'cool tree'},
        leaves: [
          {uid: 1, name: 'Bob1', tree: 1},
          {uid: 2, name: 'Bob2', tree: 1},
          {uid: 3, name: 'Bob3', tree: 1}
        ]
      };
      dmi.treesWithType.getById(1, function(err, records) {
        expect(records).toEqual(treeWithType);
        done();
      });
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
          expect(record).toEqual({uid: '57', name: 'crabapple', description: 'useless tree'});
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
