require('./scss/app.scss');
var React = require('react');
var ReactDOM = require('react-dom');
var request = require('browser-request');

var Gpios = React.createClass({
  getInitialState: function() {
    return [];
  },
  handleAuthorChange: function(e) {
    this.setState({author: e.target.value});
  },
  handleTextChange: function(e) {
    this.setState({text: e.target.value});
  },
  render: function() {
    return (
      <div className="Gpios"></div>
    );
  }
});

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
    return {data: [{pinNumber: 'foo'}, {pinNumber: 'bar'}]};
  },
  componentDidMount: function() {
    this.loadgpiosFromServer();
    setInterval(this.loadgpiosFromServer, this.props.pollInterval);
  },
  render: function() {
    var pinNodes = this.state.data.map(function(pin) {
      return (
        <div key={pin.pin_number} className="gpioPin">
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

ReactDOM.render(
  <GpioList pollInterval={1000}></GpioList>,
  document.getElementById('example')
);
