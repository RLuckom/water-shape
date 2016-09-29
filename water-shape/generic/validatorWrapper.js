var _ = require('lodash');
var timeout = 1000;
module.exports.guardValidators = function guardValidators(schema) {
  _.each(schema, function(v, k) {
    if (v.validate) {
      var originalValidate = v.validate;
      v.validate = function(val, dmi, callback) {
        var n = 0;
        function singleUseCallback(err) {
          console.log(n);
          n = n + 1;
          if (n === 1) {
            console.log(`calling callback for table ${k} with err ${err}`);
            return callback(err);
          }
        }
        try {
          originalValidate(val, dmi, singleUseCallback);
          return setTimeout(function() {singleUseCallback(new Error(`Validator for table ${k} did not call callback within timeout of ${timeout} ms`));}, timeout);
        } catch (err) {
          return singleUseCallback(err);
        }
      };
    }
  });
};
