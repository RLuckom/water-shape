const timeParser = require('../../../utils/timeParser.js');

describe('timeParser', function() {
  it('should accept all valid inputs and turn them into seconds correctly', function() {
    var minuteString, secondString, testStrings;
    var n = 0;
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
            parsed = timeParser.parseTime(s);
            expect(parsed.hour).toEqual(hour, `Expected hour in ${s} to be ${hour} but found ${parsed.hour}`);
            expect(parsed.minute).toEqual(minute, `Expected minute in ${s} to be ${minute} but found ${parsed.minute}`);
            expect(parsed.second).toEqual(second, `Expected second in ${s} to be ${second} but found ${parsed.second}`);
            var d = new Date();
            d.setHours(parsed.hour);
            d.setMinutes(parsed.minute);
            d.setSeconds(parsed.second);
            expect(timeParser.toSeconds(s)).toEqual(n);
            expect(timeParser.toSeconds(d)).toEqual(n);
          });
          n++
        }
      }
    }
  });
  it('should reject invalid inputs', function() {
    function testBadTime(t) {
      expect(function() {return timeParser.parseTime(t);}).toThrow();
    }
    var badTimeStrings = [
      '24:22:45',
      '12:22:5',
      '12:22:45PM<div>evil</div>',
      '13:44:55PM',
      '13:44:55AM',
      '22:67:55',
      '17:560',
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
  it('should correctly determine whether time periods overlap', function() {
    sequences = [
      {startTime: '6:30AM', endTime: '7:30AM'},
      // first and second overlap, but this should not lead to error
      {startTime: '6:25AM', endTime: '7:30AM'},
      {startTime: '16:30', endTime: '17:30'}
    ];
    // No overlap
    var noOverlap = {startTime: '5:30AM', endTime: '5:45AM'};
    expect(timeParser.sequenceItemOverlaps(noOverlap, sequences)).toBe(false);
    // end === start of other period. Should not be overlap
    var noOverlap = {startTime: '5:30AM', endTime: '6:25AM'};
    expect(timeParser.sequenceItemOverlaps(noOverlap, sequences)).toBe(false);
    // start === end of other period. Should not be overlap
    var noOverlap = {startTime: '17:30', endTime: '6:25PM'};
    expect(timeParser.sequenceItemOverlaps(noOverlap, sequences)).toBe(false);
    //end time overlaps
    var overlap = {startTime: '5:30AM', endTime: '6:27AM'};
    expect(timeParser.sequenceItemOverlaps(overlap, sequences)).toBe(true);
    //start time overlaps
    var overlap = {startTime: '7:25AM', endTime: '8:00'};
    expect(timeParser.sequenceItemOverlaps(overlap, sequences)).toBe(true);
    //within other sequence
    var overlap = {startTime: '16:31', endTime: '17:29'}
    expect(timeParser.sequenceItemOverlaps(overlap, sequences)).toBe(true);
    //surrounding other sequence
    var overlap = {startTime: '16:29', endTime: '17:31'}
    expect(timeParser.sequenceItemOverlaps(overlap, sequences)).toBe(true);
    //same as other sequence
    var overlap = {startTime: '16:30', endTime: '17:30'}
    expect(timeParser.sequenceItemOverlaps(overlap, sequences)).toBe(true);
    //same end, earlier start
    var overlap = {startTime: '16:29', endTime: '17:30'}
    expect(timeParser.sequenceItemOverlaps(overlap, sequences)).toBe(true);
    //same start, later end
    var overlap = {startTime: '16:30', endTime: '17:31'}
    expect(timeParser.sequenceItemOverlaps(overlap, sequences)).toBe(true);
  });
  it('should determine whether there are overlaps in groups of sequences', function() {
    overlaps = [
      {startTime: '6:30AM', endTime: '7:30AM'},
      {startTime: '6:25AM', endTime: '7:30AM'},
      {startTime: '16:30', endTime: '17:30'}
    ];
    expect(timeParser.anySequenceItemOverlaps(overlaps)).toBe(true);
    noOverlaps = [
      {startTime: '6:30AM', endTime: '7:30AM'},
      {startTime: '6:25AM', endTime: '6:30AM'},
      {startTime: '16:30', endTime: '17:30'}
    ];
    expect(timeParser.anySequenceItemOverlaps(noOverlaps)).toBe(false);
  });
  it('can order sequence items by start time', function() {
    unordered = [
      {startTime: '6:30AM', endTime: '7:30AM'},
      {startTime: '6:25AM', endTime: '7:30AM'},
      {startTime: '16:30', endTime: '17:30'}
    ];
    ordered = [
      {startTime: '6:25AM', endTime: '7:30AM'},
      {startTime: '6:30AM', endTime: '7:30AM'},
      {startTime: '16:30', endTime: '17:30'}
    ];
    expect(timeParser.orderByStartTime(unordered)).toEqual(ordered);
    expect(unordered[0].startTime).toEqual('6:30AM');
    expect(timeParser.orderByStartTime(ordered)).toEqual(ordered);
    expect(ordered).not.toEqual(unordered);
    unordered = [
      {startTime: '16:30', endTime: '17:30'},
      {startTime: '6:30AM', endTime: '7:30AM'},
      {startTime: '6:25AM', endTime: '7:30AM'}
    ];
    expect(timeParser.orderByStartTime(unordered)).toEqual(ordered);
  });
});
