'use strict';
const React = require('react');
const timeParser = require('../../utils/timeParser.js');
const uuid = require('uuid');
const _ = require('lodash');
const Editable = require('../forms/editable.js');
const SequenceItemRowFactory = require('./SequenceItemRow');

function SequenceFactory(api) {
  var SequenceItemRow = SequenceItemRowFactory(api);
  return React.createClass({
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
          return self.props.refresh();
        });
      };
    },
    render: function() {
      var self = this;
      const peripheral = self.props.completeSequence.peripheral;
      const sequence = self.props.completeSequence.sequence;
      const sequenceItems = sequence.sequenceType === 'TIME' ? timeParser.orderByStartTime(self.props.completeSequence.sequenceItems) : _.orderBy(self.props.completeSequence.sequenceItems, 'ordinal');;
      const gpioPins = self.props.completeSequence.gpioPins;
      const sequenceItemTableRows = _.map(sequenceItems, function(sequenceItem) {
        return <SequenceItemRow key={sequenceItem.uid} refresh={self.props.refresh} sequenceItem={sequenceItem} sequenceType={sequence.sequenceType}></SequenceItemRow>;
      });
      var sequenceTypeOptions = {
        type: 'ENUM',
        label: 'Sequence Type:',
        options: ['TIME', 'DURATION'],
        current: sequence.sequenceType,
        onUpdate: self.props.refresh,
        update: function(val, callback) {
          api.sequence.update({uid: sequence.uid, sequenceType: val}, callback);
        }
      };
      if (sequence.sequenceType === 'DURATION') {
        return (
          <div className="peripheral-sequence" key={sequence.uid}>
            <div className="sequence-type-display"><Editable.EditableValue opts={sequenceTypeOptions}></Editable.EditableValue></div>
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
        return (
          <div className="peripheral-sequence" key={sequence.uid}>
            <div className="sequence-type-display"><Editable.EditableValue opts={sequenceTypeOptions}></Editable.EditableValue></div>
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
            <button id="new-sequence" onClick={self.createSequenceItem(sequence.uid)}>New Sequence Item</button>
          </div>
        );
      }
    },
  });
}

module.exports = SequenceFactory;
