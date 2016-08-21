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
    api.gpioPin.get(
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
    return <input type="number" validate={_.isNumber} onKeyDown={callback}></input>;
  }
});

var SequenceItemRow = React.createClass({
  getInitialState: function() {
    return {editing: false};
  },
  render: function() {
    const sequenceItem = this.props.sequenceItem;
    const sequenceType = this.props.sequenceType;
    if (sequenceType === 'DURATION') {
      return this.renderDurationSequenceItemOrEdit(sequenceItem);
    } else {
      return this.renderTimeSequenceItemOrEdit(sequenceItem);
    }
  },
  renderDurationSequenceItemOrEdit: function(sequenceItem) {
    var self = this;
    function setDurationSeconds(evt) {
      if ( evt.keyCode === 13 ) {
        let target = evt.target,
          update = {};

        self.props.sequenceItem.durationSeconds = target.value;
        api.sequenceItems.update(self.props.sequenceItem, function(err, res) {
          if (err) {
            console.error(err)
          } else {
            console.log('successfully updated');
            console.log(self.props.sequenceItem);
            self.toggleEditing();
          }
        });
      }
    }
    function setState(evt) {
      if ( evt.keyCode === 13 ) {
        let target = evt.target,
          update = {};

        self.props.sequenceItem.state = target.value;
        console.log(target);
        api.sequenceItems.update(self.props.sequenceItem, function(err, res) {
          if (err) {
            console.error(err)
          } else {
            console.log('successfully updated');
            console.log(self.props.sequenceItem);
            self.toggleEditing();
          }
        });
      }
    }
    if (this.state.editing) {
      return (
        <tr className="sequenceItem">
          <td><NumberInput callback={setDurationSeconds}></NumberInput></td>
          <td><SelectNumber from={0} to={2} callback={setState} id={sequenceItem.uid + 'setState'} label="State"></SelectNumber></td>
        </tr>
      );
    } else {
      return (
        <tr className="sequenceItem" onClick={this.toggleEditing}>
          <td>{sequenceItem.durationSeconds}</td>
          <td>{sequenceItem.state === '1' ? 'ON' : 'OFF'}</td>
        </tr>
      );
    }
  },
  toggleEditing: function() {
    this.setState({editing: !this.state.editing});
  },
  renderTimeSequenceItemOrEdit: function(sequenceItem) {
    var self = this;
    function setState(evt) {
      if ( evt.keyCode === 13 ) {
        let target = evt.target,
          update = {};

        self.props.sequenceItem.state = target.value;
        api.sequenceItems.update(self.props.sequenceItem, function(err, res) {
          if (err) {
            console.error(err)
          } else {
            console.log('successfully updated');
            console.log(self.props.sequenceItem);
            self.toggleEditing();
          }
        });
      }
    }
    function setTime(accessor) {
      return function(evt) {
        if ( evt.keyCode === 13 ) {
          let target = evt.target,
            update = {};
          console.log(target);
          console.log(evt);

          _.set(self.props.sequenceItem, accessor, target.value);
          console.log(self.props.sequenceItem);
          self.props.sequenceItem.startTime = JSON.stringify(self.props.sequenceItem.startTime);
          self.props.sequenceItem.endTime = JSON.stringify(self.props.sequenceItem.endTime);

          api.sequenceItems.update(self.props.sequenceItem, function(err, res) {
            if (err) {
              console.error(err)
            } else {
              console.log('successfully updated');
              console.log(self.props.sequenceItem);
              self.toggleEditing();
            }
          });
        }
      }
    }
    if (this.state.editing) {
      return (
        <tr className="sequenceItem">
          <td><SelectNumber from={0} to={24} callback={setTime('startTime.hour')} id={sequenceItem.uid + 'startTime.hour'} label="startTime.hour"></SelectNumber></td>
          <td><SelectNumber from={0} to={60} callback={setTime('startTime.minute')} id={sequenceItem.uid + 'startTime.minute'} label="startTime.minute"></SelectNumber></td>
          <td><SelectNumber from={0} to={60} callback={setTime('startTime.second')} id={sequenceItem.uid + 'startTime.second'} label="startTime.second"></SelectNumber></td>
          <td><SelectNumber from={0} to={24} callback={setTime('endTime.hour')} id={sequenceItem.uid + 'endTime-hour'} label="endTime.hour"></SelectNumber></td>
          <td><SelectNumber from={0} to={60} callback={setTime('endTime.minute')} id={sequenceItem.uid + 'endTime-minute'} label="endTime.minute"></SelectNumber></td>
          <td><SelectNumber from={0} to={60} callback={setTime('endTime.second')} id={sequenceItem.uid + 'endTime-second'} label="endTime.second"></SelectNumber></td>
          <td><SelectNumber from={0} to={2} id={sequenceItem.uid + 'setState'} label="state"callback={setState}></SelectNumber></td>
        </tr>
      );
    } else {
      return (
        <tr className="sequenceItem" onClick={this.toggleEditing}>
          <td>{sequenceItem.startTime.hour}:{sequenceItem.startTime.minute}:{sequenceItem.startTime.second}</td>
          <td>{sequenceItem.endTime.hour}:{sequenceItem.endTime.minute}:{sequenceItem.endTime.second}</td>
          <td>{sequenceItem.state === '1' ? 'ON' : 'OFF'}</td>
        </tr>
      );
    }
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
    return {data: [], editingName: false};
  },
  componentDidMount: function() {
    this.loadSequences();
    setInterval(this.loadSequences, this.props.pollInterval);
  },
  render: function() {
    var self = this;
    var sequenceCards = this.state.data.map(function(deepSequence) {
      const sequence = deepSequence.sequence;
      const sequenceItems = deepSequence.sequenceItems;
      const gpioPins = deepSequence.gpioPins;
      const sequenceItemTableRows = _.map(sequenceItems, function(sequenceItem) {
        return <SequenceItemRow key={sequenceItem.uid} sequenceItem={sequenceItem} sequenceType={sequence.sequenceType}></SequenceItemRow>;
      });
      var sequenceItemsTable;
      if (sequence.sequenceType === 'DURATION') {
        sequenceItemsTable = (
          <table key={sequence.uid} className="highlight">
            <thead>
              <tr>
                <th data-field="duration">Duration (seconds)</th>
                <th data-field="state">On / Off</th>
              </tr>
            </thead>
            <tbody>
              {sequenceItemTableRows}
            </tbody>
          </table>
        );
      } else {
        sequenceItemsTable = (
          <table key={sequence.uid} className="highlight sequence">
            <thead>
              <tr>
                <th data-field="start-time">Start Time</th>
                <th data-field="end-time">End Time</th>
                <th data-field="state">On / Off</th>
              </tr>
            </thead>
            <tbody>
              {sequenceItemTableRows}
            </tbody>
          </table>
        );
      }
      var sequenceNameField = self.renderSequenceNameField(self, sequence);
      return (
        <div key={deepSequence.sequence.uid} className="sequence-card card">
          <div className="card-content sequence-card-content black-text">
            {sequenceNameField}
            <div className="sequence-type-display"><span className="text-label sequence-type-label">Sequence Type: </span><span className="sequence-type-value">{sequence.sequenceType}</span></div>
            <div className="gpio-display"><span className="text-label gpio-label">GPIO Pin Numbers: </span><span className="sequence-type-value">{_.map(gpioPins, 'pinNumber').join(', ')}</span></div>
            {sequenceItemsTable}
          </div>
        </div>
      );
    });
    return (
      <div className="sequence-cards">
        {sequenceCards}
      </div>
    );
  },
  toggleEditingName: function toggleEditingName() {
    this.setState({editingName: !this.state.editingName});
  },
	renderSequenceNameField: function(self, sequence) {
    function handleEdit(evt) {
      return self.handleEditName(sequence, evt);
    }
		if (self.state.editingName) {
			return (
				<input
					onKeyDown={handleEdit}
					type="text"
					className="form-control"
					ref={ `title_${ sequence.uid }` }
					name="title"
					defaultValue={ sequence.name }
				/>
			);
		} else {
      return <span className="card-title sequence-card-title black-text" onClick={self.toggleEditingName} >{sequence.name}</span>;
    }
  },
  handleEditName: function(sequence, event) {
    if ( event.keyCode === 13 ) {
      let target = event.target,
        update = {};

      sequence.name = target.value;
      var self = this;
      api.sequences.update(sequence, function(err, res) {
        if (err) {
          console.error(err)
        } else {
          console.log('successfully updated');
          console.log(sequence);
          self.toggleEditingName();
        }
      });
    }
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
        <SequenceList pollInterval="20000"></SequenceList>
      </div>
    </div>
  </div>,
  document.getElementById('example')
);
