require('./scss/app.scss');
var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');

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
    $.ajax({
      url: 'http://192.168.1.123/sqlite3/gpio_pins',
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {data: [{pin_number: 'foo'}, {pin_number: 'bar'}]};
  },
  componentDidMount: function() {
    this.loadgpiosFromServer();
    setInterval(this.loadgpiosFromServer, this.props.pollInterval);
  },
  render: function() {
    var pinNodes = this.state.data.map(function(pin) {
      return (
        <div key={pin.pin_number} className="gpioPin">
          <span className="pinName">{pin.pin_number}</span>
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
