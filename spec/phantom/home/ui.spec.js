'use strict';
const _ = require('lodash');
const fs = require('fs');

describe('ui tests', function() {


  it('serves the page', function(done) {
    driver.findElement(by.id('example')).then(function(e) {
      return e.getText().then(function(t) {
        console.log('t', t);
        if (!t) {
          fail('must see text on page');
        } else {
          expect(t.indexOf('Raspberry Pi GPIO Scheduling Controller') !== -1).toBe(true);
        }
        return done();
      });
    });
  }, 30000);
});
