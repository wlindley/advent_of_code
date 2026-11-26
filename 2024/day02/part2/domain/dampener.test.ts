import { describe, expect, it } from 'vitest';
import { Report } from '../../shared';
import { DampenerEvaluation } from './dampener';

function isStrictlySafeOracle(levels: readonly number[]): boolean {
  if (levels.length < 2) return true;
  let inc = true;
  let dec = true;
  for (let i = 1; i < levels.length; i += 1) {
    const d = levels[i]! - levels[i - 1]!;
    if (d < 1 || d > 3) inc = false;
    if (d > -1 || d < -3) dec = false;
  }
  return inc || dec;
}

function exhaustiveSkipOracle(levels: readonly number[]): { isSafe: boolean; removedIndex: number | null } {
  if (isStrictlySafeOracle(levels)) return { isSafe: true, removedIndex: null };
  for (let skip = 0; skip < levels.length; skip += 1) {
    const filtered = levels.filter((_, idx) => idx !== skip);
    if (isStrictlySafeOracle(filtered)) return { isSafe: true, removedIndex: skip };
  }
  return { isSafe: false, removedIndex: null };
}

function nextSeededInt(state: { seed: number }, span: number): number {
  state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
  return state.seed % span;
}

describe('day02/part2 DampenerEvaluation', () => {
  it('evaluates the 6 official example reports accurately', () => {
    const cases: readonly { levels: number[]; kind: string; removed: number | null; failIdx: number | null; trend: number | null }[] = [
      { levels: [7, 6, 4, 2, 1], kind: 'native-safe', removed: null, failIdx: null, trend: -1 },
      { levels: [1, 2, 7, 8, 9], kind: 'unsafe', removed: null, failIdx: 1, trend: null },
      { levels: [9, 7, 6, 2, 1], kind: 'unsafe', removed: null, failIdx: 2, trend: null },
      { levels: [1, 3, 2, 4, 5], kind: 'dampened-safe', removed: 1, failIdx: 1, trend: 1 },
      { levels: [8, 6, 4, 4, 1], kind: 'dampened-safe', removed: 2, failIdx: 2, trend: -1 },
      { levels: [1, 3, 6, 7, 9], kind: 'native-safe', removed: null, failIdx: null, trend: 1 },
    ];
    for (const c of cases) {
      const ev = DampenerEvaluation.evaluate(new Report(c.levels));
      expect(ev.outcome.kind).toBe(c.kind);
      expect(ev.isSafe).toBe(c.kind !== 'unsafe');
      expect(ev.removedIndex).toBe(c.removed);
      expect(ev.initialFailure?.index ?? null).toBe(c.failIdx);
      expect(ev.dampenedTrend).toBe(c.trend);
      expect(ev.didTrendFlip).toBe(false);
    }
  });

  it('detects index-0 removals including trend flips and flat starts', () => {
    const cases: readonly { levels: number[]; trend: number; flipped: boolean }[] = [
      { levels: [1, 4, 3, 2, 1], trend: -1, flipped: true },
      { levels: [5, 3, 4, 5, 6], trend: 1, flipped: true },
      { levels: [10, 5, 6, 7, 8], trend: 1, flipped: true },
      { levels: [1, 5, 4, 3, 2], trend: -1, flipped: true },
      { levels: [9, 5, 4, 3, 2], trend: -1, flipped: false },
      { levels: [5, 5, 6, 7, 8], trend: 1, flipped: false },
    ];
    for (const c of cases) {
      const ev = DampenerEvaluation.evaluate(new Report(c.levels));
      expect(ev.outcome.kind).toBe('dampened-safe');
      expect(ev.removedIndex).toBe(0);
      expect(ev.dampenedTrend).toBe(c.trend);
      expect(ev.didTrendFlip).toBe(c.flipped);
    }
  });

  it('handles middle, last-element, short (L=0..3), negative, and unfixable reports', () => {
    const l3Flip = DampenerEvaluation.evaluate(new Report([5, 2, 6]));
    expect(l3Flip.removedIndex).toBe(1);
    expect(l3Flip.dampenedTrend).toBe(1);
    expect(l3Flip.didTrendFlip).toBe(true);

    const lastRemoved = DampenerEvaluation.evaluate(new Report([1, 2, 3, 9]));
    expect(lastRemoved.removedIndex).toBe(3);
    expect(lastRemoved.dampenedTrend).toBe(1);

    const midRemoved = DampenerEvaluation.evaluate(new Report([1, 2, 9, 3, 4]));
    expect(midRemoved.removedIndex).toBe(2);

    const empty = DampenerEvaluation.evaluate(new Report([]));
    expect(empty.outcome.kind).toBe('native-safe');
    expect(empty.dampenedTrend).toBeNull();

    const single = DampenerEvaluation.evaluate(new Report([42]));
    expect(single.outcome.kind).toBe('native-safe');
    expect(single.dampenedTrend).toBeNull();

    const pairFlat = DampenerEvaluation.evaluate(new Report([5, 5]));
    expect(pairFlat.outcome.kind).toBe('dampened-safe');
    expect(pairFlat.removedIndex).toBe(0);
    expect(pairFlat.dampenedTrend).toBeNull();
    expect(pairFlat.didTrendFlip).toBe(false);

    const pairJump = DampenerEvaluation.evaluate(new Report([1, 10]));
    expect(pairJump.removedIndex).toBe(0);
    expect(pairJump.dampenedTrend).toBeNull();

    const negatives = DampenerEvaluation.evaluate(new Report([-1, -5, -3, -5, -7]));
    expect(negatives.removedIndex).toBe(1);
    expect(negatives.dampenedTrend).toBe(-1);

    const flatAfterSkip = DampenerEvaluation.evaluate(new Report([1, 5, 5, 6]));
    expect(flatAfterSkip.outcome.kind).toBe('unsafe');

    const doubleFail = DampenerEvaluation.evaluate(new Report([1, 10, 2, 20]));
    expect(doubleFail.outcome.kind).toBe('unsafe');
    expect(doubleFail.isSafe).toBe(false);
    expect(doubleFail.removedIndex).toBeNull();
    expect(doubleFail.dampenedTrend).toBeNull();

    expect(Object.isFrozen(empty)).toBe(true);
    expect(Object.isFrozen(empty.outcome)).toBe(true);
    expect(Object.isFrozen(l3Flip)).toBe(true);
    expect(Object.isFrozen(l3Flip.outcome)).toBe(true);
    expect(Object.isFrozen(doubleFail)).toBe(true);
    expect(Object.isFrozen(doubleFail.outcome)).toBe(true);
  });

  it('matches exhaustiveSkipOracle across 1,000 seeded reports for safety and minimal removedIndex', () => {
    const rng = { seed: 202412022 };
    for (let i = 0; i < 1000; i += 1) {
      const len = nextSeededInt(rng, 9);
      const levels: number[] = [];
      let cur = nextSeededInt(rng, 21) - 10;
      for (let j = 0; j < len; j += 1) {
        if (j > 0) cur += nextSeededInt(rng, 11) - 5;
        levels.push(cur);
      }
      const ev = DampenerEvaluation.evaluate(new Report(levels));
      const oracle = exhaustiveSkipOracle(levels);
      expect(ev.isSafe).toBe(oracle.isSafe);
      expect(ev.removedIndex).toBe(oracle.removedIndex);
    }
  });
});
