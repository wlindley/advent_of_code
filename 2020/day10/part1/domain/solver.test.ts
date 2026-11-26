import { describe, expect, it } from 'vitest';
import { solver } from './index';

const SMALL_EXAMPLE = [16, 10, 15, 5, 1, 11, 7, 19, 6, 12, 4].join('\n');

const LARGER_EXAMPLE = [
  28, 33, 18, 42, 31, 14, 46, 20, 48, 47, 24, 23, 49, 45, 19, 38,
  39, 11, 1, 32, 25, 35, 8, 17, 7, 9, 4, 2, 34, 10, 3,
].join('\n');

describe('2020 Day 10 Part 1 solver', () => {
  it('computes 1-jolt * 3-jolt product for both official examples', () => {
    expect(solver.solve(solver.parse(SMALL_EXAMPLE))).toBe(35n);
    expect(solver.solve(solver.parse(LARGER_EXAMPLE))).toBe(220n);
  });

  it('produces difference trace frames bounded by maxSteps', () => {
    const chain = solver.parse(LARGER_EXAMPLE);
    const frames = solver.trace(chain, { maxSteps: 8 });
    expect(frames).toHaveLength(8);
    expect(frames[0]!.phase).toBe('differences');
    expect(frames[7]!.isComplete).toBe(true);
    expect(frames[7]!.phase === 'differences' ? frames[7]!.histogram.part1Product : 0n).toBe(220n);
  });

  it('rejects invalid input chains', () => {
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('1\n5')).toThrow(RangeError);
    expect(() => solver.parse('1\n1')).toThrow(/Duplicate/);
    expect(() => solver.parse('1\nbad')).toThrow(SyntaxError);
  });
});
