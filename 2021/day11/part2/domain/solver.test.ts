import { describe, expect, it } from 'vitest';
import { createFirstSyncPolicy, OctopusSolver } from '../../shared';
import { solver } from './index';

const ORACLE_MAX_STEPS = 5_000;
const OFFICIAL_10X10 =
  '5483143223\n2745854711\n5264556173\n6141336146\n6357385478\n4167524645\n2176841721\n6882881134\n4846848554\n5283751526';

function nextRand(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

function gridKey(grid: number[][]): string {
  let key = '';
  for (let r = 0; r < grid.length; r += 1) key += grid[r]!.join('');
  return key;
}

function incrementNeighbors(grid: number[][], row: number, col: number): void {
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[0]!.length) continue;
      grid[nr]![nc] = grid[nr]![nc]! + 1;
    }
  }
}

function oracleStep(grid: number[][]): number {
  const flashed: boolean[][] = [];
  for (let r = 0; r < grid.length; r += 1) {
    flashed.push(new Array<boolean>(grid[r]!.length).fill(false));
    for (let c = 0; c < grid[r]!.length; c += 1) grid[r]![c] = grid[r]![c]! + 1;
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < grid.length; r += 1) {
      for (let c = 0; c < grid[r]!.length; c += 1) {
        if (flashed[r]![c] || grid[r]![c]! <= 9) continue;
        flashed[r]![c] = true;
        changed = true;
        incrementNeighbors(grid, r, c);
      }
    }
  }
  let flashes = 0;
  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[r]!.length; c += 1) {
      if (!flashed[r]![c]) continue;
      grid[r]![c] = 0;
      flashes += 1;
    }
  }
  return flashes;
}

function oracleFirstSync(raw: string): number | null {
  const grid: number[][] = [];
  for (const line of raw.trim().split('\n')) {
    const row: number[] = [];
    for (const ch of line) row.push(Number(ch));
    grid.push(row);
  }
  const totalCells = grid.length * grid[0]!.length;
  const seen = new Set<string>([gridKey(grid)]);
  for (let step = 1; step <= ORACLE_MAX_STEPS; step += 1) {
    if (oracleStep(grid) === totalCells) return step;
    const key = gridKey(grid);
    if (seen.has(key)) return null;
    seen.add(key);
  }
  throw new Error(`Oracle exceeded ${ORACLE_MAX_STEPS} steps without sync or cycle`);
}

function generateRandomGrid(seed: number): { nextSeed: number; raw: string } {
  let s = nextRand(seed);
  const rows = 2 + (s % 4);
  s = nextRand(s);
  const cols = 2 + (s % 4);
  const lines: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    let line = '';
    for (let c = 0; c < cols; c += 1) {
      s = nextRand(s);
      line += String(s % 10);
    }
    lines.push(line);
  }
  return { nextSeed: s, raw: lines.join('\n') };
}

describe('2021 Day 11 Part 2 solver', () => {
  it('solves official 10x10 example (195) and validates full and sampled traces', () => {
    const grid = solver.parse(OFFICIAL_10X10);
    expect(solver.solve(grid)).toBe(195);
    const full = solver.trace(grid);
    expect(full).toHaveLength(196);
    expect(solver.trace(grid, {})).toHaveLength(196);
    expect(full[0]!.step).toBe(0);
    for (let i = 0; i < 195; i += 1) expect(full[i]!.isSynchronized).toBe(false);
    const last = full[195]!;
    expect([last.step, last.stepFlashes, last.isSynchronized]).toEqual([195, 100, true]);
    for (let r = 0; r < 10; r += 1) {
      for (let c = 0; c < 10; c += 1) {
        expect([last.grid.at(r, c), last.flashedAt(r, c)]).toEqual([0, true]);
      }
    }
    const sampled = solver.trace(grid, { maxSteps: 21 });
    expect([sampled.length, sampled[0]!.step, sampled[20]!.step]).toEqual([21, 0, 195]);
    const single = solver.trace(grid, { maxSteps: 1 });
    expect([single.length, single[0]!.step, single[0]!.isSynchronized]).toEqual([1, 195, true]);
  });

  it('handles minimal 1x1 and 3x3 cascade boundary grids', () => {
    expect(solver.solve(solver.parse('9'))).toBe(1);
    expect(solver.solve(solver.parse('0'))).toBe(10);
    expect(solver.solve(solver.parse('999\n919\n999'))).toBe(1);
    expect(solver.solve(solver.parse('999\n909\n999'))).toBe(10);
  });

  it('rejects never-syncing cycles, invalid grids, and invalid maxSteps', () => {
    const boundedSolver = new OctopusSolver(createFirstSyncPolicy(500));
    const cycle = solver.parse('05');
    expect(() => solver.solve(cycle)).toThrow(RangeError);
    expect(() => boundedSolver.trace(cycle)).toThrow(RangeError);
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('12x4')).toThrow(RangeError);
    expect(() => solver.parse('12\n345')).toThrow();
    const tiny = solver.parse('9');
    for (const bad of [0, -1, 1.5, Number.NaN])
      expect(() => solver.trace(tiny, { maxSteps: bad })).toThrow(RangeError);
  });

  it('matches brute-force oracle across 40 seeded 2x2..5x5 grids', () => {
    const boundedSolver = new OctopusSolver(createFirstSyncPolicy(500));
    let seed = 20211102, syncCount = 0, cycleCount = 0;
    for (let i = 0; i < 40; i += 1) {
      const { nextSeed, raw } = generateRandomGrid(seed);
      seed = nextSeed;
      const expected = oracleFirstSync(raw);
      const grid = solver.parse(raw);
      if (expected !== null) {
        expect(solver.solve(grid)).toBe(expected);
        syncCount += 1;
      } else {
        expect(() => boundedSolver.solve(grid)).toThrow(RangeError);
        cycleCount += 1;
      }
    }
    expect(syncCount).toBeGreaterThan(0);
    expect(cycleCount).toBeGreaterThan(0);
  });
});
