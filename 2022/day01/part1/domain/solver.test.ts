import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { ElfInventory } from '../../shared';
import { PART1_TOP_COUNT, solveMaxCalories, solver, traceMaxCalories } from './index';

const EXAMPLE_INPUT = `1000
2000
3000

4000

5000
6000

7000
8000
9000

10000`;

function makeLcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function sortDescendingOracle(inventories: readonly ElfInventory[]): number {
  return [...inventories].sort((a, b) => b.totalCalories - a.totalCalories)[0]!.totalCalories;
}

describe('2022 day 01 part 1 solver', () => {
  it('solves the official example to 24000 via solver and executeSolver', () => {
    expect(PART1_TOP_COUNT).toBe(1);
    const parsed = solver.parse(EXAMPLE_INPUT);
    expect(solveMaxCalories(parsed)).toBe(24000);

    let tick = 10;
    const fakeClock: Clock = { nowMs: () => (tick += 5) };
    const result = executeSolver(solver, EXAMPLE_INPUT, fakeClock);
    expect(result).toEqual({ answer: 24000, elapsedMs: 5, runtime: 'main-thread' });
  });

  it('traces max calories and retains the earliest Elf on ties', () => {
    const tied = solver.parse('400\n100\n\n250\n250\n\n300');
    const frames = traceMaxCalories(tied);
    expect(frames).toHaveLength(3);
    expect(frames[0]?.leaders[0]?.elfNumber).toBe(1);
    expect(frames[1]?.enteredLeaderboard).toBe(false);
    expect(frames[1]?.leaders[0]?.elfNumber).toBe(1);
    expect(frames[2]?.leaders[0]?.totalCalories).toBe(500);
  });

  it('propagates parse, empty-inventory, and trace maxSteps errors', () => {
    expect(() => solver.parse('')).toThrow(Error);
    expect(() => solver.parse('100\nbad')).toThrow(/Line 2:/);
    expect(() => solveMaxCalories([])).toThrow(RangeError);
    expect(() => solver.trace!(solver.parse('100'), { maxSteps: 0 })).toThrow(RangeError);
  });

  it('matches sortDescendingOracle across 50 deterministic PRNG inventories', () => {
    const nextRand = makeLcg(20220101);
    for (let trial = 0; trial < 50; trial += 1) {
      const elfCount = 1 + Math.floor(nextRand() * 25);
      const elves: ElfInventory[] = [];
      for (let e = 1; e <= elfCount; e += 1) {
        const itemCount = 1 + Math.floor(nextRand() * 6);
        const items = Array.from({ length: itemCount }, () => 1 + Math.floor(nextRand() * 15000));
        elves.push(new ElfInventory(e, items));
      }
      const expected = sortDescendingOracle(elves);
      expect(solver.solve(elves)).toBe(expected);
      const frames = solver.trace!(elves, { maxSteps: 8 });
      expect(frames[frames.length - 1]?.leaders[0]?.totalCalories).toBe(expected);
    }
  });
});
