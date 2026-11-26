import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { PART2_KNOT_COUNT, solver } from './index';

const SMALL_EXAMPLE = ['R 4', 'U 4', 'L 3', 'D 1', 'R 4', 'D 1', 'L 5', 'R 2'].join('\n');
const LARGE_EXAMPLE = ['R 5', 'U 8', 'L 8', 'D 3', 'R 17', 'D 10', 'L 25', 'U 20'].join('\n');

describe('2022 Day 9 Part 2 solver', () => {
  it('exports PART2_KNOT_COUNT = 10 and a frozen solver', () => {
    expect(PART2_KNOT_COUNT).toBe(10);
    expect(Object.isFrozen(solver)).toBe(true);
  });

  it('returns 1 on the official small example', () => {
    const plan = solver.parse(SMALL_EXAMPLE);
    expect(solver.solve(plan)).toBe(1);
    expect(executeSolver(solver, SMALL_EXAMPLE).answer).toBe(1);
  });

  it('returns 36 on the official large example', () => {
    const plan = solver.parse(LARGE_EXAMPLE);
    expect(solver.solve(plan)).toBe(36);
    expect(executeSolver(solver, LARGE_EXAMPLE).answer).toBe(36);
  });

  it('produces default and bounded 10-knot traces preserving all 36 tail visits', () => {
    const plan = solver.parse(LARGE_EXAMPLE);
    const full = solver.trace(plan);
    expect(full).toHaveLength(97);
    expect(full[0]!.knotCount).toBe(10);
    expect(full[0]!.stepIndex).toBe(0);
    expect(full[0]!.commandIndex).toBe(-1);
    expect(full[96]!.isComplete).toBe(true);
    expect(full.reduce((sum, f) => sum + f.newlyVisitedCount, 0)).toBe(36);

    const bounded = solver.trace(plan, { maxSteps: 10 });
    expect(bounded).toHaveLength(10);
    expect(bounded[0]!.stepIndex).toBe(0);
    expect(bounded[9]!.isComplete).toBe(true);
    expect(bounded.reduce((sum, f) => sum + f.newlyVisitedCount, 0)).toBe(36);
  });

  it('matches exact tail-movement threshold boundaries at R 1, R 9, and R 10', () => {
    expect(solver.solve(solver.parse('R 1'))).toBe(1);
    expect(solver.solve(solver.parse('R 9'))).toBe(1);
    expect(solver.solve(solver.parse('R 10'))).toBe(2);
  });

  it('rejects empty and whitespace-only inputs', () => {
    expect(() => solver.parse('')).toThrow(Error);
    expect(() => solver.parse('   \n  \t ')).toThrow(Error);
  });

  it('rejects malformed motion command lines individually', () => {
    expect(() => solver.parse('R 0')).toThrow(Error);
    expect(() => solver.parse('U -3')).toThrow(Error);
    expect(() => solver.parse('X 4')).toThrow(Error);
    expect(() => solver.parse('R 2.5')).toThrow(Error);
    expect(() => solver.parse('R')).toThrow(Error);
  });

  it('rejects non-positive maxSteps in trace options', () => {
    const plan = solver.parse('R 1');
    expect(() => solver.trace(plan, { maxSteps: 0 })).toThrow(RangeError);
  });
});
