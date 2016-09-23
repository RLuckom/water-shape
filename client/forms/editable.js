'use strict';
const React = require('react');
const uuid = require('uuid');

var EditableValue = React.createClass({
  getInitialState: function() {
    return {editing: false};
  },
  render: function() {
    var self = this;
    if (this.state.editing) {
      return this.renderInput[this.props.opts.type](this, this.props.opts);
    } else {
      return this.renderDisplay[this.props.opts.type](this, this.props.opts);
    }
  },
  componentDidUpdate: function() {
    if (this.input) {
      this.input.focus();
    }
  },
  renderDisplay: {
    NUMBER: function(self, opts) {
      return <div><span onClick={self.toggleEditing}>{opts.label}: {opts.current.displayValue}</span></div>;
    },
    TEXT: function(self, opts) {
      return <div><span onClick={self.toggleEditing}>{opts.label}: {opts.current.displayValue}</span></div>;
    },
    ENUM: function(self, opts) {
      return <div><span onClick={self.toggleEditing}>{opts.label}: {opts.current}</span></div>;
    },
    BOOLEAN: function(self, opts) {
      function change(evt) {
        return opts.update(evt.target.checked, self.toggleEditing);
      }
      var inputId = uuid.v4();
      return (
        <div>
          <span>{opts.label}</span>
          <label className="switch" htmlFor={inputId}>
            <input type="checkbox" id={inputId} onChange={change}></input>
            <div className="slider round">
            </div>
          </label>
        </div>
      );
    }
  },
  toggleEditing: function() {
    this.setState({editing: !this.state.editing});
  },
  renderInput: {
    BOOLEAN: function(self, opts) {
      function change(evt) {
        return opts.update(evt.target.checked, self.toggleEditing);
      }
      var inputId = uuid.v4();
      return (
        <div>
          <span>{opts.label}</span>
          <label className="switch" htmlFor={inputId}>
            <input type="checkbox" id={inputId} onChange={change}></input>
            <div className="slider round">
            </div>
          </label>
        </div>
      );
    },
    NUMBER: function(self, opts) {
      function setInput(input) {
        self.input = input;
      }
      var inputId = uuid.v4();
      var numberInput = <input id={inputId} onBlur={callback} onKeyDown={keyDown} defaultValue={self.props.opts.current.displayValue} ref={setInput} type="number"></input>
      function keyDown(evt) {
        if (evt.keyCode === 13) {
          return callback()
        }
      }
      function callback() {
        return opts.update(self.input.value, self.toggleEditing);
      }
      return (
        <div className='input-field'>
          <label className="active" htmlFor={inputId}>{opts.label}: </label>
          {numberInput}
        </div>
      );
    },
    TEXT: function(self, opts) {
      function setInput(input) {
        self.input = input;
      }
      var inputId = uuid.v4();
      var numberInput = <input id={inputId} onBlur={callback} onKeyDown={keyDown} defaultValue={self.props.opts.current.displayValue} ref={setInput} type="text"></input>
      function keyDown(evt) {
        if (evt.keyCode === 13) {
          return callback()
        }
      }
      function callback() {
        return opts.update(self.input.value, self.toggleEditing);
      }
      return (
        <div className='input-field'>
          <label className="active" htmlFor={inputId}>{opts.label}: </label>
          {numberInput}
        </div>
      );
    },
    ENUM: function(self, opts) {
      var inputId = uuid.v4();
      function setInput(input) {
        self.input = input;
      }
      var options = _.map(opts.options, function(option) {
        return <option key={option} value={option}>{option}</option>
      });

      function callback(evt) {
        opts.update(evt.target.value, self.toggleEditing);
      }
      return (
        <div>
          <label htmlFor={inputId}>{opts.label}</label>
          <select defaultValue={opts.current} onBlur={callback} onChange={callback} id={inputId} ref={setInput}>
            {options}
          </select>
        </div>
      );
    }
  }
});

module.exports = {
  EditableValue: EditableValue,
  testNumOpts: {
    type: 'NUMBER',
    label: 'Duration',
    current: {displayValue: 9},
    update: function (val, callback) {console.log(val); this.current.displayValue = val; callback();}
  },
  testTextOpts: {
    type: 'TEXT',
    label: 'Name',
    current: {displayValue: 'foo'},
    update: function (val, callback) {console.log(val); this.current.displayValue = val; callback();}
  },
  testBoolOpts: {
    type: 'BOOLEAN',
    label: 'Default state',
    isChecked: true,
    update: function (val, callback) {console.log(val); this.isChecked = val; callback();}
  },
  testSelectOpts: {
    type: 'ENUM',
    label: 'Peripheral Type',
    selected: 'TRIGGERED',
    options: ['CONTINUOUS','TRIGGERED'],
    current: 'TRIGGERED',
    update: function (val, callback) {console.log(val); this.current = val; callback();}
  },
};
