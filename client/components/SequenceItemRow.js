'use strict';
const React = require('react');
const _ = require('lodash');
const Editable = require('../forms/editable.js');

function SequenceItemRowFactory(api) {
  return React.createClass({
    getInitialState: function() {
      return {};
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
    onError: function(err) {
      var errorText;
      if (_.isString(err)) {
        errorText = err;
      } else if (_.has(err, 'message')) {
        errorText = err.message;
      }
      this.setState({
        errorText: errorText
      });
    },
    deleteSequenceItem: function() {
      api.sequenceItem.delete(this.props.sequenceItem, this.props.refresh);
    },
    renderDurationSequenceItemOrEdit: function(sequenceItem) {
      var self = this;
      var durationOptions = {
        type: 'NUMBER',
        inputClass: 'sequence-item-table-cell-input',
        outerClass: 'sequence-item-table-cell',
        inputLabelClass: 'hide',
        label: '',
        current: {displayValue: sequenceItem.durationSeconds},
        onError: self.onError,
        onUpdate: self.props.refresh,
        update: function(val, callback) {
          api.sequenceItem.save(_.merge(_.cloneDeep(sequenceItem), {durationSeconds: val}), callback);
        },
      };
      var stateOptions = {
        type: 'NUMBER',
        inputClass: 'sequence-item-table-cell-input',
        outerClass: 'sequence-item-table-cell',
        label: '',
        inputLabelClass: 'hide',
        onUpdate: self.props.refresh,
        current: {displayValue: sequenceItem.state},
        onError: self.onError,
        update: function(val, callback) {
          api.sequenceItem.save(_.merge(_.cloneDeep(sequenceItem), {state: val}), callback);
        }
      };
      return (
        <div className="sequence-item">
          <div className="sequence-item-inputs">
            <Editable.EditableValue opts={durationOptions}></Editable.EditableValue>
            <Editable.EditableValue opts={stateOptions}></Editable.EditableValue>
            <button className="btn" onClick={this.deleteSequenceItem}>Delete</button>
          </div>
          <div className="error">
            {self.state.errorText}
          </div>
        </div>
      );
    },
    renderTimeSequenceItemOrEdit: function(sequenceItem) {
      var self = this;
      var startTimeOptions = {
        type: 'TEXT',
        inputClass: 'sequence-item-table-cell-input',
        outerClass: 'sequence-item-table-cell',
        label: '',
        inputLabelClass: 'hide',
        current: {displayValue: sequenceItem.startTime},
        onUpdate: self.props.refresh,
        onError: self.onError,
        update: function(val, callback) {
          api.sequenceItem.save(_.merge(_.cloneDeep(sequenceItem), {startTime: val}), callback);
        }
      };
      var endTimeOptions = {
        type: 'TEXT',
        inputClass: 'sequence-item-table-cell-input',
        outerClass: 'sequence-item-table-cell',
        label: '',
        inputLabelClass: 'hide',
        current: {displayValue: sequenceItem.endTime},
        onError: self.onError,
        onUpdate: self.props.refresh,
        update: function(val, callback) {
          api.sequenceItem.save(_.merge(_.cloneDeep(sequenceItem), {endTime: val}), callback);
        }
      };
      var stateOptions = {
        type: 'NUMBER',
        inputClass: 'sequence-item-table-cell-input',
        outerClass: 'sequence-item-table-cell',
        label: '',
        inputLabelClass: 'hide',
        current: {displayValue: sequenceItem.state},
        onUpdate: self.props.refresh,
        onError: self.onError,
        update: function(val, callback) {
          api.sequenceItem.save(_.merge(_.cloneDeep(sequenceItem), {state: val}), callback);
        }
      };
      return (
        <div className="sequence-item">
          <div className="sequence-item-inputs">
            <Editable.EditableValue opts={startTimeOptions}></Editable.EditableValue>
            <Editable.EditableValue opts={endTimeOptions}></Editable.EditableValue>
            <Editable.EditableValue opts={stateOptions}></Editable.EditableValue>
            <button className="btn" onClick={this.deleteSequenceItem}>Delete</button>
          </div>
          <div className="error">
            {this.state.errorText}
          </div>
        </div>
      );
    }
  });
}

module.exports = SequenceItemRowFactory;
