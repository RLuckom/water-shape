'use strict';
const React = require('react');
const timeParser = require('../../utils/timeParser.js');
const uuid = require('uuid');
const _ = require('lodash');
const Editable = require('../forms/editable.js');
const sequenceUtilsFactory = require('../../utils/sequenceManipulation.js');
const SequenceFactory = require('../components/Sequence.js');
const PeripheralFactory = require('../components/Peripheral.js');
const SequenceItemRowFactory = require('./SequenceItemRow');

function PeripheralListFactory(api) {
  var SequenceItemRow = SequenceItemRowFactory(api);
  var Sequence = SequenceFactory(api);
  var Peripheral = PeripheralFactory(api);
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
      return {data: []};
    },
    componentDidMount: function() {
      this.loadSequences();
      setInterval(this.loadSequences, this.props.pollInterval);
    },
    render: function() {
      var self = this;
      var sequenceCards = this.state.data.map(function(completeSequence) {
        return <Peripheral completeSequence={completeSequence} key={completeSequence.peripheral.uid} refresh={self.loadSequences}></Peripheral>;
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
