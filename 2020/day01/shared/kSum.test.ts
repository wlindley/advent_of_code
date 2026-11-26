import { describe, expect, it } from 'vitest';
import { parseExpenseReport } from './expenseReport';
import { ExpenseMatch, findKSumTuple, TARGET_EXPENSE_SUM } from './kSum';
import { traceKSumSearch } from './kSumTrace';

const EXAMPLE_RAW = '1721\n979\n366\n299\n675\n1456';

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
}

function bruteForceKSum(values: readonly number[], k: number, target: number): number | null {
  if (k === 2) {
    for (let i = 0; i < values.length; i += 1) {
      for (let j = i + 1; j < values.length; j += 1) {
        if (values[i]! + values[j]! === target) return values[i]! * values[j]!;
      }
    }
    return null;
  }
  for (let i = 0; i < values.length; i += 1) {
    for (let j = i + 1; j < values.length; j += 1) {
      for (let m = j + 1; m < values.length; m += 1) {
        if (values[i]! + values[j]! + values[m]! === target) {
          return values[i]! * values[j]! * values[m]!;
        }
      }
    }
  }
  return null;
}

describe('ExpenseMatch', () => {
  it('computes dynamic sum/product and rejects fewer than two entries', () => {
    const match = new ExpenseMatch([
      { originalIndex: 0, value: 1721 },
      { originalIndex: 3, value: 299 },
    ]);
    expect(Object.isFrozen(match)).toBe(true);
    expect(Object.isFrozen(match.entries)).toBe(true);
    expect(match.sum).toBe(2020);
    expect(match.product).toBe(514579);
    expect(() => new ExpenseMatch([{ originalIndex: 0, value: 2020 }])).toThrow(RangeError);
  });
});

describe('findKSumTuple', () => {
  it('solves the official example for k = 2 and k = 3', () => {
    const report = parseExpenseReport(EXAMPLE_RAW);
    const pair = findKSumTuple(report, 2, TARGET_EXPENSE_SUM);
    const triple = findKSumTuple(report, 3, TARGET_EXPENSE_SUM);
    expect(pair?.sum).toBe(2020);
    expect(pair?.product).toBe(514579);
    expect(triple?.sum).toBe(2020);
    expect(triple?.product).toBe(241861950);
  });

  it('handles k = 4 matches and misses, duplicate-half traps, and zero products', () => {
    const quadReport = parseExpenseReport('10\n20\n30\n1960\n50');
    expect(findKSumTuple(quadReport, 4, TARGET_EXPENSE_SUM)?.product).toBe(10 * 20 * 30 * 1960);
    expect(findKSumTuple(quadReport, 4, 99999)).toBeNull();

    expect(findKSumTuple(parseExpenseReport('1010\n500\n1500'), 2, TARGET_EXPENSE_SUM)).toBeNull();
    expect(findKSumTuple(parseExpenseReport('1010\n1010'), 2, TARGET_EXPENSE_SUM)?.product).toBe(1020100);

    const zeroMatch = findKSumTuple(parseExpenseReport('0\n2020'), 2, TARGET_EXPENSE_SUM);
    expect(zeroMatch?.sum).toBe(2020);
    expect(zeroMatch?.product).toBe(0);
  });

  it('rejects invalid tupleSize, target, and undersized reports', () => {
    const report = parseExpenseReport('100\n200');
    expect(() => findKSumTuple(report, 1, 2020)).toThrow(RangeError);
    expect(() => findKSumTuple(report, 2.5, 2020)).toThrow(RangeError);
    expect(() => findKSumTuple(report, 2, -1)).toThrow(RangeError);
    expect(() => findKSumTuple(report, 2, 1.5)).toThrow(RangeError);
    expect(() => findKSumTuple(report, 2, Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
    expect(() => findKSumTuple(report, 3, 2020)).toThrow(RangeError);
  });

  it('matches a brute-force oracle across seeded random k = 2 and k = 3 cases', () => {
    const next = createRng(20201201);
    for (let trial = 0; trial < 40; trial += 1) {
      const length = 4 + (next() % 10);
      const values = Array.from({ length }, () => next() % 60);
      const report = parseExpenseReport(values.join('\n'));
      const target = 20 + (next() % 100);
      for (const k of [2, 3] as const) {
        const expected = bruteForceKSum(values, k, target);
        const actual = findKSumTuple(report, k, target);
        if (expected === null) {
          expect(actual).toBeNull();
        } else {
          expect(actual).not.toBeNull();
          expect(actual!.sum).toBe(target);
        }
      }
    }
  });
});

describe('traceKSumSearch', () => {
  it('traces k = 2 and k = 3 searches with frozen non-aliased frames', () => {
    const report = parseExpenseReport(EXAMPLE_RAW);
    const frames2 = traceKSumSearch(report, 2, TARGET_EXPENSE_SUM);
    const last2 = frames2.at(-1)!;
    expect(frames2).toHaveLength(1);
    expect(last2.verdict).toBe('match');
    expect(last2.target).toBe(2020);
    expect(last2.sum).toBe(2020);
    expect(last2.delta).toBe(0);
    expect(last2.product).toBe(514579);
    expect(last2.anchorPositions).toEqual([]);
    expect(last2.selectedPositions).toEqual([last2.leftPos, last2.rightPos]);

    const frames3 = traceKSumSearch(report, 3, TARGET_EXPENSE_SUM);
    const last3 = frames3.at(-1)!;
    expect(frames3.length).toBeGreaterThan(1);
    expect(last3.verdict).toBe('match');
    expect(last3.product).toBe(241861950);
    expect(last3.anchorPositions.length).toBe(1);
    expect(Object.isFrozen(frames3[0])).toBe(true);
    expect(Object.isFrozen(frames3[0]!.anchorPositions)).toBe(true);
    expect(frames3[0]!.selectedEntries.length).toBe(3);
  });

  it('bounds trace frames with maxSteps and records misses accurately', () => {
    const report = parseExpenseReport(EXAMPLE_RAW);
    const capped = traceKSumSearch(report, 3, TARGET_EXPENSE_SUM, 3);
    expect(capped).toHaveLength(3);
    expect(capped.at(-1)!.verdict).toBe('match');

    const single = traceKSumSearch(report, 3, TARGET_EXPENSE_SUM, 1);
    expect(single).toHaveLength(1);
    expect(single[0]!.verdict).toBe('match');

    const missFrames = traceKSumSearch(parseExpenseReport('100\n200\n1900'), 2, 1200);
    expect(missFrames.some((frame) => frame.verdict === 'too-low' && frame.delta < 0)).toBe(true);
    expect(missFrames.some((frame) => frame.verdict === 'too-high' && frame.delta > 0)).toBe(true);
    expect(missFrames.every((frame) => frame.product === null)).toBe(true);

    expect(() => traceKSumSearch(report, 2, 2020, 0)).toThrow(RangeError);
    expect(() => traceKSumSearch(report, 2, 2020, 1.5)).toThrow(RangeError);
  });
});
