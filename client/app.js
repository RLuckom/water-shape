require('./scss/app.scss');
const React = require('react');
const ReactDOM = require('react-dom');
const request = require('browser-request');
const async = require('async');
const schemaFactory = require('../schema/schema').schemaFactory;
const apiFactory = require('../water-shape/api/request-adapter');
const sequenceUtils = require('../utils/sequenceManipulation.js');
const _ = require('lodash');
const uuid = require('uuid');


//TODO make .gitignored config file to avoid hardcoding environment-specific stuff.
const api = apiFactory(schemaFactory(()=>{}), window.location.href + 'api', request);
window.sequenceUtils = sequenceUtils(api);

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

var SequenceList = React.createClass({
  loadSequencesFromServer: function() {
    api.sequences.get(
      function(err, resp, body) {
        this.setState({data: body});
      }.bind(this)
    );
  },
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    this.loadSequencesFromServer();
    setInterval(this.loadgpiosFromServer, this.props.pollInterval);
  },
  render: function() {
    var sequences = this.state.data.map(function(sequence) {
      function handleClick(seq) {
        console.log(`hello ${sequence.name}`);
      }
      var self = this;
      return (
        <div key={sequence.uid} className="sequence" onClick={handleClick}>
          <span className="sequenceName">{sequence.name}</span>
        </div>
      );
    });
    return (
      <div className="sequenceList">
        {sequences}
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
      </div>
    </div>
  </div>,
  document.getElementById('example')
);
