import { describe, expect, it } from 'vitest';
import { DIRS_4 } from '../../../../shared/core';
import { expandedGalaxyCoords, parseUniverseMap, sumExpandedPairwiseDistances } from '../../shared';
import { solver } from './index';

class LcgRng {
  private state: number;
  constructor(seed: number) { this.state = seed >>> 0; }
  next(): number {
    this.state = (Math.imul(1664525, this.state) + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }
}

function generateGrid(rng: LcgRng, rows: number, cols: number, density: number): string {
  const lines: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    let line = '';
    for (let c = 0; c < cols; c += 1) line += rng.next() < density ? '#' : '.';
    lines.push(line);
  }
  return lines.join('\n');
}

function pairwiseExpandedOracle(raw: string, factor: bigint): bigint {
  const coords = expandedGalaxyCoords(parseUniverseMap(raw), factor);
  let total = 0n;
  for (let i = 0; i < coords.length; i += 1) {
    for (let j = i + 1; j < coords.length; j += 1) {
      const a = coords[i]!;
      const b = coords[j]!;
      const dr = a.row >= b.row ? a.row - b.row : b.row - a.row;
      const dc = a.col >= b.col ? a.col - b.col : b.col - a.col;
      total += dr + dc;
    }
  }
  return total;
}

function buildExpandedRows(raw: string, factor: number): string[] {
  const lines = raw.split('\n');
  const colEmpty = Array.from({ length: lines[0]!.length }, (_, c) => lines.every((l) => l[c] === '.'));
  const out: string[] = [];
  for (const line of lines) {
    let expanded = '';
    for (let c = 0; c < line.length; c += 1) expanded += colEmpty[c] ? '.'.repeat(factor) : line[c]!;
    const copies = line.includes('#') ? 1 : factor;
    for (let k = 0; k < copies; k += 1) out.push(expanded);
  }
  return out;
}

function bfsSumFromSource(grid: readonly string[], startIdx: number, targets: ReadonlySet<number>): number {
  const rows = grid.length;
  const cols = grid[0]!.length;
  const dist = new Int32Array(rows * cols).fill(-1);
  const queue = [startIdx];
  dist[startIdx] = 0;
  let sum = 0;
  for (let head = 0; head < queue.length; head += 1) {
    const idx = queue[head]!;
    const d = dist[idx]!;
    if (targets.has(idx)) sum += d;
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    for (const [dr, dc] of DIRS_4) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const nIdx = nr * cols + nc;
      if (dist[nIdx] !== -1) continue;
      dist[nIdx] = d + 1;
      queue.push(nIdx);
    }
  }
  return sum;
}

function literalExpandedBfsOracle(raw: string, factor: number): bigint {
  const grid = buildExpandedRows(raw, factor);
  const cols = grid[0]!.length;
  const galaxies: number[] = [];
  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < cols; c += 1) if (grid[r]![c] === '#') galaxies.push(r * cols + c);
  }
  let total = 0n;
  for (let i = 0; i < galaxies.length; i += 1) {
    total += BigInt(bfsSumFromSource(grid, galaxies[i]!, new Set(galaxies.slice(i + 1))));
  }
  return total;
}

function transposeRaw(raw: string): string {
  const lines = raw.split('\n');
  return Array.from({ length: lines[0]!.length }, (_, c) => lines.map((l) => l[c]!).join('')).join('\n');
}

describe('2023 Day 11 Part 1 independent oracle & invariant tests', () => {
  it('Oracle 1: matches O(G^2) pairwise expanded Manhattan sum on seeded grids and multiple F', () => {
    const rng = new LcgRng(20231101);
    const factors = [1n, 2n, 10n, 100n, 1_000_000n];
    for (let trial = 0; trial < 15; trial += 1) {
      const raw = generateGrid(rng, 10 + (trial % 5), 11 + (trial % 4), 0.14);
      const universe = parseUniverseMap(raw);
      for (const f of factors) expect(sumExpandedPairwiseDistances(universe, f)).toBe(pairwiseExpandedOracle(raw, f));
      expect(solver.solve(solver.parse(raw))).toBe(pairwiseExpandedOracle(raw, 2n));
    }
  });

  it('Oracle 2: matches literal expanded-grid DIRS_4 BFS on small grids for F = 1, 2, 3', () => {
    const rng = new LcgRng(20231102);
    for (let trial = 0; trial < 10; trial += 1) {
      const raw = generateGrid(rng, 6, 7, 0.22);
      const universe = parseUniverseMap(raw);
      for (const f of [1, 2, 3]) {
        expect(sumExpandedPairwiseDistances(universe, BigInt(f))).toBe(literalExpandedBfsOracle(raw, f));
      }
    }
  });

  it('Oracle 3: satisfies exact affine linearity S(F) = S(1) + (F - 1) * (S(2) - S(1))', () => {
    const rng = new LcgRng(20231103);
    for (let trial = 0; trial < 10; trial += 1) {
      const universe = parseUniverseMap(generateGrid(rng, 14, 12, 0.12));
      const s1 = sumExpandedPairwiseDistances(universe, 1n);
      const s2 = sumExpandedPairwiseDistances(universe, 2n);
      for (const f of [5n, 42n, 1_000_000n, 10n ** 12n]) {
        expect(sumExpandedPairwiseDistances(universe, f)).toBe(s1 + (f - 1n) * (s2 - s1));
      }
    }
  });

  it('Oracle 4: is invariant under transpose and horizontal/vertical reflections', () => {
    const rng = new LcgRng(20231104);
    for (let trial = 0; trial < 8; trial += 1) {
      const raw = generateGrid(rng, 9, 13, 0.16);
      const base = solver.solve(solver.parse(raw));
      const flipH = raw.split('\n').map((l) => [...l].reverse().join('')).join('\n');
      const flipV = raw.split('\n').reverse().join('\n');
      expect(solver.solve(solver.parse(transposeRaw(raw)))).toBe(base);
      expect(solver.solve(solver.parse(flipH))).toBe(base);
      expect(solver.solve(solver.parse(flipV))).toBe(base);
    }
  });
});
