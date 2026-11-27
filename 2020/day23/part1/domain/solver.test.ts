import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solver } from './index';

const OFFICIAL_EXAMPLE = '389125467';

describe('2020 Day 23 Part 1 solver', () => {
  it('solves the official Crab Cups example to 67384529', () => {
    const result = executeSolver(solver, OFFICIAL_EXAMPLE);
    expect(result.answer).toBe('67384529');
  });

  it('bounds trace frames with omitted and explicit maxSteps', () => {
    const spec = solver.parse(OFFICIAL_EXAMPLE);
    const full = solver.trace(spec);
    expect(full.length).toBe(101);
    expect(full[0]!.move).toBe(0);
    expect(full[100]!.labelsAfterOne).toBe('67384529');

    const bounded = solver.trace(spec, { maxSteps: 6 });
    expect(bounded.length).toBe(6);
    expect(bounded[0]!.move).toBe(0);
    expect(bounded[5]!.move).toBe(100);
  });

  it('rejects malformed inputs and invalid trace maxSteps', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('123')).toThrow(RangeError);
    expect(() => solver.trace(solver.parse(OFFICIAL_EXAMPLE), { maxSteps: 0 })).toThrow(RangeError);
  });
});
