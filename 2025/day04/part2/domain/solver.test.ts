import { describe, expect, it } from 'vitest';
import { DIRS_8, executeSolver } from '../../../../shared/core';
import {
  EMPTY_CELL_WAVE, MAX_BLOCKING_NEIGHBORS, SURVIVOR_WAVE, WarehouseFloor, peelWarehouse, solver,
} from './index';

const EXAMPLE_INPUT = [
  '..@@.@@@@.', '@@@.@.@.@@', '@@@@@.@.@@', '@.@@@@..@.', '@@.@@@@.@@',
  '.@@@@@@@.@', '.@.@.@.@@@', '@.@@@.@@@@', '.@@@@@@@@.', '@.@.@@@.@.',
].join('\n');

function iterativeFullScanOracle(floor: WarehouseFloor): { totalRemoved: number; waveCounts: number[] } {
  const active = Array.from({ length: floor.rows }, (_, r) => Array.from({ length: floor.cols }, (_, c) => floor.isRoll(r, c)));
  const waveCounts: number[] = [];
  for (let totalRemoved = 0; ;) {
    const rm: [number, number][] = [];
    for (let r = 0; r < floor.rows; r += 1) for (let c = 0; c < floor.cols; c += 1) {
      if (!active[r]![c]) continue;
      let deg = 0;
      for (const [dr, dc] of DIRS_8) if (floor.grid.inBounds(r + dr, c + dc) && active[r + dr]![c + dc]) deg += 1;
      if (deg < MAX_BLOCKING_NEIGHBORS) rm.push([r, c]);
    }
    if (rm.length === 0) return { totalRemoved, waveCounts };
    for (const [r, c] of rm) active[r]![c] = false;
    waveCounts.push(rm.length);
    totalRemoved += rm.length;
  }
}

describe('2025 Day 4 Part 2 solver', () => {
  it('solves the official 10x10 example, exposes wave stats, and keeps floor immutable', () => {
    const floor = solver.parse(EXAMPLE_INPUT);
    const res = peelWarehouse(floor);
    expect(res.totalRemoved).toBe(43);
    expect(res.waveCounts).toEqual([13, 12, 7, 5, 2, 1, 1, 1, 1]);
    expect([res.totalWaves, res.totalRolls, res.survivorCount]).toEqual([9, 71, 28]);
    expect(Object.isFrozen(res) && Object.isFrozen(res.waveCounts)).toBe(true);
    expect([solver.solve(floor), solver.solve(floor), executeSolver(solver, EXAMPLE_INPUT).answer]).toEqual([43, 43, 43]);
  });

  it('handles empty, thin, full, and 4-core octagon boundary grids', () => {
    expect(peelWarehouse(solver.parse('...\n...\n...')).totalRemoved).toBe(0);
    expect(peelWarehouse(solver.parse('@')).waveCounts).toEqual([1]);
    expect(peelWarehouse(solver.parse('@@@@@')).waveCounts).toEqual([5]);
    expect(peelWarehouse(solver.parse('@\n@\n@\n@\n@')).waveCounts).toEqual([5]);
    expect(peelWarehouse(solver.parse('@@@\n@@@\n@@@')).waveCounts).toEqual([4, 4, 1]);
    const full4 = peelWarehouse(solver.parse('@@@@\n@@@@\n@@@@\n@@@@'));
    expect([full4.waveCounts, full4.survivorCount]).toEqual([[4], 12]);
    const oct = peelWarehouse(solver.parse('.@@.\n@@@@\n@@@@\n.@@.'));
    expect([oct.totalWaves, oct.survivorCount, oct.removalWave[0], oct.removalWave[1]]).toEqual([0, 12, EMPTY_CELL_WAVE, SURVIVOR_WAVE]);
  });

  it('traces default, maxSteps=1, strided sampling, 0-wave grids, and rejects invalid maxSteps', () => {
    const floor = solver.parse(EXAMPLE_INPUT);
    const def = solver.trace!(floor);
    expect(def).toHaveLength(10);
    expect([def[0], def.at(-1)]).toEqual([{ wave: 0, removedThisWave: 0, cumulativeRemoved: 0 }, { wave: 9, removedThisWave: 1, cumulativeRemoved: 43 }]);
    expect(solver.trace!(floor, { maxSteps: 1 })).toEqual([{ wave: 9, removedThisWave: 1, cumulativeRemoved: 43 }]);
    expect(solver.trace!(floor, { maxSteps: 4 }).map((f) => f.wave)).toEqual([0, 3, 6, 9]);
    expect(solver.trace!(floor, { maxSteps: 3 }).map((f) => f.wave)).toEqual([0, 5, 9]);
    const oct = solver.parse('.@@.\n@@@@\n@@@@\n.@@.');
    expect(solver.trace!(oct)).toEqual([{ wave: 0, removedThisWave: 0, cumulativeRemoved: 0 }]);
    expect(solver.trace!(oct, { maxSteps: 1 })).toEqual([{ wave: 0, removedThisWave: 0, cumulativeRemoved: 0 }]);
    for (const bad of [0, -2, 2.5, Number.NaN]) expect(() => solver.trace!(floor, { maxSteps: bad })).toThrow(RangeError);
  });

  it('matches iterative full-scan oracle across 30 deterministic LCG grids', () => {
    let seed = 0x51a7b3c9;
    const nextRand = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 0x100000000);
    for (let i = 0; i < 30; i += 1) {
      const [rows, cols, density] = [1 + Math.floor(nextRand() * 22), 1 + Math.floor(nextRand() * 22), 0.1 + nextRand() * 0.85];
      const raw = Array.from({ length: rows }, () => Array.from({ length: cols }, () => (nextRand() < density ? '@' : '.')).join('')).join('\n');
      const floor = solver.parse(raw);
      const res = peelWarehouse(floor);
      const oracle = iterativeFullScanOracle(floor);
      expect([res.totalRemoved, res.waveCounts]).toEqual([oracle.totalRemoved, oracle.waveCounts]);
    }
  });
});
