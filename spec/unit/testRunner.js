var Jasmine = require('jasmine');
var jasmine = new Jasmine();

jasmine.loadConfig({
  spec_dir: 'spec/unit',
    spec_files: [
      '**/*.spec.js'
    ],
    helpers: [
        //'helpers/**/*.js'
    ]
});

jasmine.execute();
