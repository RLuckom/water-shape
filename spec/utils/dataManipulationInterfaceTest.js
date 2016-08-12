'use strict';


/* Runs a suite of tests of the generic data manipulation interface.
 *
 * @param {Function} describe: jasmine describe function
 * @param {Function} it: jasmine it function
 * @param {Function} afterEach: jasmine afterEach function
 * @param {Function} beforeEach: jasmine beforeEach function
 * @param {Function} beforeEachFunction function(schema, callback) that will use schema to 
 *                                      populate the DMI and pass it as the second argument 
 *                                      to callback.
 * @param {Function} afterEachFunction function(dmi, callback) that cleans up after tests.
 */
function testGenericDataManipulationInterface(describe, it, beforeEach, afterEach, beforeEachFunction, afterEachFunction) {
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
        POST: false,
        PUT: false,
        DELETE: false
      },
      initialValues: [
        {uid: '78', name: 'walnut'},
        {uid: '79', name: 'oak'},
        {uid: '80', name: 'pine'}
      ]
    }
  };

  describe('Generic Data Manipulation interface tests', function() {
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

    it('has been populated correctly', function(done) {
      dmi.treeTypes.list(function(err, records) {
        console.log(records);
        expect(records).toEqual(schema.treeTypes.initialValues);
        done();
      });
    });
  });
}

module.exports = testGenericDataManipulationInterface;
