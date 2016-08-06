require('./scss/app.scss');
const React = require('react');
const ReactDOM = require('react-dom');
const request = require('browser-request');
const schemaFactory = require('../utils/schema').schemaFactory;
const apiFactory = require('../utils/api');

//TODO make .gitignored config file to avoid hardcoding environment-specific stuff.
const api = apiFactory(schemaFactory(()=>{}), 'http://192.168.1.118:8080/api', request);

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
        <div key={pin.pinNumber} className="gpioPin">
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
  <div className="gpioSection">
  <a className="btn-floating btn-large waves-effect waves-light red"><i className="material-icons">add</i></a>
  <h2>Raspberry Pi GPIO Scheduling Controller</h2>
  <h3>GPIOs</h3>
  <GpioList pollInterval={10000}></GpioList>
  <h3>Sequences</h3>
  <SequenceList pollInterval={10000}></SequenceList>
  </div>,
  document.getElementById('example')
);
