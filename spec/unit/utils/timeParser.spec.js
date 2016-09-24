const timeParser = require('../../../utils/timeParser.js');

describe('timeParser', function() {
  it('should accept all valid inputs', function() {
    var minuteString, secondString, testStrings;
    for (var hour = 0; hour < 24; hour++) {
      for (var minute = 0; minute < 60; minute++) {
        if (minute < 10) {
          minuteString = '0' + minute;
        } else {
          minuteString = '' + minute;
        }
        for (var second = 0; second < 60; second++) {
          testStrings = [];
          if (second < 10) {
            secondString = '0' + second;
          } else {
            secondString = '' + second;
          }
          testStrings.push(`${hour}:${minuteString}:${secondString}`);
          if (hour > 12) {
            testStrings.push(`${hour - 12}:${minuteString}:${secondString}PM`);
            testStrings.push(`${hour - 12}:${minuteString}:${secondString}pm`);
          } else if (hour > 1) {
            testStrings.push(`${hour}:${minuteString}:${secondString}AM`);
            testStrings.push(`${hour}:${minuteString}:${secondString}am`);
          }
          if (second === 0) {
            testStrings.push(`${hour}:${minuteString}`);
            if (hour > 12) {
              testStrings.push(`${hour - 12}:${minuteString}PM`);
            } else if (hour > 1) {
              testStrings.push(`${hour}:${minuteString}AM`);
            }
          }
          testStrings.forEach(function(s) {
            parsed = timeParser(s);
            expect(parsed.hour).toEqual(hour, `Expected hour in ${s} to be ${hour} but found ${parsed.hour}`);
            expect(parsed.minute).toEqual(minute, `Expected minute in ${s} to be ${minute} but found ${parsed.minute}`);
            expect(parsed.second).toEqual(second, `Expected second in ${s} to be ${second} but found ${parsed.second}`);
          })
        }
      }
    }
  });
  it('should reject invalid inputs', function() {
    function testBadTime(t) {
      expect(function() {return timeParser(t);}).toThrow();
    }
    var badTimeStrings = [
      '24:22:45',
      '13:44:55PM',
      '13:44:55AM',
      '22:67:55',
      '22:22:67',
      '0:22:44AM',
      '0:22:44PM',
      'ghfhzjkx',
      '5:5s:34',
      ':45:34',
      '5::43',
    ];
    badTimeStrings.forEach(testBadTime);
  });
});
