import { describe, expect, it } from 'vitest';
import { ElfInventory } from './inventory';
import {
  DEFAULT_MAX_TRACE_STEPS,
  rankTopElves,
  sumCalories,
  traceTopElves,
} from './leaderboard';

function makeElves(totals: readonly number[]): readonly ElfInventory[] {
  return totals.map((total, index) => new ElfInventory(index + 1, [total]));
}

describe('sumCalories', () => {
  it('sums calorie totals across inventories and handles empty list', () => {
    expect(sumCalories([])).toBe(0);
    expect(sumCalories(makeElves([6000, 4000, 11000]))).toBe(21000);
  });

  it('throws RangeError if combined calories exceed MAX_SAFE_INTEGER', () => {
    const overflowing = [
      new ElfInventory(1, [Number.MAX_SAFE_INTEGER]),
      new ElfInventory(2, [1]),
    ];
    expect(() => sumCalories(overflowing)).toThrow(RangeError);
  });
});

describe('rankTopElves', () => {
  it('ranks top 1 and top 3 elves in descending calorie order and freezes result', () => {
    const elves = makeElves([6000, 4000, 11000, 24000, 10000]);
    const top1 = rankTopElves(elves, 1);
    const top3 = rankTopElves(elves, 3);

    expect(Object.isFrozen(top1)).toBe(true);
    expect(top1.map((e) => e.elfNumber)).toEqual([4]);
    expect(top3.map((e) => [e.elfNumber, e.totalCalories])).toEqual([
      [4, 24000],
      [3, 11000],
      [5, 10000],
    ]);
  });

  it('preserves earlier elfNumber on ties', () => {
    const tiedTop1 = rankTopElves(makeElves([500, 500, 300]), 1);
    expect(tiedTop1.map((e) => e.elfNumber)).toEqual([1]);

    const tiedTop3 = rankTopElves(makeElves([300, 200, 200, 200]), 3);
    expect(tiedTop3.map((e) => e.elfNumber)).toEqual([1, 2, 3]);
  });

  it('validates topCount and inventory length', () => {
    const elves = makeElves([100, 200]);
    expect(() => rankTopElves(elves, 0)).toThrow(RangeError);
    expect(() => rankTopElves(elves, -1)).toThrow(RangeError);
    expect(() => rankTopElves(elves, 1.5)).toThrow(RangeError);
    expect(() => rankTopElves(elves, 3)).toThrow(RangeError);
  });
});

describe('traceTopElves', () => {
  it('records frozen step-by-step frames with exact leaders and entry flags', () => {
    const elves = makeElves([6000, 4000, 11000, 11000, 24000]);
    const frames = traceTopElves(elves, 1);

    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(5);
    expect(frames.every((f) => Object.isFrozen(f) && Object.isFrozen(f.leaders))).toBe(true);
    expect(frames.map((f) => [f.stepIndex, f.elfIndex, f.enteredLeaderboard, f.leaders[0]?.elfNumber])).toEqual([
      [0, 0, true, 1],
      [1, 1, false, 1],
      [2, 2, true, 3],
      [3, 3, false, 3],
      [4, 4, true, 5],
    ]);
    expect(frames[0]?.totalSteps).toBe(5);
    expect(frames[0]?.totalElves).toBe(5);
  });

  it('samples large inputs while simulating every Elf for exact final leaders', () => {
    const totals = Array.from({ length: 20 }, (_, i) => (i === 7 ? 99999 : (i + 1) * 10));
    const elves = makeElves(totals);
    const sampled = traceTopElves(elves, 2, { maxSteps: 5 });

    expect(sampled).toHaveLength(5);
    expect(sampled[0]?.elfIndex).toBe(0);
    expect(sampled[4]?.elfIndex).toBe(19);
    expect(sampled[4]?.leaders.map((e) => e.elfNumber)).toEqual([8, 20]);

    const single = traceTopElves(elves, 1, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]?.elfIndex).toBe(19);
    expect(single[0]?.leaders[0]?.elfNumber).toBe(8);
  });

  it('rejects invalid topCount, insufficient elves, and invalid maxSteps', () => {
    const elves = makeElves([100]);
    expect(() => traceTopElves(elves, 2)).toThrow(RangeError);
    expect(() => traceTopElves(elves, 1, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceTopElves(elves, 1, { maxSteps: 2.5 })).toThrow(RangeError);
  });
});
