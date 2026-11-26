import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { PART1_WINDOW_SIZE, solver } from './index';

const EXAMPLE_INPUT = '199\n200\n208\n210\n200\n207\n240\n269\n260\n263';

describe('2021 day 1 part 1 solver', () => {
  it('uses stride W=1 and solves the official example', () => {
    expect(PART1_WINDOW_SIZE).toBe(1);
    const report = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(report)).toBe(7);
  });

  it('handles edge cases and propagates parser errors', () => {
    expect(solver.solve(solver.parse('199'))).toBe(0);
    expect(solver.solve(solver.parse('10\n10\n9\n8'))).toBe(0);
    expect(solver.solve(solver.parse('1\n2\n3\n4'))).toBe(3);
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('abc')).toThrow(SyntaxError);
  });

  it('traces single-step depth comparisons and respects maxSteps', () => {
    const report = solver.parse(EXAMPLE_INPUT);
    const frames = solver.trace!(report);
    expect(frames).toHaveLength(9);
    expect(frames[frames.length - 1]?.increasesSoFar).toBe(7);

    const sampled = solver.trace!(report, { maxSteps: 3 });
    expect(sampled).toHaveLength(3);
    expect(sampled[2]?.increasesSoFar).toBe(7);
    expect(solver.trace!(solver.parse('42'))).toEqual([]);
    expect(() => solver.trace!(report, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('integrates with executeSolver', () => {
    const execution = executeSolver(solver, EXAMPLE_INPUT, { nowMs: () => 10 });
    expect(execution).toEqual({
      answer: 7,
      elapsedMs: 0,
      runtime: 'main-thread',
    });
  });
});
