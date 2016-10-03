module.exports = {
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
  typeSpecimen: {
    id: 'uid',
    columns: {
      uid: 'TEXT',
      number: 'NUMBER',
      treeType: 'TEXT'
    },
    apiMethods: {
      GET: true,
      POST: true,
      PUT: true,
      DELETE: true
    },
    constraints: {
      FOREIGN_KEYS: {
        treeType: 'treeTypes.uid'
      }
    },
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
  treeHouse: {
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
    validate: function() {},
    initialValues: [
      {uid: 'jhggzxjclv', name: 'Cool Tree House'}
    ]
  },
  treeTrunk: {
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
    validate: function(v, dmi, callback) {
      callback();
      callback();
      callback();
    },
    initialValues: [
      {uid: 'jhgjclv', name: 'Cool Tree Trunk'}
    ]
  },
  treeSwing: {
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
    validate: function(v, dmi, callback) {
      callback(new Error('wtf, mate?'));
      callback();
      callback();
    },
    initialValues: [
      {uid: 'jhgjc', name: 'Cool Tree Swing'}
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
      typeSpecimen: {
        single: true,
        table: 'typeSpecimen',
        select: {
          treeType: 'treeType.uid'
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
