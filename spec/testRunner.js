var Jasmine = require('jasmine');
var jasmine = new Jasmine();

jasmine.loadConfig({
    spec_dir: 'spec',
    spec_files: [
        'utils/db.spec.js',
        'utils/api.spec.js'
    ],
    helpers: [
        //'helpers/**/*.js'
    ]
});

jasmine.execute();
