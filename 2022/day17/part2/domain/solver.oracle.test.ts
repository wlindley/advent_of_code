import { describe, expect, it } from 'vitest';
import { PART2_ROCK_COUNT, solver } from './index';

type Shape = ReadonlyArray<readonly [number, number]>;
type OracleCycle = { readonly prefix: number; readonly period: number; readonly cycleHeight: number };

const EXAMPLE = '>>><<><>><<<>><>>><<<>>><<<><<<>><>><<>>';
const WIDTH = 7;
const SHAPES: readonly Shape[] = [
  [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]],
  [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],
  [[0, 0], [0, 1], [0, 2], [0, 3]],
  [[0, 0], [1, 0], [0, 1], [1, 1]],
];

function canPlace(grid: readonly boolean[][], shape: Shape, x: number, y: number): boolean {
  for (const [dx, dy] of shape) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || nx >= WIDTH || ny < 0 || grid[ny]?.[nx]) return false;
  }
  return true;
}

function dropRock(grid: boolean[][], rockIdx: number, jetIdx: number, jets: string): number {
  const shape = SHAPES[rockIdx]!;
  let x = 2;
  let y = grid.length + 3;
  let nextJet = jetIdx;
  while (true) {
    const dx = jets[nextJet]! === '<' ? -1 : 1;
    nextJet = (nextJet + 1) % jets.length;
    if (canPlace(grid, shape, x + dx, y)) x += dx;
    if (canPlace(grid, shape, x, y - 1)) {
      y -= 1;
      continue;
    }
    for (const [sx, sy] of shape) {
      while (grid.length <= y + sy) grid.push(new Array<boolean>(WIDTH).fill(false));
      grid[y + sy]![x + sx] = true;
    }
    return nextJet;
  }
}

function cavityKey(grid: readonly boolean[][], rockIdx: number, jetIdx: number): string {
  const height = grid.length;
  const visited = new Set<number>();
  const rowMasks = new Map<number, number>();
  const queue: number[] = [];
  for (let x = 0; x < WIDTH; x += 1) {
    queue.push(height * WIDTH + x);
    visited.add(height * WIDTH + x);
  }
  let minY = height;
  for (let head = 0; head < queue.length; head += 1) {
    const cell = queue[head]!;
    const cx = cell % WIDTH;
    const cy = Math.floor(cell / WIDTH);
    if (cy < height) {
      rowMasks.set(cy, (rowMasks.get(cy) ?? 0) | (1 << cx));
      if (cy < minY) minY = cy;
    }
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1]] as const) {
      const code = (cy + dy) * WIDTH + (cx + dx);
      if (cx + dx < 0 || cx + dx >= WIDTH || cy + dy < 0 || visited.has(code) || grid[cy + dy]?.[cx + dx]) continue;
      visited.add(code);
      queue.push(code);
    }
  }
  const rows: number[] = [];
  for (let y = height - 1; y >= minY; y -= 1) rows.push(rowMasks.get(y) ?? 0);
  return `${rockIdx}:${jetIdx}:${rows.join(',')}`;
}

function findCycle(jets: string): OracleCycle {
  const grid: boolean[][] = [];
  const seen = new Map<string, { readonly dropped: number; readonly height: number }>();
  let jetIdx = 0;
  for (let dropped = 0; ; dropped += 1) {
    const rockIdx = dropped % SHAPES.length;
    const key = cavityKey(grid, rockIdx, jetIdx);
    const prior = seen.get(key);
    if (prior !== undefined) {
      return { prefix: prior.dropped, period: dropped - prior.dropped, cycleHeight: grid.length - prior.height };
    }
    seen.set(key, { dropped, height: grid.length });
    jetIdx = dropRock(grid, rockIdx, jetIdx, jets);
  }
}

function rawHeight(jets: string, rocks: number): number {
  const grid: boolean[][] = [];
  let jetIdx = 0;
  for (let i = 0; i < rocks; i += 1) jetIdx = dropRock(grid, i % SHAPES.length, jetIdx, jets);
  return grid.length;
}

function extrapolateHeight(jets: string, cycle: OracleCycle, target: bigint): bigint {
  const afterPrefix = target - BigInt(cycle.prefix);
  const period = BigInt(cycle.period);
  const base = BigInt(rawHeight(jets, cycle.prefix + Number(afterPrefix % period)));
  return base + (afterPrefix / period) * BigInt(cycle.cycleHeight);
}

function generateJets(seed: number, length: number): string {
  let state = seed >>> 0;
  let out = '';
  for (let i = 0; i < length; i += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    out += ((state >>> 16) & 1) === 0 ? '<' : '>';
  }
  return out;
}

const CASES: ReadonlyArray<readonly [string, string]> = [
  ['official example', EXAMPLE],
  ['symmetric 3+3', '<<<>>>'],
  ['balanced 6-jet', '<<><>>'],
  ['asymmetric 15-jet', '<<<>>><>><<<>><'],
  ['prng length 7', generateJets(37, 7)],
  ['prng length 13', generateJets(5, 13)],
  ['prng length 29', generateJets(1, 29)],
];

describe('2022 Day 17 Part 2 differential oracle', () => {
  it.each(CASES)('verifies raw cycle linearity for %s', (_label, jets) => {
    const { prefix, period, cycleHeight } = findCycle(jets);
    const rem = 3;
    const base = rawHeight(jets, prefix + rem);
    for (const k of [1, 2, 3]) {
      expect(rawHeight(jets, prefix + k * period + rem)).toBe(base + k * cycleHeight);
    }
  });

  it.each(CASES)('matches solver.solve at 1,000,000,000,000 rocks for %s', (_label, jets) => {
    const expected = extrapolateHeight(jets, findCycle(jets), PART2_ROCK_COUNT);
    expect(solver.solve(solver.parse(jets))).toBe(expected);
  });
});
