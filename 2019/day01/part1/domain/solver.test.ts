import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solver } from './index';

describe('2019 Day 1 Part 1 solver', () => {
  it('solves each official example mass and combined example manifest', () => {
    expect(solver.solve(solver.parse('12'))).toBe(2);
    expect(solver.solve(solver.parse('14'))).toBe(2);
    expect(solver.solve(solver.parse('1969'))).toBe(654);
    expect(solver.solve(solver.parse('100756'))).toBe(33583);
    expect(executeSolver(solver, '12\n14\n1969\n100756').answer).toBe(34241);
  });

  it('produces single-stage trace frames bounded by maxSteps with exact cumulative totals', () => {
    const manifest = solver.parse('12\n14\n1969\n100756');
    const frames = solver.trace(manifest, { maxSteps: 3 });
    expect(frames.length).toBe(3);
    expect(frames.map((frame) => frame.moduleIndex)).toEqual([0, 2, 3]);
    expect(frames[2]!.baseFuel).toBe(33583);
    expect(frames[2]!.extraFuel).toBe(0);
    expect(frames[2]!.cumulativeFuel).toBe(34241);
  });

  it('rejects invalid input via parse', () => {
    expect(() => solver.parse('')).toThrow(Error);
    expect(() => solver.parse('12\ninvalid')).toThrow(Error);
  });
});
