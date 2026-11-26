import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { PART1_STEPS, solvePart1, solver } from './index';

const EXAMPLE_INPUT = ['1', '10', '100', '2024'].join('\n');

describe('Day 22 Part 1 solver', () => {
  it('uses 2000 PRNG steps and solves the official Part 1 example', () => {
    expect(PART1_STEPS).toBe(2_000);
    const seeds = solver.parse(EXAMPLE_INPUT);
    expect(seeds).toEqual([1, 10, 100, 2024]);
    expect(solvePart1(seeds)).toBe(37_327_623n);
    expect(solver.solve(seeds)).toBe(37_327_623n);
  });

  it('executes via shared executeSolver and produces bounded trace snapshots', () => {
    const execution = executeSolver(solver, EXAMPLE_INPUT);
    expect(execution.answer).toBe(37_327_623n);
    expect(execution.runtime).toBe('main-thread');

    const frames = solver.trace!(solver.parse(EXAMPLE_INPUT), { maxSteps: 3 });
    expect(frames).toHaveLength(3);
    expect(frames[frames.length - 1]!.isComplete).toBe(true);
    expect(frames[frames.length - 1]!.totalFinalSecret).toBe(37_327_623n);
  });

  it('rejects empty or invalid raw inputs', () => {
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('-5')).toThrow(RangeError);
  });
});
