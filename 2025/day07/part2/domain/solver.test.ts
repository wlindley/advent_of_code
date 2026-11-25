import { describe, expect, it } from 'vitest';
import { DEFAULT_MAX_TRACE_STEPS, EMPTY_DENSITY, TachyonManifold, bigIntLog2, simulateQuantum, solver } from './index';

const EXAMPLE = [
  '.......S.......', '...............', '.......^.......', '...............',
  '......^.^......', '...............', '.....^.^.^.....', '...............',
  '....^.^...^....', '...............', '...^.^...^.^...', '...............',
  '..^...^.....^..', '...............', '.^.^.^.^.^...^.', '...............',
].join('\n');
const LATTICE_141X3 = Array.from({ length: 141 }, (_, r) => (r === 0 ? '.S.' : r % 2 === 1 ? '.^.' : '^.^')).join('\n');

function bottomUpOracle(m: TachyonManifold): bigint {
  let below = Array.from({ length: m.cols }, () => 1n);
  for (let r = m.rows - 1; r > m.startRow; r -= 1) {
    below = below.map((_, c) =>
      m.isSplitter(r, c) ? (c > 0 ? below[c - 1]! : 1n) + (c + 1 < m.cols ? below[c + 1]! : 1n) : below[c]!,
    );
  }
  return below[m.startCol]!;
}

describe('2025 Day 7 Part 2 solver', () => {
  it('computes bigIntLog2 accurately for small, huge, and invalid values', () => {
    expect([bigIntLog2(1n), bigIntLog2(2n), bigIntLog2(1n << 2000n)]).toEqual([0, 1, 2000]);
    expect(bigIntLog2(40n)).toBeCloseTo(Math.log2(40), 10);
    expect(bigIntLog2(3n << 1999n)).toBeCloseTo(1999 + Math.log2(3), 10);
    for (const bad of [0n, -1n]) expect(() => bigIntLog2(bad)).toThrow(RangeError);
  });

  it('solves the 16x15 example and records exact cell log-densities', () => {
    const m = solver.parse(EXAMPLE);
    expect(solver.solve(m)).toBe(40n);
    const sim = simulateQuantum(m);
    expect([sim.totalTimelines, sim.exitedEarly]).toEqual([40n, 0n]);
    expect([sim.cellLogDensity[7], sim.cellLogDensity[0], sim.cellLogDensity[14 * m.cols + 9], sim.cellLogDensity[4 * m.cols + 7]])
      .toEqual([0, EMPTY_DENSITY, EMPTY_DENSITY, 1]);
    expect(sim.frames[0]).toEqual({ row: 0, activeCols: 1, rowSplits: 0, totalTimelines: 1n, exitedTimelines: 0n, peakCellTimelines: 1n });
  });

  it('handles edge cases: single cell, splitter above S, 1-col, lateral exits, merge, adjacent ^^', () => {
    expect(solver.solve(solver.parse('S'))).toBe(1n);
    expect(solver.solve(solver.parse('..^..\n..S..\n..^..'))).toBe(2n);
    const oneCol = simulateQuantum(solver.parse('S\n^\n^'));
    expect([oneCol.totalTimelines, oneCol.exitedEarly]).toEqual([2n, 2n]);
    for (const edge of ['S.\n^.', '.S\n.^']) expect([simulateQuantum(solver.parse(edge)).totalTimelines, simulateQuantum(solver.parse(edge)).exitedEarly]).toEqual([2n, 1n]);
    expect(solver.solve(solver.parse('..S..\n..^..\n.^.^.\n..^..'))).toBe(6n);
    const adj = simulateQuantum(solver.parse('.S.\n.^^'));
    expect([adj.totalTimelines, adj.cellLogDensity[5]]).toEqual([2n, EMPTY_DENSITY]);
  });

  it('handles >64-bit BigInt timelines in a 141x3 lattice without precision loss', () => {
    const sim = simulateQuantum(solver.parse(LATTICE_141X3));
    expect(sim.totalTimelines).toBe(3n * (1n << 70n) - 2n);
    expect(sim.maxLogDensity).toBe(70);
  });

  it('matches bottomUpOracle on example, 141x3 lattice, and 25 seeded grids', () => {
    for (const raw of [EXAMPLE, LATTICE_141X3]) expect(solver.solve(solver.parse(raw))).toBe(bottomUpOracle(solver.parse(raw)));
    let seed = 0x20250702;
    const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0x100000000);
    const widths = [1, 2, 7, 31, 65];
    for (let i = 0; i < 25; i += 1) {
      const cols = widths[i % widths.length]!, rows = 4 + (i % 7);
      const startRow = i % 3 === 0 ? Math.floor(rows / 2) : 0, startCol = Math.floor(rand() * cols);
      const density = [0.15, 0.35, 0.65, 0.9, 0.5][Math.floor(i / 5)]!;
      const m = solver.parse(Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => (r === startRow && c === startCol ? 'S' : rand() < density ? '^' : '.')).join(''),
      ).join('\n'));
      expect(solver.solve(m)).toBe(bottomUpOracle(m));
    }
  });

  it('traces with downsampling, rejects invalid maxSteps, and rejects invalid inputs', () => {
    const m = solver.parse(EXAMPLE);
    const full = solver.trace!(m);
    expect(full).toHaveLength(16);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(160);
    expect(solver.trace!(m, { maxSteps: 1 })).toEqual([full[15]]);
    expect(solver.trace!(m, { maxSteps: 5 }).map((f) => f.row)).toEqual([0, 4, 8, 11, 15]);
    for (const bad of [0, -3, 2.5, Number.NaN]) expect(() => solver.trace!(m, { maxSteps: bad })).toThrow(RangeError);
    expect(() => solver.parse('...')).toThrow();
  });
});
