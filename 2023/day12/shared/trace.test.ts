import { describe, expect, it } from 'vitest';
import {
  buildHotSpringsTrace,
  DEFAULT_MAX_TRACE_STEPS,
  parseSpringRecords,
  SpringRecord,
} from './index';

const EXAMPLE_INPUT = [
  '???.### 1,1,3',
  '.??..??...?##. 1,1,3',
  '?#?#?#?#?#?#?#? 1,3,1,6',
  '????.#...#... 4,1,1',
  '????.######..#####. 1,6,5',
  '?###???????? 3,2,1',
].join('\n');

describe('buildHotSpringsTrace', () => {
  it('traces all 6 official example rows at unfoldFactor 1', () => {
    const records = parseSpringRecords(EXAMPLE_INPUT);
    const frames = buildHotSpringsTrace(records, 1);

    expect(DEFAULT_MAX_TRACE_STEPS).toBe(80);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(6);
    expect(frames.map((f) => f.arrangements)).toEqual([1n, 4n, 1n, 1n, 4n, 10n]);
    expect(frames.map((f) => f.cumulativeTotal)).toEqual([1n, 5n, 6n, 7n, 11n, 21n]);
    expect(frames[0]?.rowIndex).toBe(0);
    expect(frames[0]?.totalRows).toBe(6);
    expect(Object.isFrozen(frames[0])).toBe(true);
  });

  it('traces unfolded 5x records with final cumulativeTotal 525152n', () => {
    const records = parseSpringRecords(EXAMPLE_INPUT);
    const frames = buildHotSpringsTrace(records, 5);

    expect(frames).toHaveLength(6);
    expect(frames[0]?.record.pattern).toBe('???.###????.###????.###????.###????.###');
    expect(frames[5]?.cumulativeTotal).toBe(525152n);
  });

  it('bounds trace frames on 200 rows with maxSteps 10 and maxSteps 1', () => {
    const records = Array.from({ length: 200 }, () => new SpringRecord('??', [1]));

    const sampled10 = buildHotSpringsTrace(records, 1, { maxSteps: 10 });
    expect(sampled10).toHaveLength(10);
    expect(sampled10[0]?.rowIndex).toBe(0);
    expect(sampled10[9]?.rowIndex).toBe(199);
    expect(sampled10[9]?.cumulativeTotal).toBe(400n);

    const sampled1 = buildHotSpringsTrace(records, 1, { maxSteps: 1 });
    expect(sampled1).toHaveLength(1);
    expect(sampled1[0]?.rowIndex).toBe(199);
    expect(sampled1[0]?.cumulativeTotal).toBe(400n);
  });

  it('returns an empty frozen trace for empty records', () => {
    const frames = buildHotSpringsTrace([], 1);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toEqual([]);
  });

  it('validates unfoldFactor and maxSteps even when records is empty', () => {
    expect(() => buildHotSpringsTrace([], 0)).toThrow(RangeError);
    expect(() => buildHotSpringsTrace([], 1, { maxSteps: 0 })).toThrow(RangeError);
  });
});
