import { describe, expect, it } from 'vitest';
import { MinHeap } from '../../../../shared/core';
import { DEFAULT_MAX_TRACE_STEPS, PART2_POLICY, type CavernPathResult } from '../../shared';
import { solver } from './index';

const EXAMPLE_INPUT = [
  '1163751742', '1381373672', '2136511328', '3694931569', '7463417111',
  '1319128137', '1359912421', '3125421639', '1293138521', '2311944581',
].join('\n');

type BaseGrid = { readonly rows: number; readonly cols: number; readonly cells: number[] };

function parseBaseGrid(raw: string): BaseGrid {
  const lines = raw.trim().split(/\r?\n/);
  const cells: number[] = [];
  for (const ch of lines.join('')) cells.push(Number(ch));
  return { rows: lines.length, cols: lines[0]!.length, cells };
}

function virtualRisk(base: BaseGrid, r: number, c: number): number {
  const raw = base.cells[(r % base.rows) * base.cols + (c % base.cols)]!;
  return ((raw - 1 + Math.floor(r / base.rows) + Math.floor(c / base.cols)) % 9) + 1;
}

function compareHeapNode(a: readonly [number, number], b: readonly [number, number]): number {
  return a[0] - b[0];
}

function virtualTiledMinHeapOracle(raw: string, tiles: number): number {
  const base = parseBaseGrid(raw);
  const [R, C] = [base.rows * tiles, base.cols * tiles];
  const dist = new Int32Array(R * C).fill(1e9);
  dist[0] = 0;
  const heap = new MinHeap<readonly [number, number]>(compareHeapNode);
  heap.push([0, 0]);
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const;
  while (!heap.isEmpty) {
    const [d, u] = heap.pop()!;
    if (d > dist[u]!) continue;
    if (u === R * C - 1) return d;
    const [r, c] = [Math.floor(u / C), u % C];
    for (const [dr, dc] of dirs) {
      const [nr, nc] = [r + dr, c + dc];
      if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
      const v = nr * C + nc;
      const nd = d + virtualRisk(base, nr, nc);
      if (nd < dist[v]!) {
        dist[v] = nd;
        heap.push([nd, v]);
      }
    }
  }
  return -1;
}

function downRightDpOracle(raw: string, tiles: number): number {
  const base = parseBaseGrid(raw);
  const [R, C] = [base.rows * tiles, base.cols * tiles];
  const dp = new Int32Array(C);
  for (let c = 1; c < C; c += 1) dp[c] = dp[c - 1]! + virtualRisk(base, 0, c);
  for (let r = 1; r < R; r += 1) {
    dp[0] = dp[0]! + virtualRisk(base, r, 0);
    for (let c = 1; c < C; c += 1) dp[c] = Math.min(dp[c]!, dp[c - 1]!) + virtualRisk(base, r, c);
  }
  return dp[C - 1]!;
}

function isOrthogonalStep(prev: number, cur: number, cols: number): boolean {
  const dr = Math.abs(Math.floor(cur / cols) - Math.floor(prev / cols));
  return dr + Math.abs((cur % cols) - (prev % cols)) === 1;
}

function verifyContiguousPath(result: CavernPathResult, expectedRisk: number): void {
  const { pathIndices: path, map } = result;
  expect(path[0]).toBe(0);
  expect(path[path.length - 1]).toBe(map.cellCount - 1);
  let sum = 0;
  for (let i = 1; i < path.length; i += 1) {
    expect(isOrthogonalStep(path[i - 1]!, path[i]!, map.cols)).toBe(true);
    sum += map.riskLevels[path[i]!]!;
  }
  expect(sum).toBe(expectedRisk);
  expect(result.totalRisk).toBe(expectedRisk);
}

function hasMoveDelta(path: readonly number[], cols: number, delta: number): boolean {
  for (let i = 1; i < path.length; i += 1) {
    if (isOrthogonalStep(path[i - 1]!, path[i]!, cols) && path[i]! - path[i - 1]! === delta) return true;
  }
  return false;
}

function nextSeededInt(state: number): number {
  return (Math.imul(state, 1664525) + 1013904223) >>> 0;
}

function generateSeededGrid(seed: number, rows: number, cols: number): { raw: string; nextSeed: number } {
  let cur = seed;
  const lines: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    let line = '';
    for (let c = 0; c < cols; c += 1) {
      cur = nextSeededInt(cur);
      line += String((cur % 9) + 1);
    }
    lines.push(line);
  }
  return { raw: lines.join('\n'), nextSeed: cur };
}

describe('2021 Day 15 Part 2 solver', () => {
  it('solves the 10x10 example expanded to 50x50 as 315', () => {
    const grid = solver.parse(EXAMPLE_INPUT);
    const analysis = solver.analyze(grid);
    expect(solver.policy).toBe(PART2_POLICY);
    expect([analysis.map.rows, analysis.map.cols]).toEqual([50, 50]);
    expect(solver.solve(grid)).toBe(315);
    expect(solver.formatAnswer(315)).toBe('315');
    verifyContiguousPath(analysis, 315);
    expect(virtualTiledMinHeapOracle(EXAMPLE_INPUT, 5)).toBe(315);
  });

  it.each([
    { raw: '8', expected: 37, risks: [8, 9, 1, 7] },
    { raw: '9', expected: 36, risks: [9, 1, 2, 8] },
  ])('handles 1x1 wrap boundary for risk $raw', ({ raw, expected, risks }) => {
    const { map, totalRisk } = solver.analyze(solver.parse(raw));
    expect([map.riskAt(0, 0), map.riskAt(0, 1), map.riskAt(0, 2), map.riskAt(4, 4)]).toEqual(risks);
    expect(totalRisk).toBe(expected);
    expect(virtualTiledMinHeapOracle(raw, 5)).toBe(expected);
  });

  it.each([
    { label: 'UP', raw: ['19111', '19199', '11199', '99999', '99999'].join('\n'), delta: -25 },
    { label: 'LEFT', raw: ['11199', '99199', '11199', '19999', '19999'].join('\n'), delta: -1 },
  ])('finds $label detours beating down/right DP under 5x5 tiling', ({ raw, delta }) => {
    const analysis = solver.analyze(solver.parse(raw));
    expect(hasMoveDelta(analysis.pathIndices, 25, delta)).toBe(true);
    expect(analysis.totalRisk).toBeLessThan(downRightDpOracle(raw, 5));
    expect(analysis.totalRisk).toBe(virtualTiledMinHeapOracle(raw, 5));
  });

  it('matches independent virtual-tiled MinHeap oracle across 15 seeded grids', () => {
    let seed = 20211502;
    for (let i = 0; i < 15; i += 1) {
      const generated = generateSeededGrid(seed, 3 + (i % 6), 3 + ((i + 2) % 6));
      seed = generated.nextSeed;
      verifyContiguousPath(solver.analyze(solver.parse(generated.raw)), virtualTiledMinHeapOracle(generated.raw, 5));
    }
  });

  it('produces bounded trace frames for explicit maxSteps and default options', () => {
    const grid = solver.parse(EXAMPLE_INPUT);
    const shortFrames = solver.trace(grid, { maxSteps: 10 });
    expect(shortFrames).toHaveLength(10);
    expect(shortFrames[0]?.phase).toBe('wavefront');
    expect(shortFrames[9]?.phase).toBe('path');
    expect(shortFrames[9]?.revealedPathRisk).toBe(315);
    const defaultFrames = solver.trace(grid);
    expect(defaultFrames).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(defaultFrames[defaultFrames.length - 1]?.goalReached).toBe(true);
  });

  it.each(['', '10\n23', '12\n3'])('rejects invalid grid input %j', (raw) => {
    expect(() => solver.parse(raw)).toThrow();
  });

  it('rejects invalid trace maxSteps 0', () => {
    expect(() => solver.trace(solver.parse('1'), { maxSteps: 0 })).toThrow();
  });
});
