import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { EXAMPLE_SPRINGDROID_PROGRAM, EXAMPLE_WALK_ANSWER } from '../../shared';
import { solver } from './index';

describe('2019 Day 21 Part 1 solver', () => {
  it('solves the example WALK Intcode program via executeSolver', () => {
    const result = executeSolver(solver, EXAMPLE_SPRINGDROID_PROGRAM);
    expect(result.answer).toBe(EXAMPLE_WALK_ANSWER);
  });

  it('produces bounded WALK trace frames and rejects invalid inputs', () => {
    const frames = solver.trace(solver.parse(EXAMPLE_SPRINGDROID_PROGRAM), { maxSteps: 10 });
    expect(frames.length).toBe(10);
    expect(frames[0]?.mode).toBe('WALK');
    expect(frames[9]?.hullDamage).toBe(EXAMPLE_WALK_ANSWER);
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.solve(solver.parse('99'))).toThrow(/did not report/);
  });
});
