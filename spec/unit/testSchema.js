module.exports = {
  trees: {
    type: 'PERSISTED',
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
    type: 'PERSISTED',
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
    type: 'PERSISTED',
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
    type: 'PERSISTED',
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
    type: 'PERSISTED',
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
    type: 'PERSISTED',
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
  treefrog: {
    type: 'PERSISTED',
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
      {uid: 'A', name: 'Cool Tree Frog'}
    ]
  },
  treeTrunk: {
    type: 'PERSISTED',
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
    type: 'PERSISTED',
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
    type: 'TREE',
    root: 'tree',
    structure: {
      tree: {
        single: true,
        table: 'trees'
      },
      treeType: {
        single: true,
        table: 'treeTypes',
        select: {
          name: {key: 'tree.treeType', type:'COMPUTED'}
        }
      },
      treefrog: {
        table: 'treefrog',
        select: {
          uid: {type:'LITERAL', value: 'A'}
        }
      },
      typeSpecimen: {
        single: true,
        table: 'typeSpecimen',
        select: {
          treeType: {key: 'treeType.uid', type:'COMPUTED'}
        }
      },
      leaves: {
        table: 'leaves',
        select: {
          tree: {key: 'tree.treeNumber', type:'COMPUTED'}
        }
      }
    }
  }
};
