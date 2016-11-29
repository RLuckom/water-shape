const timeout = 1000;
module.exports = function(_) {
  return {
    guardValidators:function guardValidators(schema) {
      _.each(schema, function(v, k) {
        if (v.validate) {
          const originalValidate = v.validate;
          v.validate = function(val, dmi, callback) {
            var n = 0;
            function singleUseCallback(err) {
              n = n + 1;
              if (n === 1) {
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
    }
  };
}
