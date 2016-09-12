'use strict';
const React = require('react');
const basicInputs = require('../forms/basicInputs');
const _ = require('lodash');

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
        sequenceItem.endTime = sequenceItem.endTime ? JSON.parse(sequenceItem.endTime) : {hour: null, minute: null, second: null};
        sequenceItem.startTime = sequenceItem.startTime ? JSON.parse(sequenceItem.startTime) : {hour: null, minute: null, second: null};
        return this.renderTimeSequenceItemOrEdit(sequenceItem);
      }
    },
    renderDurationSequenceItemOrEdit: function(sequenceItem) {
      var self = this;
      function setDurationSeconds(evt) {
        if ( evt.keyCode === 13 ) {
          let target = evt.target,
            update = {};

          self.props.sequenceItem.durationSeconds = target.value;
          api.sequenceItem.update(self.props.sequenceItem, function(err, res) {
            if (err) {
              console.error(err)
            } else {
              self.toggleEditing();
            }
          });
        }
      }
      function setState(evt) {
        if ( evt.keyCode === 13 ) {
          let target = evt.target,
            update = {};

          self.props.sequenceItem.state = target.value;
          api.sequenceItem.update(self.props.sequenceItem, function(err, res) {
            if (err) {
              console.error(err)
            } else {
              self.toggleEditing();
            }
          });
        }
      }
      if (this.state.editing) {
        return (
          <tr className="sequenceItem">
            <td><basicInputs.NumberInput callback={setDurationSeconds}></basicInputs.NumberInput></td>
            <td><basicInputs.SelectNumber from={0} to={2} callback={setState} id={sequenceItem.uid + 'setState'} label="State"></basicInputs.SelectNumber></td>
          </tr>
        );
      } else {
        return (
          <tr className="sequenceItem" onClick={this.toggleEditing}>
            <td>{sequenceItem.durationSeconds}</td>
            <td>{sequenceItem.state === '1' ? 'ON' : 'OFF'}</td>
          </tr>
        );
      }
    },
    toggleEditing: function() {
      this.setState({editing: !this.state.editing});
    },
    renderTimeSequenceItemOrEdit: function(sequenceItem) {
      var self = this;
      function setState(evt) {
        if ( evt.keyCode === 13 ) {
          let target = evt.target,
            update = {};

          self.props.sequenceItem.state = target.value;
          api.sequenceItem.update(self.props.sequenceItem, function(err, res) {
            if (err) {
              console.error(err)
            } else {
              self.toggleEditing();
            }
          });
        }
      }
      function setTime(accessor) {
        return function(evt) {
          if ( evt.keyCode === 13 ) {
            let target = evt.target,
              update = {};

            _.set(self.props.sequenceItem, accessor, target.value);
            self.props.sequenceItem.startTime = JSON.stringify(self.props.sequenceItem.startTime);
            self.props.sequenceItem.endTime = JSON.stringify(self.props.sequenceItem.endTime);

            api.sequenceItem.update(self.props.sequenceItem, function(err, res) {
              if (err) {
                console.error(err)
              } else {
                self.toggleEditing();
              }
            });
          }
        }
      }
      if (this.state.editing) {
        return (
          <tr className="sequenceItem">
            <td><basicInputs.SelectNumber from={0} to={24} callback={setTime('startTime.hour')} id={sequenceItem.uid + 'startTime.hour'} label="startTime.hour"></basicInputs.SelectNumber></td>
            <td><basicInputs.SelectNumber from={0} to={60} callback={setTime('startTime.minute')} id={sequenceItem.uid + 'startTime.minute'} label="startTime.minute"></basicInputs.SelectNumber></td>
            <td><basicInputs.SelectNumber from={0} to={60} callback={setTime('startTime.second')} id={sequenceItem.uid + 'startTime.second'} label="startTime.second"></basicInputs.SelectNumber></td>
            <td><basicInputs.SelectNumber from={0} to={24} callback={setTime('endTime.hour')} id={sequenceItem.uid + 'endTime-hour'} label="endTime.hour"></basicInputs.SelectNumber></td>
            <td><basicInputs.SelectNumber from={0} to={60} callback={setTime('endTime.minute')} id={sequenceItem.uid + 'endTime-minute'} label="endTime.minute"></basicInputs.SelectNumber></td>
            <td><basicInputs.SelectNumber from={0} to={60} callback={setTime('endTime.second')} id={sequenceItem.uid + 'endTime-second'} label="endTime.second"></basicInputs.SelectNumber></td>
            <td><basicInputs.SelectNumber from={0} to={2} id={sequenceItem.uid + 'setState'} label="state"callback={setState}></basicInputs.SelectNumber></td>
          </tr>
        );
      } else {
        return (
          <tr className="sequenceItem" onClick={this.toggleEditing}>
            <td>{sequenceItem.startTime ? `${sequenceItem.startTime.hour}:${sequenceItem.startTime.minute}:${sequenceItem.startTime.second}` : ''}</td>
            <td>{sequenceItem.endTime ? `${sequenceItem.endTime.hour}:${sequenceItem.endTime.minute}:${sequenceItem.endTime.second}` : ''}</td>
            <td>{sequenceItem.state === '1' ? 'ON' : 'OFF'}</td>
          </tr>
        );
      }
    }
  });
}

module.exports = SequenceItemRowFactory;
