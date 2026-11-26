import { describe, expect, it } from 'vitest';
import {
  buildArrangementDpTable,
  countArrangements,
  parseSpringRecords,
  reconstructWitness,
  SpringRecord,
  sumArrangements,
} from './index';

const EXAMPLE_INPUT = [
  '???.### 1,1,3',
  '.??..??...?##. 1,1,3',
  '?#?#?#?#?#?#?#? 1,3,1,6',
  '????.#...#... 4,1,1',
  '????.######..#####. 1,6,5',
  '?###???????? 3,2,1',
].join('\n');

describe('countArrangements and sumArrangements', () => {
  it('counts each official Part 1 example row individually', () => {
    const records = parseSpringRecords(EXAMPLE_INPUT);
    expect(records.map((r) => countArrangements(r))).toEqual([1n, 4n, 1n, 1n, 4n, 10n]);
  });

  it('sums official example for unfoldFactor 1 (21n) and 5 (525152n)', () => {
    const records = parseSpringRecords(EXAMPLE_INPUT);
    expect(sumArrangements(records, 1)).toBe(21n);
    expect(sumArrangements(records, 5)).toBe(525152n);
  });

  it('rejects invalid unfoldFactor in sumArrangements', () => {
    const records = parseSpringRecords('# 1');
    expect(() => sumArrangements(records, 0)).toThrow(RangeError);
  });

  it('handles zero groups (G = 0) with and without fixed #', () => {
    expect(countArrangements(new SpringRecord('???.', []))).toBe(1n);
    expect(countArrangements(new SpringRecord('.#?.', []))).toBe(0n);
  });

  it('handles impossible rows, exact-fit ends, trailing dots, and forced # boundaries', () => {
    expect(countArrangements(new SpringRecord('###', [2]))).toBe(0n);
    expect(countArrangements(new SpringRecord('##', [3]))).toBe(0n);
    expect(countArrangements(new SpringRecord('.##', [2]))).toBe(1n);
    expect(countArrangements(new SpringRecord('?##?', [2]))).toBe(1n);
    expect(countArrangements(new SpringRecord('###?', [3]))).toBe(1n);
    expect(countArrangements(new SpringRecord('#?#', [1, 1]))).toBe(1n);
    expect(countArrangements(new SpringRecord('###', [1, 1]))).toBe(0n);
  });

  it('matches combinatorics on all-wildcard patterns and preserves BigInt precision past MAX_SAFE_INTEGER', () => {
    // C(6 - 2 + 1, 2) = C(5, 2) = 10 ways to place two 1-groups in 6 '?'
    expect(countArrangements(new SpringRecord('??????', [1, 1]))).toBe(10n);
    // 100 '?' with 20 groups of 1 => C(81, 20) > 2^53 - 1
    let expected = 1n;
    for (let k = 1; k <= 20; k += 1) {
      expected = (expected * BigInt(81 - k + 1)) / BigInt(k);
    }
    const bigRec = new SpringRecord('?'.repeat(100), new Array<number>(20).fill(1));
    const ways = countArrangements(bigRec);
    expect(ways).toBeGreaterThan(BigInt(Number.MAX_SAFE_INTEGER));
    expect(ways).toBe(expected);
  });
});

describe('buildArrangementDpTable and reconstructWitness', () => {
  it('builds a frozen (G + 1) x (L + 1) matrix matching countArrangements', () => {
    const rec = new SpringRecord('???.###', [1, 1, 3]);
    const table = buildArrangementDpTable(rec);

    expect(Object.isFrozen(table)).toBe(true);
    expect(table).toHaveLength(4);
    for (const row of table) {
      expect(Object.isFrozen(row)).toBe(true);
      expect(row).toHaveLength(8);
    }
    expect(table[0]![0]).toBe(1n);
  });

  it('reconstructs valid concrete witnesses and returns null for impossible rows', () => {
    const impossible = new SpringRecord('...', [1]);
    expect(reconstructWitness(impossible, buildArrangementDpTable(impossible))).toBeNull();

    const exactEnd = new SpringRecord('?##', [2]);
    expect(reconstructWitness(exactEnd, buildArrangementDpTable(exactEnd))).toBe('.##');

    const skipAndTrailing = new SpringRecord('?#.?', [1]);
    expect(reconstructWitness(skipAndTrailing, buildArrangementDpTable(skipAndTrailing))).toBe('.#..');

    const noGroups = new SpringRecord('???', []);
    expect(reconstructWitness(noGroups, buildArrangementDpTable(noGroups))).toBe('...');
  });

  it('throws RangeError on malformed DP table dimensions', () => {
    const rec = new SpringRecord('??', [1]);
    expect(() => reconstructWitness(rec, [])).toThrow(RangeError);
    expect(() => reconstructWitness(rec, [[1n], [1n]])).toThrow(RangeError);
  });
});
