'use strict';
const timeParser = require('../utils/timeParser.js');
const _ = require('lodash');

function schemaFactory(noOpValidate) {
  return {
    sequence: {
      id: 'uid',
      columns: {
        'uid': 'TEXT',
        'name': 'TEXT',
        'dateCreated': 'TEXT',
        'sequenceType': 'TEXT',
        'defaultState': 'NUMBER'
      },
      apiMethods: {
        GET: true,
        POST: true,
        PUT: true,
        DELETE: true
      },
      constraints: {
        FOREIGN_KEYS: {
          sequenceType : 'sequenceType.typeName'
        }
      },
    },
    pin: {
      id: 'uid',
      columns: {
        uid: 'TEXT',
        displayLabel: 'TEXT',
        pinType: 'TEXT',
        row: 'NUMBER',
        column: 'NUMBER'
      },
      apiMethods: {
        GET: true,
        POST: false,
        PUT: false,
        DELETE: false
      },
      constraints: {
        FOREIGN_KEYS: {
          pinType: 'pinType.typeName'
        }
      },
      initialValues: [
        {row: 1, column: 1, displayLabel: '5V', pinType: '5V'},
        {row: 1, column: 2, displayLabel: '5V', pinType: '5V'},
        {row: 1, column: 3, displayLabel: 'GR', pinType: 'GR'},
        {row: 1, column: 4, displayLabel: '14', pinType: 'GPIO'},
        {row: 1, column: 5, displayLabel: '15', pinType: 'GPIO'},
        {row: 1, column: 6, displayLabel: '18', pinType: 'GPIO'},
        {row: 1, column: 7, displayLabel: 'GR', pinType: 'GR'},
        {row: 1, column: 8, displayLabel: '23', pinType: 'GPIO'},
        {row: 1, column: 9, displayLabel: '24', pinType: 'GPIO'},
        {row: 1, column: 10, displayLabel: 'GR', pinType: 'GR'},
        {row: 1, column: 11, displayLabel: '25', pinType: 'GPIO'},
        {row: 1, column: 12, displayLabel: '08', pinType: 'GPIO'},
        {row: 1, column: 13, displayLabel: '07', pinType: 'GPIO'},
        {row: 1, column: 14, displayLabel: 'EP', pinType: 'EEPROM'},
        {row: 1, column: 15, displayLabel: 'GR', pinType: 'GR'},
        {row: 1, column: 16, displayLabel: '12', pinType: 'GPIO'},
        {row: 1, column: 17, displayLabel: 'GR', pinType: 'GR'},
        {row: 1, column: 18, displayLabel: '16', pinType: 'GPIO'},
        {row: 1, column: 19, displayLabel: '20', pinType: 'GPIO'},
        {row: 1, column: 20, displayLabel: '21', pinType: 'GPIO'},
        {row: 2, column: 1, displayLabel: '3V3', pinType: '3V3'},
        {row: 2, column: 2, displayLabel: '02', pinType: 'GPIO'},
        {row: 2, column: 3, displayLabel: '03', pinType: 'GPIO'},
        {row: 2, column: 4, displayLabel: '04', pinType: 'GPIO'},
        {row: 2, column: 5, displayLabel: 'GR', pinType: 'GR'},
        {row: 2, column: 6, displayLabel: '17', pinType: 'GPIO'},
        {row: 2, column: 7, displayLabel: '27', pinType: 'GPIO'},
        {row: 2, column: 8, displayLabel: '22', pinType: 'GPIO'},
        {row: 2, column: 9, displayLabel: '3V3', pinType: '3V3'},
        {row: 2, column: 10, displayLabel: '10', pinType: 'GPIO'},
        {row: 2, column: 11, displayLabel: '09', pinType: 'GPIO'},
        {row: 2, column: 12, displayLabel: '11', pinType: 'GPIO'},
        {row: 2, column: 13, displayLabel: 'GR', pinType: 'GR'},
        {row: 2, column: 14, displayLabel: 'EP', pinType: 'EEPROM'},
        {row: 2, column: 15, displayLabel: '05', pinType: 'GPIO'},
        {row: 2, column: 16, displayLabel: '06', pinType: 'GPIO'},
        {row: 2, column: 17, displayLabel: '13', pinType: 'GPIO'},
        {row: 2, column: 18, displayLabel: '19', pinType: 'GPIO'},
        {row: 2, column: 19, displayLabel: '26', pinType: 'GPIO'},
        {row: 2, column: 20, displayLabel: 'GR', pinType: 'GR'}
      ],
      constraints: {
        UNIQUE: [['column', 'row']]
      }
    },
    pinType: {
      id: 'uid',
      columns: {
        uid: 'TEXT',
        typeName: 'TEXT'
      },
      apiMethods: {
        GET: true,
        POST: false,
        PUT: false,
        DELETE: false
      },
      initialValues: [
        {typeName: '5V'},
        {typeName: '3V3'},
        {typeName: 'GR'},
        {typeName: 'EEPROM'},
        {typeName: 'GPIO'},
      ],
      constraints: {
        UNIQUE: [['typeName']]
      }
    },
    camera: {
      id: 'uid',
      columns: {
        'uid': 'TEXT',
        'cameraNumber': 'NUMBER', 
        'peripheralId': 'TEXT',
      },
      apiMethods: {
        GET: true,
        POST: false,
        PUT: true,
        DELETE: false
      },
      constraints: {
        FOREIGN_KEYS: {
          peripheralId : 'peripheral.uid'
        },
        UNIQUE: [['cameraNumber']]
      },
      initialValues: [
      ]
    },
    gpioPin: {
      id: 'pinNumber',
      columns: {
        'pinNumber': 'NUMBER', 
        'sequenceId': 'TEXT',
        'peripheralId': 'TEXT',
        'ioType': 'TEXT'
      },
      apiMethods: {
        GET: true,
        POST: false,
        PUT: true,
        DELETE: false
      },
      constraints: {
        FOREIGN_KEYS: {
          sequenceId : 'sequence.uid',
          ioType : 'ioType.name',
          peripheralId : 'peripheral.uid'
        },
        UNIQUE: [['pinNumber']]
      },
      initialValues: [
        {pinNumber: 14, sequenceId: null, peripheralId: null},
        {pinNumber: 15, sequenceId: null, peripheralId: null},
        {pinNumber: 18, sequenceId: null, peripheralId: null},
        {pinNumber: 23, sequenceId: null, peripheralId: null},
        {pinNumber: 24, sequenceId: null, peripheralId: null},
        {pinNumber: 25, sequenceId: null, peripheralId: null},
        {pinNumber: 8, sequenceId: null, peripheralId: null},
        {pinNumber: 7, sequenceId: null, peripheralId: null},
        {pinNumber: 2, sequenceId: null, peripheralId: null},
        {pinNumber: 3, sequenceId: null, peripheralId: null},
        {pinNumber: 4, sequenceId: null, peripheralId: null},
        {pinNumber: 17, sequenceId: null, peripheralId: null},
        {pinNumber: 27, sequenceId: null, peripheralId: null},
        {pinNumber: 22, sequenceId: null, peripheralId: null},
        {pinNumber: 10, sequenceId: null, peripheralId: null},
        {pinNumber: 9, sequenceId: null, peripheralId: null},
        {pinNumber: 11, sequenceId: null, peripheralId: null}
      ]
    },
    sequenceItem: {
      id: 'uid',
      columns: {
        'uid': 'TEXT',
        'dateCreated': 'TEXT',
        'sequenceId': 'TEXT',
        'durationSeconds': 'NUMBER',
        'ordinal': 'NUMBER',
        'startTime': 'TEXT',
        'endTime': 'TEXT',
        'state': 'NUMBER'
      },
      apiMethods: {
        GET: true,
        POST: true,
        PUT: true,
        DELETE: true
      },
      constraints: {
        FOREIGN_KEYS: {
          sequenceId: 'sequence.uid',
        },
        UNIQUE: [['sequenceId', 'ordinal']],
      },
      validate: function(instance, dmi, callback) {
        if (instance.startTime) {
          timeParser.parseTime(instance.startTime);
        }
        if (instance.endTime) {
          timeParser.parseTime(instance.endTime);
        }
        if (instance.state && [0, 1].indexOf(instance.state) === -1) {
          throw new Error('state must be 0 (off) or 1 (on)');
        }
        if (instance.startTime && instance.endTime) {
          return dmi.sequenceItem.search({sequenceId: instance.sequenceId}, function(err, sequenceItems) {
            if (err) {
              return callback(err);
            }
            if (instance.uid) {
              sequenceItems = _.reject(sequenceItems, ['uid', instance.uid]);
            }
            if (timeParser.sequenceItemOverlaps(instance, sequenceItems)) {
              return callback('cannot create a sequence item that overlaps another on the same sequence');
            }
            return callback();
          });
        }
        return callback();
      }
    },
    sequenceType: {
      id: 'uid',
      columns: {
        'uid': 'TEXT',
        'typeName': 'TEXT'
      },
      apiMethods: {
        GET: true,
        POST: false,
        PUT: false,
        DELETE: false
      },
      constraints: {
        UNIQUE: [['typeName']],
      },
      initialValues: [
        {typeName: 'DURATION'},
        {typeName: 'TIME'}
      ]
    },
    peripheral: {
      id: 'uid',
      columns: {
        'uid': 'TEXT',
        'peripheralType': 'TEXT',
        'name': 'TEXT'
      },
      apiMethods: {
        GET: true,
        POST: true,
        PUT: true,
        DELETE: true
      },
      constraints: {
        UNIQUE: [['name']],
        FOREIGN_KEYS: {
          peripheralType: 'peripheralType.name'
        }
      },
      initialValues: [
      ]
    },
    peripheralType: {
      id: 'name',
      columns: {
        'name': 'TEXT',
        'domain': 'TEXT'
      },
      apiMethods: {
        GET: true,
        POST: false,
        PUT: false,
        DELETE: false
      },
      constraints: {
        UNIQUE: [['name']],
        FOREIGN_KEYS: {
          domain: 'peripheralDomain.name'
        }
      },
      initialValues: [
        {name: 'RELAY', domain: 'CONTINUOUS'},
        {name: 'CAMERA', domain: 'TRIGGERED'}
      ]
    },
    ioType: {
      id: 'name',
      columns: {
        'name': 'TEXT',
      },
      apiMethods: {
        GET: true,
        POST: false,
        PUT: false,
        DELETE: false
      },
      constraints: {
        UNIQUE: [['name']],
      },
      initialValues: [
        {name: 'GPIO_INPUT'},
        {name: 'GPIO_OUTPUT'},
        {name: 'CAMERA'}
      ]
    },
    peripheralDomain: {
      id: 'name',
      columns: {
        'name': 'TEXT'
      },
      apiMethods: {
        GET: true,
        POST: false,
        PUT: false,
        DELETE: false
      },
      constraints: {
        UNIQUE: [['name']],
      },
      initialValues: [
        {name: 'CONTINUOUS'},
        {name: 'TRIGGERED'}
      ]
    },
    peripheralTypeDependency: {
      id: 'uid',
      columns: {
        'uid': 'TEXT',
        'name': 'TEXT',
        'peripheralType': 'TEXT',
        'ioType': 'TEXT'
      },
      apiMethods: {
        GET: true,
        POST: true,
        PUT: true,
        DELETE: true
      },
      constraints: {
        UNIQUE: [['name']],
        FOREIGN_KEYS: {
          peripheralType: 'peripheralType.name',
          ioType: 'ioType.name'
        }
      },
      initialValues: [
      ]
    },
    peripheralRule: {
      id: 'uid',
      columns: {
        uid: 'TEXT',
        peripheralId: 'TEXT',
        alwaysOn: 'INTEGER',
        alwaysOff: 'INTEGER',
        sequenceId: 'TEXT',
      },
      apiMethods: {
        GET: true,
        POST: true,
        PUT: true,
        DELETE: true
      },
      constraints: {
        FOREIGN_KEYS: {
          peripheralId: 'peripheral.uid',
          sequenceId: 'sequence.uid'
        }
      },
      initialValues: [
      ]
    },
    peripheralOverrideRule: {
      id: 'uid',
      columns: {
        'uid': 'TEXT',
        'subjectPeripheral': 'TEXT',
        'subjectPeripheralState': 'INTEGER',
        'testPeripheral': 'TEXT',
        'testPeripheralState': 'INTEGER',
      },
      apiMethods: {
        GET: true,
        POST: true,
        PUT: true,
        DELETE: true
      },
      constraints: {
      },
      initialValues: [
      ]
    },
    completePeripheral: {
      constructed: true,
      structure: {
        peripheral: {
          single: true,
          table: 'peripheral'
        },
        peripheralType: {
          single: true,
          table: 'peripheralType',
          select: {
            name: 'peripheral.peripheralType'
          }
        },
        peripheralTypeDependencies: {
          table: 'peripheralTypeDependency',
          select: {
            peripheralType: 'peripheral.peripheralType'
          }
        },
        peripheralRule: {
          single: true,
          table: 'peripheralRule',
          select: {
            peripheralId: 'peripheral.uid'
          }
        },
        peripheralOverrideRules: {
          table: 'peripheralOverrideRule',
          select: {
            subjectPeripheral: 'peripheral.uid'
          }
        },
        overrides: {
          table: 'peripheralOverrideRule',
          select: {
            testPeripheral: 'peripheral.uid'
          }
        },
        sequence: {
          single: true,
          table: 'sequence',
          select: {
            uid: 'peripheralRule.sequenceId'
          },
        },
        sequenceItems: {
          table: 'sequenceItem',
          select: {
            sequenceId: 'peripheralRule.sequenceId'
          }
        },
        gpioPins: {
          table: 'gpioPin',
          select: {
            peripheralId: 'peripheral.uid'
          }
        },
        cameras: {
          table: 'camera',
          select: {
            peripheralId: 'peripheral.uid'
          }
        }
      }
    }
  };
}

module.exports = {
  schemaFactory: schemaFactory,
};
