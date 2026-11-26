import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { parseWordSearch, type WordSearchGrid } from '../../shared';
import {
  countByOrientation,
  countXMas,
  DEFAULT_MAX_TRACE_STEPS,
  findXMasCrosses,
  solver,
  traceXMasCrosses,
} from './index';

const OFFICIAL_10X10 = [
  'MMMSXXMASM',
  'MSAMXMSMSA',
  'AMXSXMAAMM',
  'MSAMASMSMX',
  'XMASAMXAMM',
  'XXAMMXXAMA',
  'SMSMSASXSS',
  'SAXAMASAAA',
  'MAMMMXMMMM',
  'MXMXAXMASX',
].join('\n');

const DOT_MASKED_10X10 = [
  '.M.S......',
  '..A..MSMS.',
  '.M.S.MAA..',
  '..A.ASMSM.',
  '.M.S.M....',
  '..........',
  'S.S.S.S.S.',
  '.A.A.A.A..',
  'M.M.M.M.M.',
  '..........',
].join('\n');

function oracleCountXMas(grid: WordSearchGrid): number {
  let total = 0;
  for (let r = 1; r < grid.rows - 1; r += 1) {
    for (let c = 1; c < grid.cols - 1; c += 1) {
      if (grid.matchesAt(r - 1, c - 1, 1, 1, 'MAS') && grid.matchesAt(r + 1, c - 1, -1, 1, 'MAS')) total += 1;
      if (grid.matchesAt(r - 1, c + 1, 1, -1, 'MAS') && grid.matchesAt(r + 1, c + 1, -1, -1, 'MAS')) total += 1;
      if (grid.matchesAt(r - 1, c - 1, 1, 1, 'MAS') && grid.matchesAt(r - 1, c + 1, 1, -1, 'MAS')) total += 1;
      if (grid.matchesAt(r + 1, c - 1, -1, 1, 'MAS') && grid.matchesAt(r + 1, c + 1, -1, -1, 'MAS')) total += 1;
    }
  }
  return total;
}

function seededGrid(rows: number, cols: number, seed: number): string {
  const alphabet = 'XMAS.';
  let state = seed >>> 0;
  const lines: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    let row = '';
    for (let c = 0; c < cols; c += 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      row += alphabet[state % alphabet.length]!;
    }
    lines.push(row);
  }
  return lines.join('\n');
}

function makeFakeClock(times: readonly number[]): Clock {
  let idx = 0;
  return { nowMs: () => times[idx++] ?? 0 };
}

describe('countXMas & findXMasCrosses', () => {
  it('solves the official 3x3, official 10x10, and dot-masked 10x10 grids', () => {
    expect(countXMas(parseWordSearch('M.S\n.A.\nM.S'))).toBe(1);
    expect(countXMas(parseWordSearch(OFFICIAL_10X10))).toBe(9);
    expect(countXMas(parseWordSearch(DOT_MASKED_10X10))).toBe(9);
  });

  it('executes via shared executeSolver with a fake Clock', () => {
    const res = executeSolver(solver, OFFICIAL_10X10, makeFakeClock([12, 19.5]));
    expect(res).toEqual({ answer: 9, elapsedMs: 7.5, runtime: 'main-thread' });
  });

  it('finds all four orientations, overlaps, and counts by orientation', () => {
    const raw = ['M.S.S.M', '.A...A.', 'M.S.S.M', '.......', 'M.M.S.S', '.A...A.', 'S.S.M.M'].join('\n');
    const crosses = findXMasCrosses(parseWordSearch(raw));
    expect(Object.isFrozen(crosses)).toBe(true);
    const counts = countByOrientation(crosses);
    expect(Object.isFrozen(counts)).toBe(true);
    expect(counts).toEqual({ M_LEFT: 1, M_RIGHT: 1, M_TOP: 1, M_BOTTOM: 1 });

    const overlapping = parseWordSearch('M.M.M\n.A.A.\nS.S.S');
    expect(countXMas(overlapping)).toBe(2);
  });

  it('rejects MAM/SAS, P.P/.A./P.P, +-crosses, border As, and tiny grids', () => {
    expect(countXMas(parseWordSearch('M.S\n.A.\nS.M'))).toBe(0);
    expect(countXMas(parseWordSearch('P.P\n.A.\nP.P'))).toBe(0);
    expect(countXMas(parseWordSearch('.M.\nMAS\n.S.'))).toBe(0);
    expect(countXMas(parseWordSearch('AAA\nAAA\nAAA'))).toBe(0);
    for (const raw of ['A', 'AA\nAA', 'MASAM\nMASAM', 'MA\nSA\nMA\nSA\nMA']) {
      expect(countXMas(parseWordSearch(raw))).toBe(0);
    }
  });

  it('propagates invalid grid input errors', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('M.S\n.A')).toThrow();
    expect(() => solver.parse('M.S\n.1.\nM.S')).toThrow();
  });

  it('matches independent 4-orientation oracle across examples and seeded grids', () => {
    const dims: readonly [number, number][] = [[1, 1], [2, 5], [5, 2], [3, 3], [7, 11], [11, 7], [25, 25], [40, 30]];
    for (const raw of [OFFICIAL_10X10, DOT_MASKED_10X10]) {
      const grid = parseWordSearch(raw);
      expect(countXMas(grid)).toBe(oracleCountXMas(grid));
    }
    for (const [i, [r, c]] of dims.entries()) {
      const grid = parseWordSearch(seededGrid(r, c, 9001 + i * 37));
      expect(countXMas(grid)).toBe(oracleCountXMas(grid));
    }
  });
});

describe('traceXMasCrosses', () => {
  it('emits single null-active frame on empty match set and samples non-empty traces', () => {
    const emptyFrames = traceXMasCrosses(parseWordSearch('...\n...\n...'));
    expect(emptyFrames).toHaveLength(1);
    expect(emptyFrames[0]).toEqual({ foundCount: 0, totalCrosses: 0, activeCross: null });
    expect(Object.isFrozen(emptyFrames)).toBe(true);
    expect(Object.isFrozen(emptyFrames[0])).toBe(true);

    const grid = parseWordSearch(OFFICIAL_10X10);
    const allFrames = traceXMasCrosses(grid);
    expect(allFrames).toHaveLength(9);
    expect(allFrames[0]!.foundCount).toBe(1);
    expect(allFrames[8]!.foundCount).toBe(9);
    expect(allFrames[8]!.totalCrosses).toBe(9);
    expect(allFrames[8]!.activeCross?.orientation).toBeTruthy();

    const sampled3 = traceXMasCrosses(grid, { maxSteps: 3 });
    expect(sampled3.map((f) => f.foundCount)).toEqual([1, 5, 9]);
    const sampled1 = traceXMasCrosses(grid, { maxSteps: 1 });
    expect(sampled1).toHaveLength(1);
    expect(sampled1[0]!.foundCount).toBe(9);
  });

  it('caps dense grids at DEFAULT_MAX_TRACE_STEPS and validates maxSteps', () => {
    const rowA = 'M.S.'.repeat(25);
    const rowB = '.A..'.repeat(25);
    const dense = Array.from({ length: 12 }, () => `${rowA}\n${rowB}\n${rowA}`).join('\n');
    const grid = parseWordSearch(dense);
    expect(countXMas(grid)).toBeGreaterThan(DEFAULT_MAX_TRACE_STEPS);
    const frames = traceXMasCrosses(grid);
    expect(frames).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(frames[frames.length - 1]!.foundCount).toBe(frames[frames.length - 1]!.totalCrosses);

    for (const bad of [0, -1, 1.5, Number.NaN]) {
      expect(() => traceXMasCrosses(grid, { maxSteps: bad })).toThrow(RangeError);
    }
  });
});
