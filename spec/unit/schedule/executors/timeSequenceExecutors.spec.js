const timeSequenceExecutor = require('../../../../schedule/executors/timeSequenceExecutor');
const moment = require('moment');
const logger = {
  log: function(level, message) {return console.log(`[ ${level} ] ${message}`);}
};

describe('timeSequenceExecutor', function() {
  describe('filterSequenceItems', function() {
    it('only accepts sequence items with valid starttime, endtime, state', function() {
      const t1 = new Date();
      t1.setHours(13);
      t1.setMinutes(0);
      t1.setSeconds(0);
      const t2 = new Date();
      t2.setHours(14);
      t2.setMinutes(0);
      t2.setSeconds(0);
      const t3 = moment({hour: 14, minute: 0, second: 0});
      const t4 = moment({hour: 15, minute: 0, second: 0});
      const validSequenceItems = [
        {startTime: '12:00', endTime: '13:00', state: 0},
        {startTime: t1, endTime: t2, state: 0},
        {startTime: t3, endTime: t4, state: 0}
      ];
      const testSequenceItems = [
        {},
        {state: 1},
        {state: 0},
        validSequenceItems[0],
        {startTime: 67, endTime: 'kl', state: 0},
        validSequenceItems[1],
        validSequenceItems[2]
      ];
      expect(timeSequenceExecutor.filterSequenceItems(testSequenceItems, logger, 'test')).toEqual(validSequenceItems);
    });
    it('throws if two valid sequence items overlap', function() {
      const t1 = new Date();
      t1.setHours(12);
      t1.setMinutes(59);
      t1.setSeconds(59);
      const t2 = new Date();
      t2.setHours(14);
      t2.setMinutes(0);
      t2.setSeconds(0);
      const validSequenceItems = [
        {startTime: '12:00', endTime: '13:00', state: 0},
        {startTime: t1, endTime: t2, state: 0}
      ];
      const testSequenceItems = [
        {},
        {state: 1},
        {state: 0},
        validSequenceItems[0],
        {startTime: 67, endTime: 'kl', state: 0},
        validSequenceItems[1]
      ];
      expect(() => {timeSequenceExecutor.filterSequenceItems(testSequenceItems, logger, 'test')}).toThrow();
    });
  });
  describe('timeSequenceExecutor', function() {
    it('can handle a sequence with no sequenceItems', function() {
      const sequenceItems = [];
      const controller = {setState: jasmine.createSpy('setState')};
      const executor = timeSequenceExecutor.executor(controller, {defaultState: 0}, sequenceItems, 'test', logger);
      executor.startSchedule();
      expect(controller.setState.calls.mostRecent().args).toEqual([0]);
      expect(controller.setState.calls.count()).toEqual(1);
    });
    it('executes a sequence', function(done) {
      const now = moment();
      const sequenceItems = [{startTime: moment(now).add(2, 'seconds'), endTime: moment(now).add(4, 'seconds'), state: 2}];
      const controller = {setState: jasmine.createSpy('setState')};
      const executor = timeSequenceExecutor.executor(controller, {defaultState: 0}, sequenceItems, 'test', logger);
      executor.startSchedule();
      setTimeout(function() {
        // 500 ms
        expect(controller.setState.calls.mostRecent().args).toEqual([0]);
        expect(controller.setState.calls.count()).toEqual(1);
        expect(executor.activeState()).toEqual(0);
        setTimeout(function() {
          // 2500 ms
          expect(controller.setState.calls.mostRecent().args).toEqual([2]);
          expect(controller.setState.calls.count()).toEqual(2);
          expect(executor.activeState()).toEqual(2);
          setTimeout(function() {
            // 4500 ms
            expect(controller.setState.calls.mostRecent().args).toEqual([0]);
            expect(controller.setState.calls.count()).toEqual(3);
            expect(executor.activeState()).toEqual(0);
            executor.replaceSequence({defaultState: 0}, [{
              startTime: moment(now).add(5, 'seconds'),
              endTime: moment(now).add(8, 'seconds'), state: 3
            }]);
            setTimeout(function() {
              // 6500 ms
              expect(controller.setState.calls.mostRecent().args).toEqual([3]);
              expect(controller.setState.calls.count()).toEqual(4);
              expect(executor.activeState()).toEqual(3);
              executor.replaceSequence({defaultState: 1}, [{
                startTime: moment(now).add(9, 'seconds'),
                endTime: moment(now).add(12, 'seconds'), state: 4
              }]);
              setTimeout(function() {
                // 9500
                expect(controller.setState.calls.mostRecent().args).toEqual([4]);
                expect(controller.setState.calls.count()).toEqual(6);
                expect(executor.activeState()).toEqual(4);
                executor.endSchedule();
                expect(controller.setState.calls.mostRecent().args).toEqual([1]);
                expect(controller.setState.calls.count()).toEqual(7);
                expect(executor.activeState()).toEqual(1);
                expect(executor.activeInterrupts()).toEqual([]);
                done();
              }, 3000);
            }, 2000);
          }, 2000);
        }, 2000)
      }, 500)
    }, 19000);
  });
});
