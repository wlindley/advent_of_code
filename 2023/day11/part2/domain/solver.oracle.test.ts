import { describe, expect, it } from 'vitest';
import { createCosmicExpansionSolver } from '../../shared';
import { PART2_EXPANSION_FACTOR, solver } from './index';

const EXAMPLE_RAW = [
  '...#......',
  '.......#..',
  '#.........',
  '..........',
  '......#...',
  '.#........',
  '.........#',
  '..........',
  '.......#..',
  '#...#.....',
].join('\n');

class LcgRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (Math.imul(1664525, this.state) + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }
}

function generateGrid(rng: LcgRng, rows: number, cols: number, density: number): string {
  const lines: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    let line = '';
    for (let c = 0; c < cols; c += 1) {
      line += rng.next() < density ? '#' : '.';
    }
    lines.push(line);
  }
  return lines.join('\n');
}

function buildAxisMap(counts: readonly number[], factor: bigint): bigint[] {
  const mapped: bigint[] = [];
  let pos = 0n;
  for (let i = 0; i < counts.length; i += 1) {
    mapped.push(pos);
    pos += counts[i]! === 0 ? factor : 1n;
  }
  return mapped;
}

function countAxes(lines: readonly string[]): { rowCounts: number[]; colCounts: number[] } {
  const rowCounts = new Array<number>(lines.length).fill(0);
  const colCounts = new Array<number>(lines[0]!.length).fill(0);
  for (let r = 0; r < lines.length; r += 1) {
    const line = lines[r]!;
    for (let c = 0; c < line.length; c += 1) {
      if (line[c] === '#') {
        rowCounts[r]! += 1;
        colCounts[c]! += 1;
      }
    }
  }
  return { rowCounts, colCounts };
}

function extractExpandedAxes(
  raw: string,
  factor: bigint,
): { rows: bigint[]; cols: bigint[] } {
  const lines = raw.split('\n');
  const { rowCounts, colCounts } = countAxes(lines);
  const rowMap = buildAxisMap(rowCounts, factor);
  const colMap = buildAxisMap(colCounts, factor);
  const rows: bigint[] = [];
  const cols: bigint[] = [];
  for (let r = 0; r < lines.length; r += 1) {
    const line = lines[r]!;
    for (let c = 0; c < line.length; c += 1) {
      if (line[c] === '#') {
        rows.push(rowMap[r]!);
        cols.push(colMap[c]!);
      }
    }
  }
  return { rows, cols };
}

function bruteForceManhattanOracle(raw: string, factor: bigint): bigint {
  const { rows, cols } = extractExpandedAxes(raw, factor);
  let total = 0n;
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      const dr = rows[i]! >= rows[j]! ? rows[i]! - rows[j]! : rows[j]! - rows[i]!;
      const dc = cols[i]! >= cols[j]! ? cols[i]! - cols[j]! : cols[j]! - cols[i]!;
      total += dr + dc;
    }
  }
  return total;
}

function compareBigInt(a: bigint, b: bigint): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function sumSortedAxisPrefix(coords: readonly bigint[]): bigint {
  const sorted = [...coords].sort(compareBigInt);
  let prefixSum = 0n;
  let total = 0n;
  for (let i = 0; i < sorted.length; i += 1) {
    const coord = sorted[i]!;
    total += BigInt(i) * coord - prefixSum;
    prefixSum += coord;
  }
  return total;
}

function prefixSumAxisOracle(raw: string, factor: bigint): bigint {
  const { rows, cols } = extractExpandedAxes(raw, factor);
  return sumSortedAxisPrefix(rows) + sumSortedAxisPrefix(cols);
}

describe('2023 Day 11 Part 2 independent oracle tests', () => {
  it('Oracle 1: matches brute-force O(G^2) expanded Manhattan sum at 10n, 100n, and 1_000_000n', () => {
    const rng = new LcgRng(20231121);
    const grids = [EXAMPLE_RAW];
    for (let trial = 0; trial < 12; trial += 1) {
      grids.push(generateGrid(rng, 10 + (trial % 5), 11 + (trial % 4), 0.15));
    }
    for (const raw of grids) {
      const parsed = solver.parse(raw);
      for (const factor of [10n, 100n, PART2_EXPANSION_FACTOR]) {
        const expected = bruteForceManhattanOracle(raw, factor);
        expect(createCosmicExpansionSolver(factor).solve(parsed)).toBe(expected);
      }
      expect(solver.solve(parsed)).toBe(bruteForceManhattanOracle(raw, PART2_EXPANSION_FACTOR));
    }
  });

  it('Oracle 2: satisfies exact affine extrapolation S(1n) + 999_999n * (S(2n) - S(1n))', () => {
    const rng = new LcgRng(20231122);
    const s1Solver = createCosmicExpansionSolver(1n);
    const s2Solver = createCosmicExpansionSolver(2n);
    const grids = [EXAMPLE_RAW];
    for (let trial = 0; trial < 12; trial += 1) {
      grids.push(generateGrid(rng, 12 + (trial % 4), 10 + (trial % 5), 0.14));
    }
    for (const raw of grids) {
      const parsed = solver.parse(raw);
      const s1 = s1Solver.solve(parsed);
      const s2 = s2Solver.solve(parsed);
      expect(solver.solve(parsed)).toBe(s1 + 999_999n * (s2 - s1));
    }
  });

  it('Oracle 3: matches independent sorted-coordinate prefix-sum oracle', () => {
    const rng = new LcgRng(20231123);
    const grids = [EXAMPLE_RAW];
    for (let trial = 0; trial < 12; trial += 1) {
      grids.push(generateGrid(rng, 9 + (trial % 6), 13 + (trial % 3), 0.16));
    }
    for (const raw of grids) {
      const parsed = solver.parse(raw);
      expect(solver.solve(parsed)).toBe(prefixSumAxisOracle(raw, PART2_EXPANSION_FACTOR));
    }
  });
});
