import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solvePart2, solver, tracePart2 } from './index';

const T_EXAMPLE = [
  'T.........',
  '...T......',
  '.T........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
].join('\n');

const OFFICIAL_EXAMPLE = [
  '............',
  '........0...',
  '.....0......',
  '.......0....',
  '....0.......',
  '......A.....',
  '............',
  '............',
  '........A...',
  '.........A..',
  '............',
  '............',
].join('\n');

function makeGrid(rows: number, cols: number, points: readonly [number, number, string][]): string {
  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => '.'));
  for (const [r, c, ch] of points) grid[r]![c] = ch;
  return grid.map((row) => row.join('')).join('\n');
}

describe('2024 Day 8 Part 2 solver', () => {
  it('solves the official 10x10 T harmonic example (9)', () => {
    const map = solver.parse(T_EXAMPLE);
    expect(solvePart2(map)).toBe(9);
    expect(solver.solve(map)).toBe(9);
  });

  it('solves the official 12x12 example (34)', () => {
    const map = solver.parse(OFFICIAL_EXAMPLE);
    expect(solvePart2(map)).toBe(34);
    expect(solver.solve(map)).toBe(34);

    const frames = tracePart2(map);
    expect(frames.length).toBe(map.totalPairs);
    expect(frames[frames.length - 1]!.uniqueCount).toBe(34);
  });

  it('handles empty grids, singletons only, and case-sensitive frequencies', () => {
    expect(solvePart2(solver.parse('...\n...'))).toBe(0);
    expect(solvePart2(solver.parse('a..\n.0.\n..Z'))).toBe(0);
    expect(solvePart2(solver.parse('a...A'))).toBe(0);
  });

  it('includes interior lattice nodes for non-coprime horizontal and diagonal pairs', () => {
    expect(solvePart2(solver.parse('a...a'))).toBe(5);
    const diag = makeGrid(5, 5, [
      [0, 0, 'x'],
      [4, 2, 'x'],
    ]);
    expect(solvePart2(solver.parse(diag))).toBe(3);
  });

  it('supports bounded tracePart2, solver.trace!, and executeSolver', () => {
    const map = solver.parse(OFFICIAL_EXAMPLE);
    const boundedTrace = tracePart2(map, { maxSteps: 3 });
    expect(boundedTrace).toHaveLength(3);
    expect(boundedTrace[2]!.uniqueCount).toBe(34);

    const solverTrace = solver.trace!(map, { maxSteps: 3 });
    expect(solverTrace).toHaveLength(3);
    expect(solverTrace[2]!.uniqueCount).toBe(34);

    const execution = executeSolver(solver, OFFICIAL_EXAMPLE, { nowMs: () => 42 });
    expect(execution.answer).toBe(34);
    expect(execution.elapsedMs).toBe(0);
    expect(execution.runtime).toBe('main-thread');
  });
});
