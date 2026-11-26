import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import {
  DIRECTIONAL_KEYS, DoorCode, PART2_DIRECTIONAL_ROBOTS,
  buildDirectionalCostTable, parseDoorCodes, solveDoorCode,
} from '../../shared';
import { PART2_CONFIG, solvePart2, solver } from './index';

const NUM_GRID = ['789', '456', '123', ' 0A'] as const;
const DIR_GRID = [' ^A', '<v>'] as const;
const EXAMPLE_CODES = ['029A', '980A', '179A', '456A', '379A'] as const;
const EXAMPLE_INPUT = EXAMPLE_CODES.join('\n');

function findKey(grid: readonly string[], key: string): readonly [number, number] {
  for (let r = 0; r < grid.length; r += 1) {
    const c = grid[r]!.indexOf(key);
    if (c >= 0) return [r, c];
  }
  throw new RangeError(`Missing key ${key}`);
}

function stepPaths(
  grid: readonly string[], r: number, c: number, tr: number, tc: number, prefix: string, out: string[],
): void {
  if (r === tr && c === tc) { out.push(`${prefix}A`); return; }
  if (r !== tr) {
    const nr = r + (tr > r ? 1 : -1);
    if (grid[nr]![c] !== ' ') stepPaths(grid, nr, c, tr, tc, prefix + (tr > r ? 'v' : '^'), out);
  }
  if (c !== tc) {
    const nc = c + (tc > c ? 1 : -1);
    if (grid[r]![nc] !== ' ') stepPaths(grid, r, nc, tr, tc, prefix + (tc > c ? '>' : '<'), out);
  }
}

function allShortestPaths(grid: readonly string[], from: string, to: string): string[] {
  if (from === to) return ['A'];
  const [r, c] = findKey(grid, from);
  const [tr, tc] = findKey(grid, to);
  const out: string[] = [];
  stepPaths(grid, r, c, tr, tc, '', out);
  return out;
}

function minPathCost(paths: readonly string[], depth: number, memo: Map<string, bigint>): bigint {
  let best = oracleSeqCost(paths[0]!, depth, memo);
  for (let i = 1; i < paths.length; i += 1) {
    const cost = oracleSeqCost(paths[i]!, depth, memo);
    if (cost < best) best = cost;
  }
  return best;
}

function oracleDirCost(from: string, to: string, depth: number, memo: Map<string, bigint>): bigint {
  if (depth === 0) return 1n;
  const key = `${from}${to}:${depth}`;
  const cached = memo.get(key);
  if (cached !== undefined) return cached;
  const best = minPathCost(allShortestPaths(DIR_GRID, from, to), depth - 1, memo);
  memo.set(key, best);
  return best;
}

function oracleSeqCost(seq: string, depth: number, memo: Map<string, bigint>): bigint {
  let prev = 'A';
  let total = 0n;
  for (const ch of seq) { total += oracleDirCost(prev, ch, depth, memo); prev = ch; }
  return total;
}

function oracleCodeLength(raw: string, depth: number, memo: Map<string, bigint>): bigint {
  let prev = 'A';
  let total = 0n;
  for (const ch of raw) {
    total += minPathCost(allShortestPaths(NUM_GRID, prev, ch), depth, memo);
    prev = ch;
  }
  return total;
}

function oracleTotalComplexity(codes: readonly string[], depth: number): bigint {
  const memo = new Map<string, bigint>();
  let total = 0n;
  for (const raw of codes) total += BigInt(raw.slice(0, -1)) * oracleCodeLength(raw, depth, memo);
  return total;
}

describe('Day 21 Part 2 solver', () => {
  it('configures 25 directional robots and matches the 5x5 directional DP against the oracle', () => {
    expect(PART2_CONFIG.directionalRobots).toBe(PART2_DIRECTIONAL_ROBOTS);
    const table = buildDirectionalCostTable(PART2_DIRECTIONAL_ROBOTS);
    const memo = new Map<string, bigint>();
    for (const from of DIRECTIONAL_KEYS) {
      for (const to of DIRECTIONAL_KEYS) {
        expect(table.costOf(from, to, 25)).toBe(oracleDirCost(from, to, 25, memo));
      }
    }
  });

  it('solves the official five example codes and matches the independent oracle', () => {
    const codes = parseDoorCodes(EXAMPLE_INPUT);
    expect(solvePart2(codes)).toBe(oracleTotalComplexity(EXAMPLE_CODES, 25));
    expect(solvePart2(codes)).toBe(154115708116294n);
  });

  it('handles synthetic edge codes (000A, 999A, 1000A) and rejects invalid inputs', () => {
    const table = buildDirectionalCostTable(PART2_DIRECTIONAL_ROBOTS);
    const memo = new Map<string, bigint>();
    const zeroCode = new DoorCode('000A');
    const zeroLen = solveDoorCode(zeroCode, table).shortestLength;
    expect(zeroLen).toBeGreaterThan(0n);
    expect(zeroLen).toBe(oracleCodeLength('000A', 25, memo));
    expect(solvePart2([zeroCode])).toBe(0n);
    expect(solvePart2(parseDoorCodes('999A\n1000A'))).toBe(oracleTotalComplexity(['999A', '1000A'], 25));
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('12B')).toThrow(RangeError);
    expect(() => solver.trace!([])).toThrow(RangeError);
  });

  it('executes via executeSolver with fake Clock and produces bounded traces', () => {
    let ticks = 100;
    const fakeClock: Clock = { nowMs: () => (ticks += 11) };
    const run = executeSolver(solver, EXAMPLE_INPUT, fakeClock);
    expect(run.answer).toBe(154115708116294n);
    expect(run.elapsedMs).toBe(11);
    expect(run.runtime).toBe('main-thread');

    const parsed = solver.parse(EXAMPLE_INPUT);
    const frames = solver.trace!(parsed);
    expect(frames).toHaveLength(32);
    for (let i = 0; i <= 25; i += 1) {
      expect(frames[i]!.phase).toBe('table');
      expect(frames[i]!.activeNumericSeq).toBeNull();
    }
    expect(frames[26]!.phase).toBe('code');
    expect(frames[26]!.activeNumericSeq).not.toBeNull();
    expect(frames[26]!.activeLayers).toBeNull();
    expect(frames[31]!.phase).toBe('complete');
    expect(frames[31]!.activeNumericSeq).not.toBeNull();
    expect(frames[31]!.activeLayers).toBeNull();

    const capped = solver.trace!(parsed, { maxSteps: 6 });
    expect(capped).toHaveLength(6);
    expect(capped[5]!.phase).toBe('complete');
  });
});
