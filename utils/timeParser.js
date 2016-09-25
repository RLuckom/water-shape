/* Parser for times of day without date information */

/*
 * @param {String} time : time string.
 * @returns {Object} : {hour: [0-24], minute: [0-60], second: [0-60]
 * @throws {Error} : if the time is not parseable
 */

var timeRegex =  /([0-9]{1,2}):([0-9]{2})[\.:]{0,1}([0-9]{2}){0,1}(AM|PM|am|pm|Pm|Am|pM|aM){0,1}$/;
function parseTime(t) {
  var match = t.match(timeRegex);
  if (!match) {
    throw new Error('Time format not recognized. A supported time format is 13:22:56 or 1:22:56PM');
  }
  var hour = parseInt(match[1]);
  if (hour > 23) {
    throw new Error('Hour cannot be above 23');
  }
  if (hour === 0 && match[4]) {
    throw new Error('0 is not a valid hour when specifying AM or PM');
  }
  if (hour > 12 && match[4]) {
    throw new Error(`Hours greater than 12 are not valid when specifying AM or PM`);
  }
  if (match[4] && ['pm', 'PM', 'pM', 'Pm'].indexOf(match[4]) != -1) {
    hour += 12;
  }
  var minute = parseInt(match[2]);
  if (minute > 59) {
    throw new Error('Minute must be 0-59');
  }
  var second = match[3] ? parseInt(match[3]) : 0;
  if (second > 59) {
    throw new Error('Second must be 0-59');
  }
  return {hour: hour, minute: minute, second: second};
}

module.exports = parseTime;
