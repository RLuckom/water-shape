'use strict';
const React = require('react');
const ReactDOM = require('react-dom');

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

module.exports = {
  Svg: Svg,
  CircleText: CircleText
};
