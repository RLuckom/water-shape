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
      const sequenceItemDivs = _.map(sequenceItems, function(sequenceItem) {
        if (sequence.sequenceType === 'DURATION') {
          return (
            <div key={sequenceItem.uid} className="sequenceItem">
              <p><span className="text-label duration-label">Duration: </span><span className="duration-value">{sequenceItem.durationSeconds}</span></p>
              <p><span className="text-label state-label">State: </span><span className="state-value">{sequenceItem.state}</span></p>
            </div>
          );
        } else {
          return (
            <div key={sequenceItem.uid} className="sequenceItem">
              <p><span className="text-label start-time-label">Start Time: </span><span className="start-time-value">{sequenceItem.startTime.hour}:{sequenceItem.startTime.minute}:{sequenceItem.startTime.second}</span></p>
              <p><span className="text-label end-time-label">End Time: </span><span className="end-time-value">{sequenceItem.endTime.hour}:{sequenceItem.endTime.minute}:{sequenceItem.endTime.second}</span></p>
              <p><span className="text-label state-label">State: </span><span className="state-value">{sequenceItem.state}</span></p>
            </div>
          );
        }
      });
      return (
        <div key={deepSequence.sequence.uid} className="sequence-card card">
          <div className="card-content sequence-card-content black-text">
            <span className="card-title sequence-card-title">{sequence.name}</span>
            <span className="sequence-card-type">{sequence.sequenceType}</span>
            {sequenceItemDivs}
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
        <SequenceList></SequenceList>
      </div>
    </div>
  </div>,
  document.getElementById('example')
);
