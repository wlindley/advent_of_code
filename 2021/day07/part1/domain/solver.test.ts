import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { LINEAR_FUEL_MODEL } from '../../shared';
import { solver } from './index';

describe('2021 Day 7 Part 1 solver', () => {
  it('binds the linear fuel cost model', () => {
    expect(solver.model).toBe(LINEAR_FUEL_MODEL);
  });

  it('solves the official example via direct call and executeSolver', () => {
    const raw = '16,1,2,0,4,2,7,1,2,14';
    const fleet = solver.parse(raw);
    expect(solver.solve(fleet)).toBe(37n);

    const execution = executeSolver(solver, raw);
    expect(execution.answer).toBe(37n);
    expect(execution.runtime).toBe('main-thread');
  });

  it('traces search convergence and propagates parse/trace errors', () => {
    const fleet = solver.parse('16,1,2,0,4,2,7,1,2,14');
    const frames = solver.trace(fleet);
    expect(frames[frames.length - 1]!.mid).toBe(2n);
    expect(frames[frames.length - 1]!.midFuel).toBe(37n);
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('1,bad')).toThrow(SyntaxError);
    expect(() => solver.trace(fleet, { maxSteps: 0 })).toThrow(RangeError);
  });
});
