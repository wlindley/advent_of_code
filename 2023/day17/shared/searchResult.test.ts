import { describe, expect, it } from 'vitest';
import { CrucibleSearchResult, CrucibleTraceFrame } from './searchResult';

describe('CrucibleSearchResult & CrucibleTraceFrame', () => {
  it('stores defensive copies, freezes metadata, and computes dynamic getters', () => {
    const rawHeat = new Int32Array([0, 3, -1, 4, 8, 10]);
    const turns = [0, 1, 4, 5];
    const result = new CrucibleSearchResult(rawHeat, 2, 3, turns);

    rawHeat[0] = 99;
    turns.push(99);

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.turnCells)).toBe(true);
    expect(result.height).toBe(2);
    expect(result.width).toBe(3);
    expect(result.turnCells).toEqual([0, 1, 4, 5]);
    expect(result.goalHeat).toBe(10);
    expect(result.legCount).toBe(3);
    expect(result.turnCount).toBe(2);
    expect(result.settledHeatAt(0, 0)).toBe(0);
    expect(result.settledHeatAt(0, 2)).toBe(-1);
    expect(result.settledHeatAt(1, 2)).toBe(10);
    expect(Array.from(result.copySettledHeat())).toEqual([0, 3, -1, 4, 8, 10]);
  });

  it('counts settled cells at a threshold and expands orthogonal legs including 1x1', () => {
    const result = new CrucibleSearchResult(new Int32Array([0, 2, 5, 3, 4, 9, -1, 6, 8]), 3, 3, [0, 2, 8]);
    expect(result.countSettledAt(0)).toBe(1);
    expect(result.countSettledAt(4)).toBe(4);
    expect(result.countSettledAt(9)).toBe(8);
    expect(result.expandPath()).toEqual([0, 1, 2, 5, 8]);
    expect(Object.isFrozen(result.expandPath())).toBe(true);

    const single = new CrucibleSearchResult(new Int32Array([0]), 1, 1, [0]);
    expect(single.legCount).toBe(0);
    expect(single.turnCount).toBe(0);
    expect(single.expandPath()).toEqual([0]);
  });

  it('validates bounds on settledHeatAt and constructor arguments', () => {
    const result = new CrucibleSearchResult(new Int32Array([0, 1]), 1, 2, [0, 1]);
    expect(() => result.settledHeatAt(-1, 0)).toThrow(RangeError);
    expect(() => result.settledHeatAt(1, 0)).toThrow(RangeError);
    expect(() => result.settledHeatAt(0, -1)).toThrow(RangeError);
    expect(() => result.settledHeatAt(0, 2)).toThrow(RangeError);

    expect(() => new CrucibleSearchResult(new Int32Array([0]), 0, 1, [0])).toThrow(RangeError);
    expect(() => new CrucibleSearchResult(new Int32Array([0]), 1, 0, [0])).toThrow(RangeError);
    expect(() => new CrucibleSearchResult(new Int32Array([0]), 1, 2, [0])).toThrow(RangeError);
    expect(() => new CrucibleSearchResult(new Int32Array([0]), 1, 1, [])).toThrow(RangeError);
  });

  it('computes dynamic settledCount and isComplete on CrucibleTraceFrame', () => {
    const result = new CrucibleSearchResult(new Int32Array([0, 2, -1, 5]), 2, 2, [0, 1, 3]);
    const f0 = new CrucibleTraceFrame(result, 2, 0, 2);
    const f1 = new CrucibleTraceFrame(result, 5, 1, 2);
    expect(Object.isFrozen(f0)).toBe(true);
    expect(f0.settledCount).toBe(2);
    expect(f0.isComplete).toBe(false);
    expect(f1.settledCount).toBe(3);
    expect(f1.isComplete).toBe(true);
  });
});
