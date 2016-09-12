'use strict';
const React = require('react');
const uuid = require('uuid');
const _ = require('lodash');
const sequenceUtilsFactory = require('../../utils/sequenceManipulation.js');
const SequenceItemRowFactory = require('./SequenceItemRow');

function PeripheralListFactory(api) {
  var SequenceItemRow = SequenceItemRowFactory(api);
  const sequenceUtils = sequenceUtilsFactory(api);
  return React.createClass({
    loadSequences: function() {
      api.completePeripheral.list(
        function(err, body) {
          console.log(body);
          this.setState({data: body});
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
        const sequenceItems = deepSequence.sequenceItems;
        const gpioPins = deepSequence.gpioPins;
        const sequenceItemTableRows = _.map(sequenceItems, function(sequenceItem) {
          return <SequenceItemRow key={sequenceItem.uid} sequenceItem={sequenceItem} sequenceType={sequence.sequenceType}></SequenceItemRow>;
        });
        var sequenceItemsTable;
        if (sequence.sequenceType === 'DURATION') {
          sequenceItemsTable = (
            <div key={sequence.uid}>
              <table className="highlight">
                <thead>
                  <tr>
                    <th data-field="duration">Duration (seconds)</th>
                    <th data-field="state">On / Off</th>
                  </tr>
                </thead>
                <tbody>
                  {sequenceItemTableRows}
                </tbody>
              </table>
              <button onClick={self.createSequenceItem(sequence.uid, sequenceItems)}>New Sequence Item</button>
            </div>
          );
        } else {
          sequenceItemsTable = (
            <div key={sequence.uid}>
              <table className="highlight sequence">
                <thead>
                  <tr>
                    <th data-field="start-time">Start Time</th>
                    <th data-field="end-time">End Time</th>
                    <th data-field="state">On / Off</th>
                  </tr>
                </thead>
                <tbody>
                  {sequenceItemTableRows}
                </tbody>
              </table>
              <button onClick={self.createSequenceItem(sequence.uid)}>New Sequence Item</button>
            </div>
          );
        }
        var peripheralNameField = self.renderSequenceNameField(self, peripheral);
        return (
          <div key={deepSequence.peripheral.uid} className="peripheral-card card">
            <div className="card-content peripheral-card-content black-text">
              {peripheralNameField}
              <div className="peripheral-type-display"><span className="text-label peripheral-type-label">Peripheral Type: </span><span className="peripheral-type-value">{peripheral.peripheralType}</span></div>
              <div className="sequence-type-display"><span className="text-label sequence-type-label">Sequence Type: </span><span className="sequence-type-value">{sequence.sequenceType}</span></div>
              <div className="gpio-display"><span className="text-label gpio-label">GPIO Pin Numbers: </span><span className="sequence-type-value">{_.map(gpioPins, 'pinNumber').join(', ')}</span></div>
              {sequenceItemsTable}
            </div>
          </div>
        );
      });
      return (
        <div className="peripheral-cards">
          <button onClick={this.newPeripheral}>New Peripheral</button>
          {sequenceCards}
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
    toggleEditingName: function toggleEditingName() {
      this.setState({editingName: !this.state.editingName});
    },
    renderSequenceNameField: function(self, peripheral) {
      function handleEdit(evt) {
        return self.handleEditName(peripheral, evt);
      }
      if (self.state.editingName) {
        return (
          <input
            onKeyDown={handleEdit}
            type="text"
            className="form-control"
            ref={ `title_${ peripheral.uid }` }
            name="title"
            defaultValue={ peripheral.name }
          />
        );
      } else {
        return <span className="card-title peripheral-card-title black-text" onClick={self.toggleEditingName} >{peripheral.name}</span>;
      }
    },
    handleEditName: function(peripheral, event) {
      if ( event.keyCode === 13 ) {
        let target = event.target,
          update = {};
        peripheral.name = target.value;
        var self = this;
        api.peripheral.update(peripheral, function(err, res) {
          if (err) {
            console.error(err)
          } else {
            self.toggleEditingName();
          }
        });
      }
    }
  });
}

module.exports = PeripheralListFactory;
