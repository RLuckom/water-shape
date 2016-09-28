'use strict';
const React = require('react');
const uuid = require('uuid');
const timeParser = require('../../utils/timeParser.js');

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
      return <div className={`${opts.outerClass}`} onClick={self.toggleEditing} ><span className={`${opts.displayTextClass}`}>{opts.label} {opts.current.displayValue}</span></div>;
    },
    TEXT: function(self, opts) {
      return <div onClick={self.toggleEditing} className={`${opts.outerClass}`}><span className={`${opts.displayTextClass}`}>{opts.label} {opts.current.displayValue}</span></div>;
    },
    ENUM: function(self, opts) {
      return <div className={`${opts.outerClass}`} onClick={self.toggleEditing}><span className={`${opts.displayTextClass}`}>{opts.label} {opts.current}</span></div>;
    },
    BOOLEAN_SWITCH: function(self, opts) {
      function change(evt) {
        return opts.update(evt.target.checked, self.handleUpdate(self));
      }
      var inputId = uuid.v4();
      return (
        <div className={`${opts.outerClass}`}>
          <span className={`${opts.inputLabelClass}`}>{opts.label}</span>
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
  handleUpdate: function(self) {
    return function(err, result) {
      console.log(err, result);
      var errorText, errorVisible, editing;
      if (err) {
        editing = self.state.editing;
        errorVisible = true;
        if (_.isString(err)) {
          errorText = err;
        } else if (_.has(err, 'message')) {
          errorText = err.message;
        }
        self.setState({
          errorText: errorText,
          errorVisible: errorVisible
        });
      } else {
        editing = !self.state.editing;
      }
      self.setState({
        errorText: errorText,
        editing: editing,
        errorVisible: errorVisible
      });
    };
  },
  renderInput: {
    BOOLEAN_SWITCH: function(self, opts) {
      function change(evt) {
        return opts.update(evt.target.checked, self.handleUpdate(self));
      }
      var inputId = uuid.v4();
      return (
        <div className={`${opts.outerClass}`}>
          <span className={`${opts.inputLabelClass}`}>{opts.label}</span>
          <label className="switch" htmlFor={inputId}>
            <input type="checkbox" id={inputId} onChange={change}></input>
            <div className="slider round">
            </div>
          </label>
          <div className={`input-error ${self.state.errorVisible === true ? 'visible' : 'invisible'} ${opts.errorDivClass}`}>
            <span className={`${opts.errorTextClass}`} >{self.state.errorText}</span>
          </div>
        </div>
      );
    },
    NUMBER: function(self, opts) {
      function setInput(input) {
        self.input = input;
      }
      var inputId = uuid.v4();
      var numberInput = <input className={opts.inputClass} id={inputId} onBlur={callback} onKeyDown={keyDown} defaultValue={self.props.opts.current.displayValue} ref={setInput} type="number"></input>
      function keyDown(evt) {
        if (evt.keyCode === 13) {
          return callback()
        }
      }
      function callback() {
        try {
          return opts.update(parseInt(self.input.value), self.handleUpdate(self));
        } catch(err) {
          console.error(err);
        }
      }
      return (
        <div className={`${opts.outerClass}`}>
          <label className={`${opts.inputLabelClass}`} htmlFor={inputId}>{opts.label}</label>
          {numberInput}
          <div className={`input-error ${self.state.errorVisible === true ? 'visible' : 'invisible'} ${opts.errorDivClass}`}>
            <span className={`${opts.errorTextClass}`} >{self.state.errorText}</span>
          </div>
        </div>
      );
    },
    TEXT: function(self, opts) {
      function setInput(input) {
        self.input = input;
      }
      var inputId = uuid.v4();
      var numberInput = <input id={inputId} className={opts.inputClass} onBlur={callback} onKeyDown={keyDown} defaultValue={self.props.opts.current.displayValue} ref={setInput} type="text"></input>
      function keyDown(evt) {
        if (evt.keyCode === 13) {
          return callback()
        }
      }
      function callback() {
        return opts.update(self.input.value, self.handleUpdate(self));
      }
      return (
        <div className={`${opts.outerClass}`}>
          <label className={`${opts.inputLabelClass}`} htmlFor={inputId}>{opts.label}</label>
          {numberInput}
          <div className={`input-error ${self.state.errorVisible === true ? 'visible' : 'invisible'} ${opts.errorDivClass}`}>
            <span className={`${opts.errorTextClass}`} >{self.state.errorText}</span>
          </div>
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
        opts.update(evt.target.value, self.handleUpdate);
      }
      return (
        <div className={`${opts.outerClass}`}>
          <label className={`${opts.inputLabelClass}`} htmlFor={inputId}>{opts.label}</label>
          <select defaultValue={opts.current} onBlur={self.toggleEditing} onChange={callback} id={inputId} ref={setInput}>
            {options}
          </select>
          <div className={`input-error ${self.state.errorVisible === true ? 'visible' : 'invisible'} ${opts.errorDivClass}`}>
            <span className={`${opts.errorTextClass}`} >{self.state.errorText}</span>
          </div>
        </div>
      );
    }
  }
});

module.exports = {
  EditableValue: EditableValue,
  testNumOpts: {
    inputLabelClass: 'active',
    type: 'NUMBER',
    label: 'Duration',
    current: {displayValue: 9},
    update: function (val, callback) {console.log(val); this.current.displayValue = val; callback();}
  },
  testTextOpts: {
    inputLabelClass: 'active',
    type: 'TEXT',
    label: 'Start time:',
    current: {displayValue: '12:34:56PM'},
    update: function (val, callback) {
      var time;
      try {
        time = timeParser.parseTime(val);
        this.current.displayValue = val;
      } catch (err) {
        return callback(err);
      }
      return callback();
    }
  },
  testBoolOpts: {
    inputLabelClass: 'active',
    type: 'BOOLEAN_SWITCH',
    label: 'Default state',
    isChecked: true,
    update: function (val, callback) {console.log(val); this.isChecked = val; callback();}
  },
  testSelectOpts: {
    inputLabelClass: 'active',
    outerClass: '',
    displayTextClass: '',
    errorTextClass: '',
    type: 'ENUM',
    label: 'Peripheral Type',
    selected: 'TRIGGERED',
    options: ['CONTINUOUS','TRIGGERED'],
    current: 'TRIGGERED',
    update: function (val, callback) {console.log(val); this.current = val; callback();}
  },
};
