'use strict';
const React = require('react');
const timeParser = require('../../utils/timeParser.js');
const uuid = require('uuid');
const _ = require('lodash');
const Editable = require('../forms/editable.js');
const sequenceUtilsFactory = require('../../utils/sequenceManipulation.js');
const SequenceFactory = require('../components/Sequence.js');
const SequenceItemRowFactory = require('./SequenceItemRow');

function PeripheralFactory(api) {
  var SequenceItemRow = SequenceItemRowFactory(api);
  var Sequence = SequenceFactory(api);
  const sequenceUtils = sequenceUtilsFactory(api);
  return React.createClass({
    render: function() {
      var self = this;
      const peripheral = self.props.completeSequence.peripheral;
      const sequence = self.props.completeSequence.sequence;
      const gpioPins = self.props.completeSequence.gpioPins;
      var peripheralNameOptions = { 
        type: 'TEXT',
        inputClass: 'peripheral-name-input',
        outerClass: 'peripheral-name',
        label: '',
        current: {displayValue: peripheral.name},
        update: function(val, callback) {
          function loader(err, results) {
            self.props.refresh(callback)
          }
          api.peripheral.update({uid: peripheral.uid, name: val}, loader);
        },
      };
      return (
        <div key={self.props.completeSequence.peripheral.uid} className="peripheral">
          <div className="peripheral-content">
            <Editable.EditableValue opts={peripheralNameOptions}></Editable.EditableValue>
            <div className="peripheral-type-display"><span className="text-label peripheral-type-label">Peripheral Type: </span><span className="peripheral-type-value">{peripheral.peripheralType}</span></div>
            <div className="gpio-display"><span className="text-label gpio-label">GPIO Pin Numbers: </span><span className="sequence-type-value">{_.map(gpioPins, 'pinNumber').join(', ')}</span></div>
            <Sequence completeSequence={self.props.completeSequence} refresh={self.props.refresh}></Sequence>
            <button onClick={function() {sequenceUtils.deletePeripheralAndFreeResources(self.props.completeSequence.peripheral, self.props.refresh);}}>Delete Peripheral</button>
          </div>
        </div>
      );
    },
  });
}

module.exports = PeripheralFactory;
