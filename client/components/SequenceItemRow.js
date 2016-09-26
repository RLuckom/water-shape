'use strict';
const React = require('react');
const basicInputs = require('../forms/basicInputs');
const _ = require('lodash');
const Editable = require('../forms/editable.js');

function SequenceItemRowFactory(api) {
  return React.createClass({
    getInitialState: function() {
      return {editing: false};
    },
    render: function() {
      const sequenceItem = this.props.sequenceItem;
      const sequenceType = this.props.sequenceType;
      if (sequenceType === 'DURATION') {
        return this.renderDurationSequenceItemOrEdit(sequenceItem);
      } else {
        return this.renderTimeSequenceItemOrEdit(sequenceItem);
      }
    },
    renderDurationSequenceItemOrEdit: function(sequenceItem) {
      var durationOptions = {
        type: 'NUMBER',
        label: '',
        current: {displayValue: sequenceItem.durationSeconds},
        update: function(val, callback) {
          api.sequenceItem.update({uid: sequenceItem.uid, durationSeconds: val}, callback);
        },
      };
      var stateOptions = {
        type: 'NUMBER',
        label: '',
        current: {displayValue: sequenceItem.state},
        update: function(val, callback) {
          api.sequenceItem.update({uid: sequenceItem.uid, state: val}, callback);
        }
      };
      return (
        <tr className="sequenceItem">
          <td><Editable.EditableValue opts={durationOptions}></Editable.EditableValue></td>
          <td><Editable.EditableValue opts={stateOptions}></Editable.EditableValue></td>
        </tr>
      );
    },
    renderTimeSequenceItemOrEdit: function(sequenceItem) {
      var startTimeOptions = {
        type: 'TEXT',
        label: '',
        current: {displayValue: sequenceItem.startTime},
        update: function(val, callback) {
          api.sequenceItem.update({uid: sequenceItem.uid, startTime: val}, callback);
        }
      };
      var endTimeOptions = {
        type: 'TEXT',
        label: '',
        current: {displayValue: sequenceItem.endTime},
        update: function(val, callback) {
          api.sequenceItem.update({uid: sequenceItem.uid, endTime: val}, callback);
        }
      };
      var stateOptions = {
        type: 'NUMBER',
        label: '',
        current: {displayValue: sequenceItem.state},
        update: function(val, callback) {
          api.sequenceItem.update({uid: sequenceItem.uid, state: val}, callback);
        }
      };
      return (
        <tr className="sequenceItem">
          <td><Editable.EditableValue opts={startTimeOptions}></Editable.EditableValue></td>
          <td><Editable.EditableValue opts={endTimeOptions}></Editable.EditableValue></td>
          <td><Editable.EditableValue opts={stateOptions}></Editable.EditableValue></td>
        </tr>
      );
    }
  });
}

module.exports = SequenceItemRowFactory;
