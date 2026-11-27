import { describe, expect, it } from 'vitest';
import type { PixelBit, TrenchTraceFrame } from '../../shared';
import { solver } from './index';

interface GridState {
  readonly grid: PixelBit[][];
  readonly bg: PixelBit;
}

const EXAMPLE = [
  '..#.#..#####.#.#.#.###.##.....###.##.#..###.####..#####..#....#..#..##..##',
  '#..######.###...####..#..#####..##..#.#####...##.#.#..#.##..#.#......#.###',
  '.######.###.####...#.##.##..#..#..#####.....#.#....###..#.##......#.....#.',
  '.#..#..##..#...##.######.####.####.#.#...#.......#..#.#.#...####.##.#.....',
  '.#..#...##.#.##..#...##.#.##..###.#......#.#.......#.#.#.####.###.##...#..',
  '...####.#..#..#.##.#....##..#.####....##...##..#...#......#.#.......#.....',
  '..##..####..#...#.#.#...##..#.#..###..#####........#..####......#..#',
  '',
  '#..#.',
  '#....',
  '##..#',
  '..#..',
  '..###',
].join('\n');

function buildBlinkingTable(): string {
  let out = '';
  for (let i = 0; i < 512; i += 1) {
    out += i === 0 ? '#' : i === 511 ? '.' : (i * 73 + 19) % 5 < 2 ? '#' : '.';
  }
  return out;
}

function refBit(grid: PixelBit[][], bg: PixelBit, r: number, c: number): PixelBit {
  if (r < 0 || r >= grid.length || c < 0 || c >= grid[0]!.length) return bg;
  return grid[r]![c]!;
}

function windowIndex(grid: PixelBit[][], bg: PixelBit, cr: number, cc: number): number {
  let idx = 0;
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      idx = (idx << 1) | refBit(grid, bg, cr + dr, cc + dc);
    }
  }
  return idx;
}

function stepNaive2D(state: GridState, table: string): GridState {
  const nextH = state.grid.length + 2;
  const nextW = state.grid[0]!.length + 2;
  const nextGrid: PixelBit[][] = [];
  for (let nr = 0; nr < nextH; nr += 1) {
    const row: PixelBit[] = [];
    for (let nc = 0; nc < nextW; nc += 1) {
      const idx = windowIndex(state.grid, state.bg, nr - 1, nc - 1);
      row.push(table[idx] === '#' ? 1 : 0);
    }
    nextGrid.push(row);
  }
  const nextBg: PixelBit = table[state.bg === 0 ? 0 : 511] === '#' ? 1 : 0;
  return { grid: nextGrid, bg: nextBg };
}

function countGridLit(grid: PixelBit[][]): number {
  let total = 0;
  for (const row of grid) {
    for (const bit of row) total += bit;
  }
  return total;
}

function runNaiveOracle(rows: readonly string[], table: string, steps: number): GridState {
  const initial: PixelBit[][] = rows.map((row) =>
    Array.from(row, (ch) => (ch === '#' ? 1 : 0) as PixelBit),
  );
  let state: GridState = { grid: initial, bg: 0 };
  for (let s = 0; s < steps; s += 1) state = stepNaive2D(state, table);
  return state;
}

function assertGridMatchesFrame(grid: PixelBit[][], frame: TrenchTraceFrame): void {
  expect(frame.image.height).toBe(grid.length);
  expect(frame.image.width).toBe(grid[0]!.length);
  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[0]!.length; c += 1) {
      expect(frame.image.pixelAt(r, c)).toBe(grid[r]![c]);
    }
  }
}

describe('2021 Day 20 Part 2 solver', () => {
  it('solves the official 50-step example', () => {
    const parsed = solver.parse(EXAMPLE);
    expect(solver.policy.steps).toBe(50);
    expect(solver.solve(parsed)).toBe(3351);
    expect(solver.formatAnswer(3351)).toBe('3351');
  });

  it('produces the full 51-frame default trace for the official example', () => {
    const frames = solver.trace(solver.parse(EXAMPLE));
    expect(frames).toHaveLength(51);
    expect([frames[0]!.image.height, frames[0]!.image.width, frames[0]!.image.totalLitPixels]).toEqual([5, 5, 10]);
    expect([frames[2]!.image.height, frames[2]!.image.width, frames[2]!.image.totalLitPixels]).toEqual([9, 9, 35]);
    const last = frames[50]!.image;
    expect([last.height, last.width, last.totalLitPixels]).toEqual([105, 105, 3351]);
    expect(last.background).toBe(0);
    expect(last.hasInfiniteLitPixels).toBe(false);
  });

  it('matches a naive 2D PixelBit[][] oracle across 50 blinking (1, 0) steps', () => {
    const table = buildBlinkingTable();
    const seed = ['#.#', '.#.', '..#'];
    const parsed = solver.parse(`${table}\n\n${seed.join('\n')}`);
    const oracle = runNaiveOracle(seed, table, 50);
    const frames = solver.trace(parsed);
    expect(solver.solve(parsed)).toBe(countGridLit(oracle.grid));
    expect(frames).toHaveLength(51);
    assertGridMatchesFrame(oracle.grid, frames[50]!);
    for (let step = 0; step <= 50; step += 1) {
      expect(frames[step]!.image.background).toBe(step % 2);
      expect(frames[step]!.image.hasInfiniteLitPixels).toBe(step % 2 === 1);
    }
    expect(() => frames[1]!.image.totalLitPixels).toThrow(RangeError);
  });

  it('preserves rectangular 2x5 dimensions and even-step void parity', () => {
    const table = buildBlinkingTable();
    const parsed = solver.parse(`${table}\n\n..#.#\n.#...`);
    const frames = solver.trace(parsed);
    expect(frames[50]!.image.height).toBe(102);
    expect(frames[50]!.image.width).toBe(105);
    expect(frames[50]!.image.background).toBe(0);
    expect(frames[49]!.image.background).toBe(1);
  });

  it('handles sticky (1, 1) infinite void in solve and trace', () => {
    const parsed = solver.parse(`${'#'.repeat(512)}\n\n#`);
    expect(() => solver.solve(parsed)).toThrow(RangeError);
    const frames = solver.trace(parsed);
    expect(frames).toHaveLength(51);
    expect(frames[50]!.image.background).toBe(1);
    expect(frames[50]!.image.hasInfiniteLitPixels).toBe(true);
  });

  it('samples bounded traces preserving endpoints for maxSteps 11 and 1', () => {
    const parsed = solver.parse(EXAMPLE);
    const capped11 = solver.trace(parsed, { maxSteps: 11 });
    expect(capped11).toHaveLength(11);
    expect(capped11[0]!.step).toBe(0);
    expect(capped11[10]!.step).toBe(50);
    expect(capped11[10]!.image.totalLitPixels).toBe(3351);

    const capped1 = solver.trace(parsed, { maxSteps: 1 });
    expect(capped1).toHaveLength(1);
    expect(capped1[0]!.step).toBe(50);
    expect(capped1[0]!.image.totalLitPixels).toBe(3351);
  });

  it('rejects invalid inputs and invalid trace maxSteps separately', () => {
    expect(() => solver.parse('')).toThrow(Error);
    expect(() => solver.parse(`${'.'.repeat(511)}\n\n#`)).toThrow(RangeError);
    expect(() => solver.parse(`${'.'.repeat(512)}\n\n#x`)).toThrow(Error);
    expect(() => solver.parse(`${'.'.repeat(512)}\n\n#.\n#`)).toThrow(Error);
    const parsed = solver.parse(EXAMPLE);
    expect(() => solver.trace(parsed, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.trace(parsed, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});
