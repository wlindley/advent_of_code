import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { solver } from './index';

const EXAMPLE_INPUT = [
  '0,9 -> 5,9',
  '8,0 -> 0,8',
  '9,4 -> 3,4',
  '2,2 -> 2,1',
  '7,0 -> 7,4',
  '6,4 -> 2,0',
  '0,9 -> 2,9',
  '3,4 -> 1,4',
  '0,0 -> 8,8',
  '5,5 -> 8,2',
].join('\n');

const FIXED_CLOCK: Clock = Object.freeze({ nowMs: () => 42 });

describe('2021 Day 5 Part 1 solver', () => {
  it('solves the official example to 5', () => {
    const field = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(field)).toBe(5);
  });

  it('integrates with executeSolver and propagates parse errors', () => {
    const result = executeSolver(solver, EXAMPLE_INPUT, FIXED_CLOCK);
    expect(result.answer).toBe(5);
    expect(result.elapsedMs).toBe(0);
    expect(result.runtime).toBe('main-thread');
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('0,9 -> bad')).toThrow(SyntaxError);
  });

  it('produces default and maxSteps-bounded trace frames', () => {
    const field = solver.parse(EXAMPLE_INPUT);
    const full = solver.trace!(field);
    expect(full).toHaveLength(10);
    expect(full[9]!.overlapCount).toBe(5);

    const bounded = solver.trace!(field, { maxSteps: 4 });
    expect(bounded.map((frame) => frame.stepIndex)).toEqual([0, 3, 6, 9]);
    expect(bounded[3]!.overlapCount).toBe(5);
  });
});
