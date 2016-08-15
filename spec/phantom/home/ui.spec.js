'use strict';
const _ = require('lodash');
const fs = require('fs');

describe('ui tests', function() {


  it('serves the page', function(done) {
    driver.sleep(9000).then(function() {
      driver.findElement(by.id('example')).then(function(e) {
        return e.getText().then(function(t) {
          console.log('t', t);
          expect(t).toEqual('Raspberry Pi GPIO Scheduling Controller');
          return done();
        });
      });
    });
  });
});
