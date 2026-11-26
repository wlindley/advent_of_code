import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { createCosmicExpansionSolver } from '../../shared';
import { PART1_EXPANSION_FACTOR, solver } from './index';

const EXAMPLE_RAW = [
  '...#......',
  '.......#..',
  '#.........',
  '..........',
  '......#...',
  '.#........',
  '.........#',
  '..........',
  '.......#..',
  '#...#.....',
].join('\n');

describe('2023 Day 11 Part 1 solver', () => {
  it('uses expansion factor 2n and produces a frozen solver', () => {
    expect(PART1_EXPANSION_FACTOR).toBe(2n);
    expect(Object.isFrozen(solver)).toBe(true);
  });

  it('solves the official AoC example to 374n', () => {
    const parsed = solver.parse(EXAMPLE_RAW);
    expect(solver.solve(parsed)).toBe(374n);
  });

  it('produces default and bounded traces matching the final total', () => {
    const parsed = solver.parse(EXAMPLE_RAW);
    const fullTrace = solver.trace!(parsed);
    expect(fullTrace).toHaveLength(20);
    expect(fullTrace[fullTrace.length - 1]!.runningTotal).toBe(374n);

    const bounded = solver.trace!(parsed, { maxSteps: 5 });
    expect(bounded).toHaveLength(5);
    expect(bounded[4]!.runningTotal).toBe(374n);
  });

  it('integrates cleanly with executeSolver', () => {
    const result = executeSolver(solver, EXAMPLE_RAW);
    expect(result.answer).toBe(374n);
    expect(result.runtime).toBe('main-thread');
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('validates expansion factor eagerly in createCosmicExpansionSolver', () => {
    expect(() => createCosmicExpansionSolver(0n)).toThrow(RangeError);
    expect(() => createCosmicExpansionSolver(-10n)).toThrow(RangeError);
  });
});
