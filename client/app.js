require('./scss/app.scss');
var React = require('react');
var ReactDOM = require('react-dom');
var request = require('browser-request');

var GpioList = React.createClass({
  loadgpiosFromServer: function() {
    request({
      url: 'http://192.168.1.123/api/gpioPins',
      json:true},
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
    request({
      url: 'http://192.168.1.123/api/sequences',
      json:true},
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
      return (
        <div key={sequence.uid} className="sequence">
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
  <h3>GPIOs</h3>
  <GpioList pollInterval={10000}></GpioList>
  <h3>Sequences</h3>
  <SequenceList pollInterval={10000}></SequenceList>
  </div>,
  document.getElementById('example')
);
