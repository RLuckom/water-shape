'use strict';
const React = require('react');

var SelectNumber = React.createClass({
  render: function() {
    var label = this.props.label;
    var id = this.props.id;
    var from = this.props.from;
    var to = this.props.to;
    var callback = this.props.callback;
    function validate(n) {
      return _.inRange(n, from, to);
    }
    return <div>
      <input type="number" id={id} onKeyDown={callback}></input>
      <label htmlFor={id}>{label}</label>
    </div>
  }
});

var NumberInput = React.createClass({
  render: function() {
    var callback = this.props.callback;
    return <input type="number" onKeyDown={callback}></input>;
  }
});

module.exports = {
  SelectNumber: SelectNumber,
  NumberInput: NumberInput
};
