import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { PART2_UNFOLD_FACTOR, solver } from './index';

const EXAMPLE_INPUT = [
  '???.### 1,1,3',
  '.??..??...?##. 1,1,3',
  '?#?#?#?#?#?#?#? 1,3,1,6',
  '????.#...#... 4,1,1',
  '????.######..#####. 1,6,5',
  '?###???????? 3,2,1',
].join('\n');

class FakeClock implements Clock {
  private readonly timestamps: readonly number[];
  private cursor = 0;

  constructor(timestamps: readonly number[]) {
    this.timestamps = timestamps;
  }

  nowMs(): number {
    const value = this.timestamps[this.cursor] ?? this.timestamps[this.timestamps.length - 1] ?? 0;
    this.cursor += 1;
    return value;
  }
}

describe('Day 12 Part 2 solver', () => {
  it('exposes PART2_UNFOLD_FACTOR = 5 and a frozen solver', () => {
    expect(PART2_UNFOLD_FACTOR).toBe(5);
    expect(Object.isFrozen(solver)).toBe(true);
  });

  it('solves each official 5x unfolded row and sums to 525152n', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    const frames = solver.trace?.(parsed);
    expect(frames?.map((frame) => frame.arrangements)).toEqual([
      1n,
      16384n,
      1n,
      16n,
      2500n,
      506250n,
    ]);
    expect(solver.solve(parsed)).toBe(525152n);
  });

  it('unfolds .# 1 by 5x with ? separators and repeated groups', () => {
    const parsed = solver.parse('.# 1');
    const frames = solver.trace?.(parsed);
    expect(frames).toHaveLength(1);
    expect(frames?.[0]?.record.pattern).toBe('.#?.#?.#?.#?.#');
    expect(frames?.[0]?.record.groups).toEqual([1, 1, 1, 1, 1]);
    expect(solver.solve(parsed)).toBe(1n);
  });

  it('supports default and bounded maxSteps while rejecting invalid maxSteps', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    const full = solver.trace?.(parsed);
    expect(full).toHaveLength(6);
    expect(full?.[5]?.cumulativeTotal).toBe(525152n);

    const bounded = solver.trace?.(parsed, { maxSteps: 3 });
    expect(bounded).toHaveLength(3);
    expect(bounded?.[0]?.rowIndex).toBe(0);
    expect(bounded?.[2]?.rowIndex).toBe(5);
    expect(bounded?.[2]?.cumulativeTotal).toBe(525152n);

    for (const invalid of [0, -1, 1.5, Number.NaN]) {
      expect(() => solver.trace?.(parsed, { maxSteps: invalid })).toThrow(RangeError);
    }
  });

  it('rejects malformed spring condition inputs at parse boundary', () => {
    expect(() => solver.parse('   \n\t ')).toThrow(RangeError);
    expect(() => solver.parse('???.###')).toThrow(SyntaxError);
    expect(() => solver.parse('??x.### 1,1,3')).toThrow(RangeError);
    expect(() => solver.parse('???.### 1,0,3')).toThrow(RangeError);
    expect(() => solver.parse('???.### 1,abc,3')).toThrow(RangeError);
  });

  it('executes with exact BigInt and hand-written fake Clock', () => {
    const execution = executeSolver(solver, EXAMPLE_INPUT, new FakeClock([12.5, 19.75]));
    expect(execution).toEqual({
      answer: 525152n,
      runtime: 'main-thread',
      elapsedMs: 7.25,
    });
  });

  it('preserves exact BigInt precision above Number.MAX_SAFE_INTEGER', () => {
    const parsed = solver.parse('???????????????????? 1,1,1,1');
    const answer = solver.solve(parsed);
    expect(answer).toBe(14039383165867025505n);
    expect(answer > BigInt(Number.MAX_SAFE_INTEGER)).toBe(true);
    expect(BigInt(Number(answer))).not.toBe(answer);
  });
});
