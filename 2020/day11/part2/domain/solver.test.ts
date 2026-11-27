import { describe, expect, it } from 'vitest';
import { DIRS_8 } from '../../../../shared/core';
import { LINE_OF_SIGHT_SEATING_RULE } from '../../shared';
import { solver } from './index';

const EXAMPLE_10X10 = [
  'L.LL.LL.LL', 'LLLLLLL.LL', 'L.L.L..L..', 'LLLL.LL.LL', 'L.LL.LL.LL',
  'L.LLLLL.LL', '..L.L.....', 'LLLLLLLLLL', 'L.LLLLLL.L', 'L.LLLLL.LL',
].join('\n');

const VIS_EIGHT =
  '.......#.\n...#.....\n.#.......\n.........\n..#L....#\n....#....\n.........\n#........\n...#.....';
const VIS_BLOCKED = '.............\n.L.L.#.#.#.#.\n.............';
const VIS_ZERO = '.##.##.\n#.#.#.#\n##...##\n...L...\n##...##\n#.#.#.#\n.##.##.';

const OCTAGON_4X4 = '.LL.\nLLLL\nLLLL\n.LL.';
const SOLID_3X3 = 'LLL\nLLL\nLLL';

function nextRng(state: number): number {
  return (Math.imul(state, 1664525) + 1013904223) >>> 0;
}

function buildRandomGrid(seed: number, rows: number, cols: number): { raw: string; seed: number } {
  let rng = seed;
  const lines: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    let line = '';
    for (let c = 0; c < cols; c += 1) {
      rng = nextRng(rng);
      const roll = rng % 10;
      line += roll < 3 ? '.' : roll < 5 ? '#' : 'L';
    }
    lines.push(line);
  }
  return { raw: lines.join('\n'), seed: rng };
}

function countVisibleOccupied(grid: string[][], r: number, c: number): number {
  let occupied = 0;
  for (const [dr, dc] of DIRS_8) {
    let nr = r + dr;
    let nc = c + dc;
    while (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0]!.length) {
      const ch = grid[nr]![nc]!;
      if (ch !== '.') {
        if (ch === '#') occupied += 1;
        break;
      }
      nr += dr;
      nc += dc;
    }
  }
  return occupied;
}

function oracleStep(grid: string[][]): { next: string[][]; changed: boolean } {
  let changed = false;
  const next = grid.map((row) => row.slice());
  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[0]!.length; c += 1) {
      const cell = grid[r]![c]!;
      if (cell === '.') continue;
      const seen = countVisibleOccupied(grid, r, c);
      if (cell === 'L' && seen === 0) {
        next[r]![c] = '#';
        changed = true;
      } else if (cell === '#' && seen >= 5) {
        next[r]![c] = 'L';
        changed = true;
      }
    }
  }
  return { next, changed };
}

function oracleSolvePart2(raw: string): number {
  let grid = raw.split('\n').map((line) => line.split(''));
  while (true) {
    const step = oracleStep(grid);
    if (!step.changed) break;
    grid = step.next;
  }
  let occupied = 0;
  for (const row of grid) {
    for (const ch of row) occupied += ch === '#' ? 1 : 0;
  }
  return occupied;
}

describe('2020 Day 11 Part 2 solver', () => {
  it('solves the 10x10 example to 26 and traces rounds 0..6 with maxSteps sampling', () => {
    expect(solver.rule).toBe(LINE_OF_SIGHT_SEATING_RULE);
    const layout = solver.parse(EXAMPLE_10X10);
    expect(solver.solve(layout)).toBe(26);

    const full = solver.trace(layout);
    expect(full.map((frame) => frame.round)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(full.map((frame) => frame.occupiedCount)).toEqual([0, 71, 7, 53, 18, 31, 26]);
    expect(solver.trace(layout, { maxSteps: 3 }).map((f) => f.round)).toEqual([0, 3, 6]);

    const single = solver.trace(layout, { maxSteps: 1 });
    expect(single.map((f) => f.round)).toEqual([6]);
    expect(single[0]!.isStable).toBe(true);
  });

  it('handles AoC line-of-sight visibility edge fixtures', () => {
    expect(solver.solve(solver.parse(VIS_EIGHT))).toBe(8);
    expect(solver.solve(solver.parse(VIS_EIGHT.replace('L', '#')))).toBe(8);
    expect(solver.solve(solver.parse(VIS_BLOCKED))).toBe(5);

    const zeroLayout = solver.parse(VIS_ZERO);
    const center = zeroLayout.seatIndexAt(3, 3)!;
    const zeroTrace = solver.trace(zeroLayout);
    expect(zeroTrace[1]!.stateAt(center)).toBe(2);
    expect(solver.solve(zeroLayout)).toBe(9);
  });

  it('enforces threshold=5 boundary and trivial layout edge cases', () => {
    const octTrace = solver.trace(solver.parse(OCTAGON_4X4));
    expect(octTrace[octTrace.length - 1]!.round).toBe(2);
    expect(octTrace[octTrace.length - 1]!.occupiedCount).toBe(8);

    const solidTrace = solver.trace(solver.parse(SOLID_3X3));
    expect(solidTrace[solidTrace.length - 1]!.round).toBe(2);
    expect(solidTrace[solidTrace.length - 1]!.occupiedCount).toBe(4);

    expect(solver.solve(solver.parse('..\n..'))).toBe(0);
    expect(solver.solve(solver.parse('L'))).toBe(1);
    expect(solver.solve(solver.parse('#.#'))).toBe(2);
  });

  it('rejects invalid grids and invalid maxSteps values', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('LL\nL')).toThrow();
    expect(() => solver.parse('LXL')).toThrow();

    const layout = solver.parse(SOLID_3X3);
    expect(() => solver.trace(layout, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.trace(layout, { maxSteps: -1 })).toThrow(RangeError);
    expect(() => solver.trace(layout, { maxSteps: 1.5 })).toThrow(RangeError);
  });

  it('matches an independent 2D ray-scan oracle across 30 seeded random grids', () => {
    let seed = 20201102;
    for (let i = 0; i < 30; i += 1) {
      const rows = 2 + (i % 10);
      const cols = 2 + ((i * 3) % 10);
      const generated = buildRandomGrid(seed, rows, cols);
      seed = generated.seed;
      expect(solver.solve(solver.parse(generated.raw))).toBe(oracleSolvePart2(generated.raw));
    }
  });
});
