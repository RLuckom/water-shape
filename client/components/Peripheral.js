'use strict';
const React = require('react');
const timeParser = require('../../utils/timeParser.js');
const uuid = require('uuid');
const _ = require('lodash');
const Editable = require('../forms/editable.js');
const sequenceUtilsFactory = require('../../utils/sequenceManipulation.js');
const SequenceFactory = require('../components/Sequence.js');
const SequenceItemRowFactory = require('./SequenceItemRow');
const async = require('async');

function PeripheralFactory(dmi) {
  var SequenceItemRow = SequenceItemRowFactory(dmi);
  var Sequence = SequenceFactory(dmi);
  const sequenceUtils = sequenceUtilsFactory(dmi);
  return React.createClass({
    render: function() {
      var self = this;
      const peripheral = self.props.completeSequence.peripheral;
      const sequence = self.props.completeSequence.sequence;
      const gpioPins = self.props.completeSequence.gpioPins;
      const availablePins = self.props.completeSequence.availableGpioPins;
      const availableCameras = self.props.completeSequence.availableCameras;
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
          dmi.peripheral.update({uid: peripheral.uid, name: val}, loader);
        },
      };
      function gpioDependencyEditable(dependency, gpioPins, availablePins, peripheral, refresh) {

        function updatePin(pinNumber, callback) {
          if (pinNumber === 'None') {
            pinNumber = null;
          }
          return async.series([
            _.partial(sequenceUtils.releasePin, _.find(gpioPins, ['peripheralTypeDependency', dependency.name])),
            _.partial(sequenceUtils.assignPin, pinNumber, availablePins, dependency, peripheral),
          ], callback);
        }
        var currentPin = _.get(_.find(gpioPins, ['peripheralTypeDependency', dependency.name]), 'pinNumber', 'None');
        var pinsToInclude = [currentPin];
        if (currentPin !== 'None') {
          pinsToInclude.push('None');
        }
        var dependencyOptions = {
          type: 'ENUM',
          label: dependency.name + ':',
          options: [].concat(pinsToInclude, _.map(availablePins, 'pinNumber')),
          current: currentPin,
          onUpdate: refresh,
          update: updatePin
        };
        return <Editable.EditableValue key={dependency.uid} opts={dependencyOptions}></Editable.EditableValue>;
      }

      const dependencies = self.props.completeSequence.peripheralTypeDependencies.map(function(dependency) {
        if (['GPIO_OUTPUT', 'GPIO_INPUT'].indexOf(dependency.ioType) !== -1) {
          return gpioDependencyEditable(dependency, gpioPins, availablePins, peripheral, self.props.refresh);
        }
      });
      return (
        <div key={self.props.completeSequence.peripheral.uid} className="peripheral">
          <div className="peripheral-content">
            <Editable.EditableValue opts={peripheralNameOptions}></Editable.EditableValue>
            <div className="peripheral-type-display"><span className="text-label peripheral-type-label">Peripheral Type: </span><span className="peripheral-type-value">{peripheral.peripheralType}</span></div>
            {dependencies}
            <Sequence completeSequence={self.props.completeSequence} refresh={self.props.refresh}></Sequence>
            <button onClick={function() {sequenceUtils.deletePeripheralAndFreeResources(self.props.completeSequence.peripheral, self.props.refresh);}}>Delete Peripheral</button>
          </div>
        </div>
      );
    },
  });
}

module.exports = PeripheralFactory;
