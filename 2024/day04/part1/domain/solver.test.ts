import { describe, expect, it } from 'vitest';
import { DIRS_8, executeSolver, type Clock } from '../../../../shared/core';
import { parseWordSearch } from '../../shared';
import { DEFAULT_MAX_TRACE_STEPS, countXmas, findXmasMatches, solver, traceXmasMatches } from './index';

const OFFICIAL_10X10 = [
  'MMMSXXMASM', 'MSAMXMSMSA', 'AMXSXMAAMM', 'MSAMASMSMX', 'XMASAMXAMM',
  'XXAMMXXAMA', 'SMSMSASXSS', 'SAXAMASAAA', 'MAMMMXMMMM', 'MXMXAXMASX',
].join('\n');
const DOT_5X6 = ['..X...', '.SAMX.', '.A..A.', 'XMAS.S', '.X....'].join('\n');

function countSub(line: string, target: string): number {
  let hits = 0;
  for (let i = 0; i <= line.length - target.length; i += 1) {
    if (line.slice(i, i + target.length) === target) hits += 1;
  }
  return hits;
}

function axialLineSweepCount(raw: string): number {
  const grid = parseWordSearch(raw);
  const lines: string[] = [];
  const walk = (r0: number, c0: number, dr: number, dc: number): void => {
    let line = '';
    for (let r = r0, c = c0; grid.inBounds(r, c); r += dr, c += dc) line += grid.at(r, c);
    lines.push(line);
  };
  for (let r = 0; r < grid.rows; r += 1) {
    walk(r, 0, 0, 1);
    walk(r, 0, 1, 1);
    walk(r, grid.cols - 1, 1, -1);
  }
  for (let c = 0; c < grid.cols; c += 1) {
    walk(0, c, 1, 0);
    if (c > 0) walk(0, c, 1, 1);
    if (c < grid.cols - 1) walk(0, c, 1, -1);
  }
  return lines.reduce((sum, l) => sum + countSub(l, 'XMAS') + countSub(l, 'SAMX'), 0);
}

function makeSeededGrid(rows: number, cols: number, seed: number): string {
  let state = seed >>> 0;
  return Array.from({ length: rows }, () => {
    let row = '';
    for (let c = 0; c < cols; c += 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      row += 'XMAS'[state % 4]!;
    }
    return row;
  }).join('\n');
}

describe('Day 4 Part 1 solver', () => {
  it('solves the official 10x10 and 5x6 examples and works with executeSolver', () => {
    expect(countXmas(parseWordSearch(OFFICIAL_10X10))).toBe(18);
    expect(countXmas(parseWordSearch(DOT_5X6))).toBe(4);
    let ticks = 0;
    const fakeClock: Clock = { nowMs: () => (ticks++ === 0 ? 10 : 27.5) };
    expect(executeSolver(solver, OFFICIAL_10X10, fakeClock)).toEqual({
      answer: 18, elapsedMs: 17.5, runtime: 'main-thread',
    });
  });

  it('handles sub-4 grids, 1x4, 4x1, overlaps, and starbursts in all 8 directions', () => {
    expect(countXmas(parseWordSearch('X'))).toBe(0);
    expect(countXmas(parseWordSearch('XMA\nSAM\nXMA'))).toBe(0);
    expect(countXmas(parseWordSearch('XMAS'))).toBe(1);
    expect(countXmas(parseWordSearch('X\nM\nA\nS'))).toBe(1);
    expect(countXmas(parseWordSearch('XMASAMX'))).toBe(2);
    expect(countXmas(parseWordSearch('SAMXMAS'))).toBe(2);
    const xStar = parseWordSearch(['S..S..S', '.A.A.A.', '..MMM..', 'SAMXMAS', '..MMM..', '.A.A.A.', 'S..S..S'].join('\n'));
    expect(findXmasMatches(xStar).map((m) => [m.dr, m.dc])).toEqual(DIRS_8);
    const sStar = parseWordSearch(['X..X..X', '.M.M.M.', '..AAA..', 'XMASAMX', '..AAA..', '.M.M.M.', 'X..X..X'].join('\n'));
    expect(countXmas(sStar)).toBe(8);
  });

  it('matches the independent axial-line-sweep oracle on examples and seeded grids', () => {
    const dims: readonly (readonly [number, number, number])[] = [
      [1, 1, 1], [3, 5, 2], [4, 4, 3], [7, 11, 4], [11, 7, 5], [25, 25, 6], [40, 30, 7],
    ];
    for (const raw of [OFFICIAL_10X10, DOT_5X6, ...dims.map(([r, c, s]) => makeSeededGrid(r, c, s))]) {
      expect(countXmas(parseWordSearch(raw))).toBe(axialLineSweepCount(raw));
    }
  });

  it('produces bounded, frozen trace frames and validates maxSteps', () => {
    const emptyTrace = traceXmasMatches(parseWordSearch('....\n....'));
    expect(Object.isFrozen(emptyTrace)).toBe(true);
    expect(emptyTrace).toEqual([{ foundCount: 0, totalMatches: 0, activeMatch: null }]);

    const dotTrace = traceXmasMatches(parseWordSearch(DOT_5X6));
    expect(dotTrace.every((f) => Object.isFrozen(f))).toBe(true);
    expect(dotTrace.map((f) => f.foundCount)).toEqual([1, 2, 3, 4]);
    expect(dotTrace[0]!.totalMatches).toBe(4);
    expect(dotTrace[0]!.activeMatch).not.toBeNull();

    expect(traceXmasMatches(parseWordSearch(OFFICIAL_10X10), { maxSteps: 3 }).map((f) => f.foundCount)).toEqual([1, 10, 18]);
    const single = traceXmasMatches(parseWordSearch(OFFICIAL_10X10), { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.foundCount).toBe(18);

    const capped = traceXmasMatches(parseWordSearch(Array.from({ length: 60 }, () => 'XMASXMASXMASXMAS').join('\n')));
    expect(capped).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(capped[capped.length - 1]!.foundCount).toBe(capped[0]!.totalMatches);

    for (const bad of [0, -1, 1.5]) {
      expect(() => traceXmasMatches(parseWordSearch(DOT_5X6), { maxSteps: bad })).toThrow(RangeError);
    }
  });
});
