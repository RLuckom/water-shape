'use strict';
const React = require('react');
const timeParser = require('../../utils/timeParser.js');
const uuid = require('uuid');
const _ = require('lodash');
const Editable = require('../forms/editable.js');
const sequenceUtilsFactory = require('../../utils/sequenceManipulation.js');
const SequenceFactory = require('../components/Sequence.js');
const SequenceItemRowFactory = require('./SequenceItemRow');

function PeripheralListFactory(api) {
  var SequenceItemRow = SequenceItemRowFactory(api);
  var Sequence = SequenceFactory(api);
  const sequenceUtils = sequenceUtilsFactory(api);
  return React.createClass({
    loadSequences: function(callback) {
      api.completePeripheral.list(
        function(err, body) {
          this.setState({data: body});
          if (_.isFunction(callback)) {
            callback();
          }
        }.bind(this)
      );
    },
    getInitialState: function() {
      return {data: [], editingName: false};
    },
    componentDidMount: function() {
      this.loadSequences();
      setInterval(this.loadSequences, this.props.pollInterval);
    },
    render: function() {
      var self = this;
      var sequenceCards = this.state.data.map(function(deepSequence) {
        const peripheral = deepSequence.peripheral;
        const sequence = deepSequence.sequence;
        const gpioPins = deepSequence.gpioPins;
        var peripheralNameOptions = { 
          type: 'TEXT',
          inputClass: 'peripheral-name-input',
          outerClass: 'peripheral-name',
          label: '',
          current: {displayValue: peripheral.name},
          update: function(val, callback) {
            function loader(err, results) {
              self.loadSequences(callback)
            }
            api.peripheral.update({uid: peripheral.uid, name: val}, loader);
          },
        };
        return (
          <div key={deepSequence.peripheral.uid} className="peripheral">
            <div className="peripheral-content">
              <Editable.EditableValue opts={peripheralNameOptions}></Editable.EditableValue>
              <div className="peripheral-type-display"><span className="text-label peripheral-type-label">Peripheral Type: </span><span className="peripheral-type-value">{peripheral.peripheralType}</span></div>
              <div className="gpio-display"><span className="text-label gpio-label">GPIO Pin Numbers: </span><span className="sequence-type-value">{_.map(gpioPins, 'pinNumber').join(', ')}</span></div>
              <Sequence completeSequence={deepSequence} refresh={self.loadSequences}></Sequence>
              <button onClick={function() {sequenceUtils.deletePeripheralAndFreeResources(deepSequence.peripheral, self.loadSequences);}}>Delete Peripheral</button>
            </div>
          </div>
        );
      });
      return (
        <div className="peripherals">
          {sequenceCards}
          <button onClick={this.newPeripheral}>New Peripheral</button>
        </div>
      );
    },
    newPeripheral: function newPeripheral() {
      sequenceUtils.makeOnOffSequenceAndAssignToPin(
        'New Peripheral ' + uuid.v4(),
        'RELAY', //TODO parameterize
        0,
        0,
        3,
        0,
        this.loadSequences
      );
    },
  });
}

module.exports = PeripheralListFactory;
