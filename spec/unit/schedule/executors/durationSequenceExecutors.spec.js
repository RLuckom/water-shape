const durationSequenceExecutor = require('../../../../schedule/executors/durationSequenceExecutor');
const moment = require('moment');

describe('durationSequenceExecutor', function() {
  describe('filterSequenceItems', function() {
    it('only accepts sequence items with valid duration, ordinal, state', function() {
      const validSequenceItems = [
        {durationSeconds: 45, state: 1, ordinal: 0},
        {durationSeconds: 45, state: 0, ordinal: 1},
        {durationSeconds: 0, state: 1, ordinal: 2}
      ];
      const testSequenceItems = [
        {},
        {state: 1},
        {state: 0},
        validSequenceItems[0],
        {durationSeconds: '67', ordinal: 5, state: 0},
        {durationSeconds: 67, ordinal: '5', state: 0},
        validSequenceItems[1],
        validSequenceItems[2]
      ];
      expect(durationSequenceExecutor.filterSequenceItems(testSequenceItems)).toEqual(validSequenceItems);
    });
    it('throws if two valid sequence items have the same ordinal', function() {
      const validSequenceItems = [
        {durationSeconds: 45, state: 1, ordinal: 0},
        {durationSeconds: 45, state: 0, ordinal: 0},
        {durationSeconds: 0, state: 1, ordinal: 2}
      ];
      const testSequenceItems = [
        {},
        {state: 1},
        {state: 0},
        validSequenceItems[0],
        {durationSeconds: '67', ordinal: 5, state: 0},
        {durationSeconds: 67, ordinal: '5', state: 0},
        validSequenceItems[1],
        validSequenceItems[2]
      ];
      expect(() => {durationSequenceExecutor.filterSequenceItems(testSequenceItems)}).toThrow();
    });
  });
  describe('durationSequenceExecutor', function() {
    it('can handle a sequence with no sequenceItems', function() {
      const sequenceItems = [];
      const controller = {setState: jasmine.createSpy('setState')};
      const executor = durationSequenceExecutor.executor(controller, {defaultState: 0}, sequenceItems);
      executor.startSchedule();
      expect(controller.setState.calls.mostRecent().args).toEqual([0]);
      expect(controller.setState.calls.count()).toEqual(1);
    });
    it('executes a sequence', function(done) {
      const sequenceItems = [
        {durationSeconds: 2, ordinal: 0, state: 0},
        {durationSeconds: 2, ordinal: 1, state: 2},
        {durationSeconds: 2, ordinal: 2, state: 3},
        {durationSeconds: 2, ordinal: 3, state: 4},
        {durationSeconds: 2, ordinal: 4, state: 5}
      ];
      const controller = {setState: jasmine.createSpy('setState')};
      const executor = durationSequenceExecutor.executor(controller, {defaultState: 0}, sequenceItems);
      executor.startSchedule();
      setTimeout(function() {
        // 500 ms
        console.log('500 ms');
        expect(controller.setState.calls.mostRecent().args).toEqual([0]);
        expect(controller.setState.calls.count()).toEqual(2);
        expect(executor.activeState()).toEqual(0);
        setTimeout(function() {
          // 2500 ms
          console.log('2500 ms');
          expect(controller.setState.calls.mostRecent().args).toEqual([2]);
          expect(controller.setState.calls.count()).toEqual(3);
          expect(executor.activeState()).toEqual(2);
          setTimeout(function() {
            // 4500 ms
            console.log('4500 ms');
            expect(controller.setState.calls.mostRecent().args).toEqual([3]);
            expect(controller.setState.calls.count()).toEqual(4);
            expect(executor.activeState()).toEqual(3);
            setTimeout(function() {
              // 6500 ms
              console.log('6500 ms');
              expect(controller.setState.calls.mostRecent().args).toEqual([4]);
              expect(controller.setState.calls.count()).toEqual(5);
              expect(executor.activeState()).toEqual(4);
              setTimeout(function() {
                // 9500
                console.log('9500 ms');
                expect(controller.setState.calls.mostRecent().args).toEqual([5]);
                expect(controller.setState.calls.count()).toEqual(6);
                expect(executor.activeState()).toEqual(5);
                executor.endSchedule();
                expect(controller.setState.calls.mostRecent().args).toEqual([0]);
                expect(controller.setState.calls.count()).toEqual(7);
                expect(executor.activeState()).toEqual(0);
                expect(executor.activeInterrupts()).toEqual([]);
                done();
              }, 3000);
            }, 2000);
          }, 2000);
        }, 2000)
      }, 500)
    }, 19000);
    it('executes a sequence', function(done) {
      const sequenceItems = [
        {durationSeconds: 2, ordinal: 0, state: 0},
        {durationSeconds: 2, ordinal: 1, state: 2}
      ];
      const controller = {setState: jasmine.createSpy('setState')};
      const executor = durationSequenceExecutor.executor(controller, {defaultState: 0}, sequenceItems);
      executor.startSchedule();
      setTimeout(function() {
        // 500 ms
        console.log('500 ms');
        expect(controller.setState.calls.mostRecent().args).toEqual([0]);
        expect(controller.setState.calls.count()).toEqual(2);
        expect(executor.activeState()).toEqual(0);
        setTimeout(function() {
          // 2500 ms
          console.log('2500 ms');
          expect(controller.setState.calls.mostRecent().args).toEqual([2]);
          expect(controller.setState.calls.count()).toEqual(3);
          expect(executor.activeState()).toEqual(2);
          setTimeout(function() {
            // 4500 ms
            console.log('4500 ms');
            expect(controller.setState.calls.mostRecent().args).toEqual([0]);
            expect(controller.setState.calls.count()).toEqual(4);
            expect(executor.activeState()).toEqual(0);
            executor.replaceSequence({defaultState: 0}, [
              {durationSeconds: 1, ordinal: 0, state: 0},
              {durationSeconds: 3, ordinal: 1, state: 3}
            ]);
            setTimeout(function() {
              // 6500 ms
              console.log('6500 ms');
              expect(controller.setState.calls.mostRecent().args).toEqual([3]);
              expect(controller.setState.calls.count()).toEqual(7);
              expect(executor.activeState()).toEqual(3);
              executor.replaceSequence({defaultState: 1}, [
                {durationSeconds: 2, ordinal: 0, state: 0},
                {durationSeconds: 3, ordinal: 1, state: 4}
              ]);
              setTimeout(function() {
                // 9500
                console.log('9500 ms');
                expect(controller.setState.calls.mostRecent().args).toEqual([4]);
                expect(controller.setState.calls.count()).toEqual(10);
                expect(executor.activeState()).toEqual(4);
                executor.endSchedule();
                expect(controller.setState.calls.mostRecent().args).toEqual([1]);
                expect(controller.setState.calls.count()).toEqual(11);
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
