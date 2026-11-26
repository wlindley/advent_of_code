import { describe, expect, it } from 'vitest';
import { parseCircuitBlueprint } from '../../shared';
import { FeederCycleTracker } from './cycles';

const TWO_INPUT_CIRCUIT = [
  'broadcaster -> a, b',
  '%a -> agg',
  '%b -> agg',
  '&agg -> rx',
].join('\n');

describe('day20 part2 FeederCycleTracker', () => {
  it('returns null for missing target, multi-input target, non-conjunction feeder, or 1-input feeder', () => {
    const noRx = parseCircuitBlueprint('broadcaster -> a\n%a -> out');
    expect(FeederCycleTracker.forTarget(noRx, 'rx')).toBeNull();

    const multiTarget = parseCircuitBlueprint('broadcaster -> a, b\n&a -> rx\n&b -> rx');
    expect(FeederCycleTracker.forTarget(multiTarget, 'rx')).toBeNull();

    const flipFeeder = parseCircuitBlueprint('broadcaster -> a\n%a -> rx');
    expect(FeederCycleTracker.forTarget(flipFeeder, 'rx')).toBeNull();

    const singleInputConj = parseCircuitBlueprint('broadcaster -> a\n%a -> inv\n&inv -> rx');
    expect(FeederCycleTracker.forTarget(singleInputConj, 'rx')).toBeNull();
  });

  it('tracks first/second high hits, ignores non-matching events, and computes LCM', () => {
    const bp = parseCircuitBlueprint(TWO_INPUT_CIRCUIT);
    const tracker = FeederCycleTracker.forTarget(bp, 'rx')!;
    expect(tracker).not.toBeNull();
    expect(tracker.feeder).toBe('agg');
    expect(tracker.target).toBe('rx');
    expect(tracker.inputs).toEqual(['a', 'b']);
    expect(tracker.isComplete).toBe(false);
    expect(tracker.formatPeriods()).toBe('a=?, b=?');
    expect(() => tracker.computeLcm()).toThrow();

    expect(tracker.record({ press: 1, from: 'a', to: 'other', pulse: 'high' })).toBeNull();
    expect(tracker.record({ press: 1, from: 'a', to: 'agg', pulse: 'low' })).toBeNull();
    expect(tracker.record({ press: 1, from: 'unknown', to: 'agg', pulse: 'high' })).toBeNull();

    expect(tracker.record({ press: 6, from: 'a', to: 'agg', pulse: 'high' })).toEqual({
      kind: 'first',
      input: 'a',
      press: 6,
    });
    expect(tracker.record({ press: 6, from: 'a', to: 'agg', pulse: 'high' })).toBeNull();
    expect(tracker.observations).toEqual([
      { input: 'a', firstPress: 6, secondPress: null },
      { input: 'b', firstPress: null, secondPress: null },
    ]);

    expect(tracker.record({ press: 12, from: 'a', to: 'agg', pulse: 'high' })).toEqual({
      kind: 'second',
      input: 'a',
      press: 12,
      period: 6,
    });
    expect(tracker.record({ press: 18, from: 'a', to: 'agg', pulse: 'high' })).toBeNull();
    expect(tracker.formatPeriods()).toBe('a=6, b=?');
    expect(tracker.isComplete).toBe(false);

    expect(tracker.record({ press: 10, from: 'b', to: 'agg', pulse: 'high' })).toEqual({
      kind: 'first',
      input: 'b',
      press: 10,
    });
    expect(tracker.record({ press: 20, from: 'b', to: 'agg', pulse: 'high' })).toEqual({
      kind: 'second',
      input: 'b',
      press: 20,
      period: 10,
    });
    expect(tracker.isComplete).toBe(true);
    expect(tracker.formatPeriods()).toBe('a=6, b=10');
    expect(tracker.computeLcm()).toBe(30n);
    expect(tracker.observations).toEqual([
      { input: 'a', firstPress: 6, secondPress: 12 },
      { input: 'b', firstPress: 10, secondPress: 20 },
    ]);
  });

  it('throws when second hit violates zero-phase periodicity', () => {
    const bp = parseCircuitBlueprint(TWO_INPUT_CIRCUIT);
    const tracker = FeederCycleTracker.forTarget(bp, 'rx')!;
    tracker.record({ press: 3, from: 'a', to: 'agg', pulse: 'high' });
    expect(() => tracker.record({ press: 7, from: 'a', to: 'agg', pulse: 'high' })).toThrow(/phase/i);
  });
});
