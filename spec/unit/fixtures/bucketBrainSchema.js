'use strict';
const _ = require('lodash');

function schemaFactory(noOpValidate) {
  return {
    sequence: {
      type: 'PERSISTED',
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
      }
    },
    pin: {
      type: 'PERSISTED',
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
      type: 'PERSISTED',
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
      type: 'PERSISTED',
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
      type: 'PERSISTED',
      id: 'pinNumber',
      columns: {
        'pinNumber': 'NUMBER', 
        'peripheralTypeDependency': 'TEXT',
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
          peripheralTypeDependency: 'peripheralTypeDependency.name',
          ioType : 'ioType.name',
          peripheralId : 'peripheral.uid'
        },
        UNIQUE: [['pinNumber']]
      },
      initialValues: [
        {pinNumber: 14, peripheralId: null},
        {pinNumber: 15, peripheralId: null},
        {pinNumber: 18, peripheralId: null},
        {pinNumber: 23, peripheralId: null},
        {pinNumber: 24, peripheralId: null},
        {pinNumber: 25, peripheralId: null},
        {pinNumber: 8, peripheralId: null},
        {pinNumber: 7, peripheralId: null},
        {pinNumber: 2, peripheralId: null},
        {pinNumber: 3, peripheralId: null},
        {pinNumber: 4, peripheralId: null},
        {pinNumber: 17, peripheralId: null},
        {pinNumber: 27, peripheralId: null},
        {pinNumber: 22, peripheralId: null},
        {pinNumber: 10, peripheralId: null},
        {pinNumber: 9, peripheralId: null},
        {pinNumber: 11, peripheralId: null}
      ]
    },
    sequenceItem: {
      type: 'PERSISTED',
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
      }
    },
    sequenceType: {
      type: 'PERSISTED',
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
      type: 'PERSISTED',
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
      type: 'PERSISTED',
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
      type: 'PERSISTED',
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
    parameterType: {
      type: 'PERSISTED',
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
        {name: 'TEXT'},
        {name: 'NUMBER'}
      ]
    },
    peripheralDomain: {
      type: 'PERSISTED',
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
    peripheralTypeParameters: {
      type: 'PERSISTED',
      id: 'uid',
      columns: {
        'uid': 'TEXT',
        'name': 'TEXT',
        'peripheralType': 'TEXT',
        'optional': 'NUMBER',
        'parameterType': 'TEXT'
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
          parameterType: 'parameterType.name'
        }
      },
      initialValues: [
      ]
    },
    peripheralTypeDependency: {
      type: 'PERSISTED',
      id: 'name',
      columns: {
        'name': 'TEXT',
        displayName: 'TEXT',
        'peripheralType': 'TEXT',
        'optional': 'NUMBER',
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
        {peripheralType: 'RELAY', displayName: 'Ground pin', name: 'ground', ioType: 'GPIO_OUTPUT', optional: 1},
        {peripheralType: 'RELAY', displayName: 'Signal pin', name: 'signal', ioType: 'GPIO_OUTPUT', optional: 0}
      ]
    },
    peripheralRule: {
      type: 'PERSISTED',
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
      type: 'PERSISTED',
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
      type: 'TREE',
      root: 'peripheral',
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
            name: {
              type: 'COMPUTED',
              key: 'peripheral.peripheralType'
            }
          }
        },
        peripheralTypeDependencies: {
          table: 'peripheralTypeDependency',
          select: {
            peripheralType: {
              type: 'COMPUTED',
              key: 'peripheral.peripheralType'
            }
          }
        },
        peripheralRule: {
          single: true,
          table: 'peripheralRule',
          select: {
            peripheralId: {key: 'peripheral.uid', type:'COMPUTED'}
          }
        },
        peripheralOverrideRules: {
          table: 'peripheralOverrideRule',
          select: {
            subjectPeripheral: {key: 'peripheral.uid', type:'COMPUTED'}
          }
        },
        overrides: {
          table: 'peripheralOverrideRule',
          select: {
            testPeripheral: {key: 'peripheral.uid', type:'COMPUTED'}
          }
        },
        sequence: {
          single: true,
          table: 'sequence',
          select: {
            uid: {key: 'peripheralRule.sequenceId', type:'COMPUTED'}
          },
        },
        sequenceItems: {
          table: 'sequenceItem',
          select: {
            sequenceId: {key: 'peripheralRule.sequenceId', type:'COMPUTED'}
          }
        },
        gpioPins: {
          table: 'gpioPin',
          select: {
            peripheralId: {key: 'peripheral.uid', type:'COMPUTED'}
          }
        },
        availableGpioPins: {
          table: 'gpioPin',
          select: {
            peripheralId: {type: 'LITERAL', value: null},
          }
        },
        cameras: {
          table: 'camera',
          select: {
            peripheralId: {key: 'peripheral.uid', type:'COMPUTED'}
          }
        }
      }
    }
  };
}

module.exports = {
  schemaFactory: schemaFactory,
};
