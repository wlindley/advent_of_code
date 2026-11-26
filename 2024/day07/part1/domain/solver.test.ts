import { describe, expect, it } from 'vitest';
import { solver, solvePart1, tracePart1 } from './solver';

const EXAMPLE_INPUT = [
  '190: 10 19',
  '3267: 81 40 27',
  '83: 17 5',
  '156: 15 6',
  '7290: 6 8 6 15',
  '161011: 16 10 13',
  '192: 17 8 14',
  '21037: 9 7 18 13',
  '292: 11 6 16 20',
].join('\n');

describe('2024 Day 7 Part 1 solver', () => {
  it('solves the official 9-equation example to 3749n', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    expect(parsed).toHaveLength(9);
    expect(solvePart1(parsed)).toBe(3749n);
    expect(solver.solve(parsed)).toBe(3749n);
  });

  it('produces trace frames ending at 3749n with 3 solved and 6 unsolved', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    const frames = tracePart1(parsed);
    expect(frames).toHaveLength(9);
    const last = frames[frames.length - 1]!;
    expect(last.runningTotal).toBe(3749n);
    expect(last.solvedSoFar).toBe(3);
    expect(last.unsolvedSoFar).toBe(6);

    const sampled = solver.trace!(parsed, { maxSteps: 3 });
    expect(sampled).toHaveLength(3);
    expect(sampled[2]!.runningTotal).toBe(3749n);
  });

  it('handles huge bigint targets above 2^60 accurately', () => {
    const bigInput = [
      '2305843009213693953: 1152921504606846976 2 1',
      '4611686018427387904: 2147483648 2147483648',
      '4611686018427387905: 2147483648 2147483648 2',
    ].join('\n');
    const parsed = solver.parse(bigInput);
    expect(solver.solve(parsed)).toBe(2305843009213693953n + 4611686018427387904n);
  });
});
