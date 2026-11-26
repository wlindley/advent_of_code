import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { createCosmicExpansionSolver } from '../../shared';
import { PART2_EXPANSION_FACTOR, solver } from './index';

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

describe('2023 Day 11 Part 2 solver', () => {
  it('uses expansion factor 1_000_000n and produces a frozen solver', () => {
    expect(PART2_EXPANSION_FACTOR).toBe(1_000_000n);
    expect(Object.isFrozen(solver)).toBe(true);
  });

  it('solves the official AoC example at 10n, 100n, and 1_000_000n', () => {
    const parsed = solver.parse(EXAMPLE_RAW);
    expect(createCosmicExpansionSolver(10n).solve(parsed)).toBe(1030n);
    expect(createCosmicExpansionSolver(100n).solve(parsed)).toBe(8410n);
    expect(solver.solve(parsed)).toBe(82_000_210n);
  });

  it('handles 0 galaxies, 1 galaxy, and grids with 0 empty rifts', () => {
    expect(solver.solve(solver.parse('...\n...'))).toBe(0n);
    expect(solver.solve(solver.parse('...\n.#.\n...'))).toBe(0n);
    expect(solver.solve(solver.parse('#.\n.#'))).toBe(2n);
  });

  it('handles leading/trailing, single interior, and adjacent interior rifts', () => {
    expect(solver.solve(solver.parse('...\n#.#\n...'))).toBe(1_000_001n);
    expect(solver.solve(solver.parse('#.#'))).toBe(1_000_001n);
    expect(solver.solve(solver.parse('#..#'))).toBe(2_000_001n);
  });

  it('handles same row/col galaxies and a non-square 3x7 grid', () => {
    expect(solver.solve(solver.parse('##'))).toBe(1n);
    expect(solver.solve(solver.parse('#\n#\n#'))).toBe(4n);
    expect(solver.solve(solver.parse('#....#.\n.......\n...#...'))).toBe(8_000_006n);
  });

  it('rejects empty, jagged, and invalid-character inputs separately', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('..\n.')).toThrow();
    expect(() => solver.parse('.X')).toThrow();
  });

  it('produces default and bounded traces with 1_000_000n rift stepWidth', () => {
    const parsed = solver.parse(EXAMPLE_RAW);
    const fullTrace = solver.trace!(parsed);
    expect(fullTrace).toHaveLength(20);
    for (const frame of fullTrace) {
      expect(frame.stepWidth).toBe(frame.isEmptyRift ? 1_000_000n : 1n);
    }
    expect(fullTrace[fullTrace.length - 1]!.runningTotal).toBe(82_000_210n);

    const bounded = solver.trace!(parsed, { maxSteps: 5 });
    expect(bounded).toHaveLength(5);
    expect(bounded[4]!.runningTotal).toBe(82_000_210n);
  });

  it('integrates cleanly with executeSolver', () => {
    const result = executeSolver(solver, EXAMPLE_RAW);
    expect(result.answer).toBe(82_000_210n);
    expect(result.runtime).toBe('main-thread');
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });
});
