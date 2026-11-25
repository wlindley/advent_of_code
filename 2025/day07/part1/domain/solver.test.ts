import { describe, expect, it } from 'vitest';
import { CellState, DEFAULT_MAX_TRACE_STEPS, TachyonManifold, simulateBeams, solver } from './index';

const EXAMPLE = [
  '.......S.......', '...............', '.......^.......', '...............',
  '......^.^......', '...............', '.....^.^.^.....', '...............',
  '....^.^...^....', '...............', '...^.^...^.^...', '...............',
  '..^...^.....^..', '...............', '.^.^.^.^.^...^.', '...............',
].join('\n');

function bigIntOracle(m: TachyonManifold): { totalSplits: number; activeAtExit: number } {
  const mask = (1n << BigInt(m.cols)) - 1n;
  let beams = 1n << BigInt(m.startCol);
  let totalSplits = 0;
  for (let r = m.startRow + 1; r < m.rows; r += 1) {
    let splitMask = 0n;
    for (let c = 0; c < m.cols; c += 1) if (m.isSplitter(r, c)) splitMask |= 1n << BigInt(c);
    const hits = beams & splitMask;
    for (let h = hits; h !== 0n; h &= h - 1n) totalSplits += 1;
    beams = ((beams & ~splitMask) | (hits >> 1n) | (hits << 1n)) & mask;
  }
  let activeAtExit = 0;
  for (let b = beams; b !== 0n; b &= b - 1n) activeAtExit += 1;
  return { totalSplits, activeAtExit };
}

describe('2025 Day 7 Part 1 solver', () => {
  it('solves the 16x15 example and records exact cell states', () => {
    const m = solver.parse(EXAMPLE);
    expect(solver.solve(m)).toBe(21);
    const sim = simulateBeams(m);
    expect(sim.totalSplits).toBe(21);
    expect(sim.activeAtExit).toBe(9);
    expect(sim.cellStates[14 * m.cols + 9]).toBe(CellState.UnreachedSplitter);
    expect(sim.cellStates[2 * m.cols + 7]).toBe(CellState.HitSplitter);
    expect(sim.cellStates[2 * m.cols + 6]).toBe(CellState.Beam);
    expect(sim.cellStates[0 * m.cols + 7]).toBe(CellState.Beam);
    expect(sim.cellStates[0]).toBe(CellState.Empty);
  });

  it('handles final-row start, interior start, 1-col clip, edge splitters, merging, and adjacent ^^', () => {
    const cases: Array<[string, number, number]> = [
      ['S', 0, 1],
      ['..^..\n..S..\n..^..', 1, 2],
      ['S\n^\n^', 1, 0],
      ['S..\n^..\n.^.\n..^', 3, 2],
      ['..S..\n..^..\n.^.^.\n..^..', 4, 4],
    ];
    for (const [raw, splits, exit] of cases) {
      const sim = simulateBeams(solver.parse(raw));
      expect([sim.totalSplits, sim.activeAtExit]).toEqual([splits, exit]);
    }
    const adj = simulateBeams(solver.parse('.S.\n.^^'));
    expect([adj.totalSplits, adj.activeAtExit]).toEqual([1, 2]);
    expect(adj.cellStates[4]).toBe(CellState.HitSplitter);
    expect(adj.cellStates[5]).toBe(CellState.UnreachedSplitter);
  });

  it('traces with default cap, maxSteps=1, downsampling, and rejects invalid maxSteps', () => {
    const m = solver.parse(EXAMPLE);
    const full = solver.trace!(m);
    expect(full).toHaveLength(16);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(160);
    expect(solver.trace!(m, { maxSteps: 1 })).toEqual([full[15]]);
    expect(solver.trace!(m, { maxSteps: 5 }).map((f) => f.row)).toEqual([0, 4, 8, 11, 15]);
    for (const bad of [0, -3, 2.5, Number.NaN]) {
      expect(() => solver.trace!(m, { maxSteps: bad })).toThrow(RangeError);
    }
  });

  it('matches BigInt bitmask oracle across 25 deterministic grids of varied widths', () => {
    let seed = 0x20250701;
    const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0x100000000);
    const widths = [1, 2, 7, 65, 141];
    for (let i = 0; i < 25; i += 1) {
      const cols = widths[i % widths.length]!;
      const rows = 4 + (i % 7);
      const startRow = i % 3 === 0 ? Math.floor(rows / 2) : 0;
      const startCol = Math.floor(rand() * cols);
      const density = [0.15, 0.35, 0.65, 0.9, 0.5][Math.floor(i / 5)]!;
      const lines = Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) =>
          r === startRow && c === startCol ? 'S' : rand() < density ? '^' : '.',
        ).join(''),
      );
      const m = solver.parse(lines.join('\n'));
      const sim = simulateBeams(m);
      expect({ totalSplits: sim.totalSplits, activeAtExit: sim.activeAtExit }).toEqual(bigIntOracle(m));
    }
  });
});
