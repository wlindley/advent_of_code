import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solvePart1, solver, tracePart1 } from './solver';

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

describe('2024 Day 8 Part 1 solver', () => {
  it('solves the official 12x12 example (14, including antenna overlap and cross-frequency dedup)', () => {
    const map = solver.parse(OFFICIAL_EXAMPLE);
    expect(solvePart1(map)).toBe(14);
    expect(solver.solve(map)).toBe(14);

    const frames = tracePart1(map);
    expect(frames.length).toBe(map.totalPairs);
    expect(frames[frames.length - 1]!.uniqueCount).toBe(14);
    expect(frames[frames.length - 1]!.cumulativeAntinodes.some((p) => p.row === 5 && p.col === 6)).toBe(true);
  });

  it('solves all three 10x10 progression sub-examples', () => {
    const twoAntennas = makeGrid(10, 10, [
      [3, 4, 'a'],
      [5, 5, 'a'],
    ]);
    const threeAntennas = makeGrid(10, 10, [
      [3, 4, 'a'],
      [4, 8, 'a'],
      [5, 5, 'a'],
    ]);
    const withSingletonA = makeGrid(10, 10, [
      [3, 4, 'a'],
      [4, 8, 'a'],
      [5, 5, 'a'],
      [4, 4, 'A'],
    ]);

    expect(solvePart1(solver.parse(twoAntennas))).toBe(2);
    expect(solvePart1(solver.parse(threeAntennas))).toBe(4);
    expect(solvePart1(solver.parse(withSingletonA))).toBe(4);
  });

  it('handles edge cases: empty, singletons, case sensitivity, and small collinear clusters', () => {
    expect(solvePart1(solver.parse('...\n...'))).toBe(0);
    expect(solvePart1(solver.parse('a..\n.0.\n..Z'))).toBe(0);
    expect(solvePart1(solver.parse('a..A'))).toBe(0);
    expect(solvePart1(solver.parse('.aa.'))).toBe(2);
    expect(solvePart1(solver.parse('aa'))).toBe(0);
    expect(solvePart1(solver.parse('.aaa.'))).toBe(4);
  });

  it('supports bounded trace via solver.trace and executeSolver runtime contract', () => {
    const map = solver.parse(OFFICIAL_EXAMPLE);
    const bounded = solver.trace!(map, { maxSteps: 4 });
    expect(bounded).toHaveLength(4);
    expect(bounded[3]!.uniqueCount).toBe(14);

    const execution = executeSolver(solver, OFFICIAL_EXAMPLE, { nowMs: () => 10 });
    expect(execution.answer).toBe(14);
    expect(execution.elapsedMs).toBe(0);
    expect(execution.runtime).toBe('main-thread');
  });
});
