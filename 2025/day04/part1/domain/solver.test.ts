import { describe, expect, it } from 'vitest';
import { DIRS_8, executeSolver } from '../../../../shared/core';
import { MAX_BLOCKING_NEIGHBORS, WarehouseFloor, solver } from './index';

const EXAMPLE_INPUT = [
  '..@@.@@@@.', '@@@.@.@.@@', '@@@@@.@.@@', '@.@@@@..@.', '@@.@@@@.@@',
  '.@@@@@@@.@', '.@.@.@.@@@', '@.@@@.@@@@', '.@@@@@@@@.', '@.@.@@@.@.',
].join('\n');

function direct8DirOracle(floor: WarehouseFloor): number {
  let accessible = 0;
  for (let r = 0; r < floor.rows; r += 1) {
    for (let c = 0; c < floor.cols; c += 1) {
      if (!floor.isRoll(r, c)) continue;
      let neighbors = 0;
      for (const [dr, dc] of DIRS_8) {
        if (floor.grid.inBounds(r + dr, c + dc) && floor.isRoll(r + dr, c + dc)) neighbors += 1;
      }
      if (neighbors < MAX_BLOCKING_NEIGHBORS) accessible += 1;
    }
  }
  return accessible;
}

describe('2025 Day 4 Part 1 solver', () => {
  it('solves the official 10x10 example via solver and executeSolver', () => {
    const floor = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(floor)).toBe(13);
    expect(executeSolver(solver, EXAMPLE_INPUT).answer).toBe(13);
  });

  it('handles boundary grids and the exact degree 3 vs 4 accessibility threshold', () => {
    expect(solver.solve(solver.parse('...\n...\n...'))).toBe(0);
    expect(solver.solve(solver.parse('@'))).toBe(1);
    expect(solver.solve(solver.parse('@@@@@'))).toBe(5);
    expect(solver.solve(solver.parse('@@\n@@'))).toBe(4);
    expect(solver.solve(solver.parse('@@@\n@@@\n@@@'))).toBe(4);
    // Center roll with 3 neighbors is accessible; with 4 neighbors it is blocked.
    expect(solver.solve(solver.parse('.@.\n@@.\n.@.'))).toBe(4);
    expect(solver.solve(solver.parse('.@.\n@@@\n.@.'))).toBe(4); // outer 4 have deg 2, center has deg 4
    expect(direct8DirOracle(solver.parse('.@.\n@@@\n.@.'))).toBe(4);
  });

  it('matches direct 8-direction oracle across 25 seeded random grids', () => {
    let seed = 0x12345678;
    const nextRand = () => {
      seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
    for (let i = 0; i < 25; i += 1) {
      const rows = 1 + Math.floor(nextRand() * 20);
      const cols = 1 + Math.floor(nextRand() * 20);
      const density = 0.1 + nextRand() * 0.85;
      const lines = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => (nextRand() < density ? '@' : '.')).join(''),
      ).join('\n');
      const floor = solver.parse(lines);
      expect(solver.solve(floor)).toBe(direct8DirOracle(floor));
    }
  });

  it('traces default, maxSteps=1, sampled maxSteps=4, non-aliasing histograms, and rejects invalid maxSteps', () => {
    const floor = solver.parse(EXAMPLE_INPUT);

    const defFrames = solver.trace!(floor);
    expect(defFrames).toHaveLength(11);
    expect(defFrames[0]).toEqual({
      step: 0,
      scannedRows: 0,
      totalRolls: 0,
      accessibleCount: 0,
      degreeHistogram: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    });
    const last = defFrames.at(-1)!;
    expect(last.scannedRows).toBe(10);
    expect(last.accessibleCount).toBe(13);
    expect(last.degreeHistogram.reduce((a, b) => a + b, 0)).toBe(last.totalRolls);
    expect(defFrames[0]!.degreeHistogram).not.toBe(last.degreeHistogram);

    const single = solver.trace!(floor, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.scannedRows).toBe(10);
    expect(single[0]!.accessibleCount).toBe(13);

    const sampled = solver.trace!(floor, { maxSteps: 4 });
    expect(sampled.map((f) => f.scannedRows)).toEqual([0, 4, 8, 10]);
    expect(sampled.at(-1)!.accessibleCount).toBe(13);

    for (const bad of [0, -2, 2.5, Number.NaN]) {
      expect(() => solver.trace!(floor, { maxSteps: bad })).toThrow(RangeError);
    }
  });
});
