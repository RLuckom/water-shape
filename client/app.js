require('./scss/app.scss');
const React = require('react');
const ReactDOM = require('react-dom');
const request = require('browser-request');
const async = require('async');
const schemaFactory = require('../schema/schema').schemaFactory;
const apiFactory = require('../water-shape/api/request-adapter');
const sequenceUtilsFactory = require('../utils/sequenceManipulation.js');
const _ = require('lodash');
const uuid = require('uuid');


//TODO make .gitignored config file to avoid hardcoding environment-specific stuff.
const api = apiFactory(schemaFactory(()=>{}), window.location.href + 'api', request);
const sequenceUtils = sequenceUtilsFactory(api);

var Svg = React.createClass({
  render: function() {
    return (
      <svg width={this.props.width} height={this.props.height}>{this.props.children}</svg>
    );
  }
});


var CircleText = React.createClass({
  render: function() {
    return (
      <g>
        <circle cx="50%" cy="50%" r="25"></circle>
        <text x="50%" y="50%" textAnchor="middle" strokeWidth="2px">{this.props.text}</text>
      </g>
    );
  }
}); 

var GpioList = React.createClass({
  loadgpiosFromServer: function() {
    api.gpioPins.get(
      function(err, resp, body) {
        this.setState({data: body});
      }.bind(this)
    );
  },
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    this.loadgpiosFromServer();
    setInterval(this.loadgpiosFromServer, this.props.pollInterval);
  },
  render: function() {
    var pinNodes = this.state.data.map(function(pin) {
      return (
        <div key={pin.uid} className="gpioPin">
          <span className="pinName">{pin.pinNumber}</span>
        </div>
      );
    });
    return (
      <div className="gpioList">
        {pinNodes}
      </div>
    );
  }
});

var SequenceItemRow = React.createClass({
  render: function() {
    const sequenceItem = this.props.sequenceItem;
    const sequenceType = this.props.sequenceType;
    if (sequenceType === 'DURATION') {
      return (
        <tr key={sequenceItem.uid} className="sequenceItem">
          <td>{sequenceItem.durationSeconds}</td>
          <td>{sequenceItem.state === '1' ? 'ON' : 'OFF'}</td>
        </tr>
      );
    } else {
      return (
        <tr key={sequenceItem.uid} className="sequenceItem">
          <td>{sequenceItem.startTime.hour}:{sequenceItem.startTime.minute}:{sequenceItem.startTime.second}</td>
          <td>{sequenceItem.endTime.hour}:{sequenceItem.endTime.minute}:{sequenceItem.endTime.second}</td>
          <td>{sequenceItem.state === '1' ? 'ON' : 'OFF'}</td>
        </tr>
      );
    }
  }
});

var SequenceList = React.createClass({
  loadSequences: function() {
    sequenceUtils.getSequencesWithItemsAndPins(
      function(err, body) {
        this.setState({data: body});
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
    var sequenceCards = this.state.data.map(function(deepSequence) {
      const sequence = deepSequence.sequence;
      const sequenceItems = deepSequence.sequenceItems;
      const gpioPins = deepSequence.gpioPins;
      const sequenceItemTableRows = _.map(sequenceItems, function(sequenceItem) {
        if (sequence.sequenceType === 'DURATION') {
          return (
            <tr key={sequenceItem.uid} className="sequenceItem">
              <td>{sequenceItem.durationSeconds}</td>
              <td>{sequenceItem.state === '1' ? 'ON' : 'OFF'}</td>
            </tr>
          );
        } else {
          return (
            <tr key={sequenceItem.uid} className="sequenceItem">
              <td>{sequenceItem.startTime.hour}:{sequenceItem.startTime.minute}:{sequenceItem.startTime.second}</td>
              <td>{sequenceItem.endTime.hour}:{sequenceItem.endTime.minute}:{sequenceItem.endTime.second}</td>
              <td>{sequenceItem.state === '1' ? 'ON' : 'OFF'}</td>
            </tr>
          );
        }
      });
      var sequenceItemsTable;
      if (sequence.sequenceType === 'DURATION') {
        sequenceItemsTable = (
          <table key={sequence.uid} className="highlight">
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
        );
      } else {
        sequenceItemsTable = (
          <table key={sequence.uid} className="highlight sequence">
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
        );
      }
      return (
        <div key={deepSequence.sequence.uid} className="sequence-card card">
          <div className="card-content sequence-card-content black-text">
            <span className="card-title sequence-card-title black-text">{sequence.name}</span>
            <div className="sequence-type-display"><span className="text-label sequence-type-label">Sequence Type: </span><span className="sequence-type-value">{sequence.sequenceType}</span></div>
            <div className="gpio-display"><span className="text-label gpio-label">GPIO Pin Numbers: </span><span className="sequence-type-value">{_.map(gpioPins, 'pinNumber').join(', ')}</span></div>
            {sequenceItemsTable}
          </div>
        </div>
      );
    });
    return (
      <div className="sequence-cards">
        {sequenceCards}
      </div>
    );
  }
});

var PinList = React.createClass({
  loadPinsFromServer: function() {
    api.pins.get(
      function(err, resp, body) {
        this.setState({data: body});
      }.bind(this)
    );
  },
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    this.loadPinsFromServer();
    setInterval(this.loadPinsFromServer, this.props.pollInterval);
  },
  render: function() {
    var pinNodes = this.state.data.map(function(pin) {
      return (
        <div key={pin.uid} className="pin">
          <div className="pinRow">{pin.row}</div>
          <div className="pinColumn">{pin.column}</div>
        </div>
      );
    });
    return (
      <div className="pin">
        {pinNodes}
      </div>
    );
  }
});

ReactDOM.render(
  <div className="app">
    <div className="header row">
      <div className="header col s12">
        <h2>Raspberry Pi GPIO Scheduling Controller</h2>
      </div>
    </div>
    <div className="body row">
      <div className="body col s12">
        <SequenceList pollInterval="20000"></SequenceList>
      </div>
    </div>
  </div>,
  document.getElementById('example')
);
