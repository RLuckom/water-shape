const interruptible = require('../../../schedule/interruptible').interruptible;
const _ = require('lodash');

describe('interruptible', function() {
  describe('defaults', function() {
    it('sets the default defaultState immediately', function() {
      const controller = {setState: jasmine.createSpy('setState')};
      interruptible(controller);
      expect(controller.setState).toHaveBeenCalledWith(0);
    });
    it('sets the provided defaultState immediately', function() {
      const controller = {setState: jasmine.createSpy('setState')};
      interruptible(controller, 1);
      expect(controller.setState).toHaveBeenCalledWith(1);
    });
    it('sets the new default state when changed', function() {
      const controller = {setState: jasmine.createSpy('setState')};
      const i = interruptible(controller, 1);
      expect(controller.setState).toHaveBeenCalledWith(1);
      expect(i.defaultState()).toBe(1);
      i.defaultState(0);
      expect(controller.setState).toHaveBeenCalledWith(0);
      expect(i.defaultState()).toBe(0);
      expect(controller.setState.calls.count()).toBe(2);
    });
  });
  describe('interrupts', function() {
    it('throws an error if the interrupt is undefined', function() {
      const controller = {setState: jasmine.createSpy('setState')};
      const i = interruptible(controller);
      expect(i.interrupt).toThrow();
    });
    it('throws an error if the interrupt uid is undefined', function() {
      const controller = {setState: jasmine.createSpy('setState')};
      const i = interruptible(controller);
      expect(_.partial(i.interrupt, {priority: 8, state: 0})).toThrow();
    });
    it('sets the state according to a provided interrupt', function() {
      const controller = {setState: jasmine.createSpy('setState')};
      const i = interruptible(controller);
      i.interrupt({uid: 1, state: 1});
      expect(controller.setState.calls.mostRecent().args).toEqual([1]);
    });
    it('sets the state according to the most recent provided interrupt in priority tie', function() {
      const controller = {setState: jasmine.createSpy('setState')};
      const i = interruptible(controller);
      i.interrupt({uid: 1, state: 1});
      i.interrupt({uid: 2, state: 3});
      expect(controller.setState.calls.mostRecent().args).toEqual([3]);
    });
    it('sets the state according to the highest priority interrupt and does not reset the currently-set interrupt', function() {
      const controller = {setState: jasmine.createSpy('setState')};
      const i = interruptible(controller);
      i.interrupt({uid: 1, state: 1, priority: 1});
      i.interrupt({uid: 2, state: 3});
      expect(controller.setState.calls.mostRecent().args).toEqual([1]);
      expect(controller.setState.calls.count()).toEqual(2);
    });
    it('resets to the default if the only interrupt is removed', function() {
      const controller = {setState: jasmine.createSpy('setState')};
      const i = interruptible(controller);
      i.interrupt({uid: 1, state: 1, priority: 1});
      expect(controller.setState.calls.mostRecent().args).toEqual([1]);
      i.endInterrupt({uid: 1, state: 1, priority: 1});
      expect(controller.setState.calls.mostRecent().args).toEqual([0]);
      expect(controller.setState.calls.count()).toEqual(3);
      i.interrupt({uid: 2, state: 2, priority: 1});
      expect(controller.setState.calls.mostRecent().args).toEqual([2]);
      i.endInterrupt(2);
      expect(controller.setState.calls.mostRecent().args).toEqual([0]);
      expect(controller.setState.calls.count()).toEqual(5);
    });
    it('resets to the next-highest priority if the highest priority interrupt is removed', function() {
      const controller = {setState: jasmine.createSpy('setState')};
      const i = interruptible(controller);
      i.interrupt({uid: 1, state: 1, priority: 1});
      i.interrupt({uid: 2, state: 2, priority: 2});
      expect(controller.setState.calls.mostRecent().args).toEqual([2]);
      i.endInterrupt({uid: 2, state: 2, priority: 2});
      expect(controller.setState.calls.mostRecent().args).toEqual([1]);
      expect(controller.setState.calls.count()).toEqual(4);
      i.interrupt({uid: 3, state: 3, priority: 2});
      expect(controller.setState.calls.mostRecent().args).toEqual([3]);
      i.endInterrupt(3);
      expect(controller.setState.calls.mostRecent().args).toEqual([1]);
      expect(controller.setState.calls.count()).toEqual(6);
    });
    it('resets to the next-most-recent if the most-recent interrupt is removed', function() {
      const controller = {setState: jasmine.createSpy('setState')};
      const i = interruptible(controller);
      i.interrupt({uid: 1, state: 1, priority: 1});
      i.interrupt({uid: 2, state: 2, priority: 1});
      expect(controller.setState.calls.mostRecent().args).toEqual([2]);
      i.endInterrupt({uid: 2, state: 2, priority: 2});
      expect(controller.setState.calls.mostRecent().args).toEqual([1]);
      expect(controller.setState.calls.count()).toEqual(4);
      i.interrupt({uid: 3, state: 3, priority: 1});
      expect(controller.setState.calls.mostRecent().args).toEqual([3]);
      i.endInterrupt(3);
      expect(controller.setState.calls.mostRecent().args).toEqual([1]);
      expect(controller.setState.calls.count()).toEqual(6);
    });
  });
  describe('activeInterrupts', function() {
    it('provides the current interrupts', function() {
      const controller = {setState: jasmine.createSpy('setState')};
      const i = interruptible(controller);
      const in1 = () => {return {uid: 1, state: 1, priority: 1};};
      const in2 = () => {return {uid: 2, state: 2, priority: 1};};
      i.interrupt(in1());
      i.interrupt(in2());
      expect(controller.setState.calls.mostRecent().args).toEqual([2]);
      let current = i.activeInterrupts();
      current[0].uid = 'evil';
      expect(i.activeInterrupts()).toEqual([in1(), in2()]);
      i.endInterrupt({uid: 2, state: 2, priority: 2});
      current = i.activeInterrupts();
      current[0].uid = 'evil';
      expect(i.activeInterrupts()).toEqual([in1()]);
    });
  });
  describe('activeState', function() {
    it('provides the active state', function() {
      const controller = {setState: jasmine.createSpy('setState')};
      const i = interruptible(controller);
      expect(i.activeState()).toEqual(0);
      const in1 = () => {return {uid: 1, state: 1, priority: 1};};
      const in2 = () => {return {uid: 2, state: 2, priority: 1};};
      i.interrupt(in1());
      expect(i.activeState()).toEqual(1);
      i.interrupt(in2());
      expect(controller.setState.calls.mostRecent().args).toEqual([2]);
      expect(i.activeState()).toEqual(2);
      i.endInterrupt({uid: 2, state: 2, priority: 2});
      expect(i.activeState()).toEqual(1);
    });
  });
});
