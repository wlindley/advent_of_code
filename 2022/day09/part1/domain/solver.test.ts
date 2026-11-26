import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { PART1_KNOT_COUNT, solver } from './solver';

const EXAMPLE_INPUT = ['R 4', 'U 4', 'L 3', 'D 1', 'R 4', 'D 1', 'L 5', 'R 2'].join('\n');

describe('2022 Day 9 Part 1 solver', () => {
  it('exports a frozen 2-knot solver matching the official example', () => {
    expect(PART1_KNOT_COUNT).toBe(2);
    expect(Object.isFrozen(solver)).toBe(true);
    const plan = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(plan)).toBe(13);
    expect(executeSolver(solver, EXAMPLE_INPUT).answer).toBe(13);
  });

  it('produces sampled 2-knot trace frames whose tail visits sum to 13', () => {
    const plan = solver.parse(EXAMPLE_INPUT);
    const frames = solver.trace(plan, { maxSteps: 6 });
    expect(frames).toHaveLength(6);
    expect(frames[0]!.knotCount).toBe(2);
    expect(frames[5]!.isComplete).toBe(true);
    expect(frames.reduce((sum, f) => sum + f.newlyVisitedCount, 0)).toBe(13);
  });

  it('propagates parse errors on invalid input', () => {
    expect(() => solver.parse('')).toThrow(Error);
    expect(() => solver.parse('R 0')).toThrow(Error);
  });
});
