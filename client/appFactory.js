'use strict';
require('./scss/app.scss');
const React = require('react');
const ReactDOM = require('react-dom');
const PeripheralListFactory = require('./components/PeripheralList');

function appFactory(api) {
//TODO make .gitignored config file to avoid hardcoding environment-specific stuff.
const PeripheralList = PeripheralListFactory(api);

ReactDOM.render(
  <div className="app">
    <div className="header row">
      <div className="header col s12">
        <h2>Raspberry Pi GPIO Scheduling Controller</h2>
      </div>
    </div>
    <div className="body row">
      <div className="body col s12">
        <PeripheralList pollInterval="20000"></PeripheralList>
      </div>
    </div>
  </div>,
  document.getElementById('example')
);
}

module.exports = appFactory;
