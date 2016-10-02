'use strict';
const React = require('react');
const timeParser = require('../../utils/timeParser.js');
const uuid = require('uuid');
const _ = require('lodash');
const Editable = require('../forms/editable.js');
const sequenceUtilsFactory = require('../../utils/sequenceManipulation.js');
const SequenceItemRowFactory = require('./SequenceItemRow');

function PeripheralListFactory(api) {
  var SequenceItemRow = SequenceItemRowFactory(api);
  const sequenceUtils = sequenceUtilsFactory(api);
  return React.createClass({
    loadSequences: function(callback) {
      api.completePeripheral.list(
        function(err, body) {
          console.log(body);
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
    createSequenceItem: function(sequenceUid, sequenceItems) {
      const self = this;
      return function() {
        api.sequenceItem.save({
          sequenceId: sequenceUid,
          ordinal: sequenceItems ? _.max(_.map(sequenceItems, 'ordinal')) + 1 : null
        }, function(err, result) {
          if (err) {
            return console.error(err)
          }
          return self.loadSequences();
        });
      };
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
        const sequenceItems = sequence.sequenceType === 'TIME' ? timeParser.orderByStartTime(deepSequence.sequenceItems) : _.orderBy(deepSequence.sequenceItems, 'ordinal');;
        const gpioPins = deepSequence.gpioPins;
        const sequenceItemTableRows = _.map(sequenceItems, function(sequenceItem) {
          return <SequenceItemRow key={sequenceItem.uid} update={self.loadSequences} sequenceItem={sequenceItem} sequenceType={sequence.sequenceType}></SequenceItemRow>;
        });
        var sequenceItemsTable;
        if (sequence.sequenceType === 'DURATION') {
          sequenceItemsTable = (
            <div className="peripheral-sequence" key={sequence.uid}>
              <div className="peripheral-sequence-table">
                <div>
                  <div>
                    <div className='sequence-item-header'>Duration (seconds)</div>
                    <div className='sequence-item-header'>On / Off</div>
                  </div>
                </div>
                <div>
                  {sequenceItemTableRows}
                </div>
              </div>
              <button onClick={self.createSequenceItem(sequence.uid, sequenceItems)}>New Sequence Item</button>
            </div>
          );
        } else {
          sequenceItemsTable = (
            <div className="peripheral-sequence" key={sequence.uid}>
              <div className="peripheral-sequence-table">
                <div>
                  <div>
                    <div className='sequence-item-header'>Start Time</div>
                    <div className='sequence-item-header'>End Time</div>
                    <div className='sequence-item-header'>On / Off</div>
                  </div>
                </div>
                <div>
                  {sequenceItemTableRows}
                </div>
              </div>
              <button onClick={self.createSequenceItem(sequence.uid)}>New Sequence Item</button>
            </div>
          );
        }
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
        var peripheralTypeOptions = {
          type: 'ENUM',
          label: 'Sequence Type:',
          options: ['TIME', 'DURATION'],
          current: sequence.sequenceType,
          update: function(val, callback) {
            function loader(err, results) {
              self.loadSequences(callback)
            }
            api.sequence.update({uid: sequence.uid, sequenceType: val}, loader);
          }
        };
        return (
          <div key={deepSequence.peripheral.uid} className="peripheral">
            <div className="peripheral-content">
              <Editable.EditableValue opts={peripheralNameOptions}></Editable.EditableValue>
              <div className="peripheral-type-display"><span className="text-label peripheral-type-label">Peripheral Type: </span><span className="peripheral-type-value">{peripheral.peripheralType}</span></div>
              <div className="sequence-type-display"><Editable.EditableValue opts={peripheralTypeOptions}></Editable.EditableValue></div>
              <div className="gpio-display"><span className="text-label gpio-label">GPIO Pin Numbers: </span><span className="sequence-type-value">{_.map(gpioPins, 'pinNumber').join(', ')}</span></div>
              {sequenceItemsTable}
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
