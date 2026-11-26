import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { ElfInventory, sumCalories } from '../../shared';
import { PART2_TOP_COUNT, solveTopThreeCalories, solver, traceTopThreeCalories } from './index';

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

const OVERFLOW_CALORIES = 4_000_000_000_000_000;

class LcgRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  nextFloat(): number {
    this.state = (Math.imul(1664525, this.state) + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }

  nextInt(min: number, maxInclusive: number): number {
    return min + Math.floor(this.nextFloat() * (maxInclusive - min + 1));
  }
}

function sortTopThreeOracle(inventories: readonly ElfInventory[]): number {
  const sorted = [...inventories].sort((a, b) => b.totalCalories - a.totalCalories);
  return sorted[0]!.totalCalories + sorted[1]!.totalCalories + sorted[2]!.totalCalories;
}

function makeRandomElves(rng: LcgRng, elfCount: number): readonly ElfInventory[] {
  const elves: ElfInventory[] = [];
  for (let e = 1; e <= elfCount; e += 1) {
    const itemCount = rng.nextInt(1, 6);
    const items: number[] = [];
    for (let j = 0; j < itemCount; j += 1) {
      items.push(rng.nextInt(1, 15000));
    }
    elves.push(new ElfInventory(e, items));
  }
  return elves;
}

describe('2022 day 01 part 2 solver', () => {
  it('solves the official example to 45000 via solver and executeSolver', () => {
    expect(PART2_TOP_COUNT).toBe(3);
    const parsed = solver.parse(EXAMPLE_INPUT);
    expect(solveTopThreeCalories(parsed)).toBe(45000);

    let tick = 10;
    const fakeClock: Clock = { nowMs: () => (tick += 5) };
    const result = executeSolver(solver, EXAMPLE_INPUT, fakeClock);
    expect(result).toEqual({ answer: 45000, elapsedMs: 5, runtime: 'main-thread' });
  });

  it('handles exact 3-Elf boundary and rejects fewer than 3 Elves', () => {
    const three = solver.parse('100\n\n200\n\n300');
    expect(solveTopThreeCalories(three)).toBe(600);
    expect(traceTopThreeCalories(three)).toHaveLength(3);

    const one = solver.parse('100');
    const two = solver.parse('100\n\n200');
    for (const invalid of [[], one, two]) {
      expect(() => solveTopThreeCalories(invalid)).toThrow(RangeError);
      expect(() => solver.solve(invalid)).toThrow(RangeError);
      expect(() => traceTopThreeCalories(invalid)).toThrow(RangeError);
      expect(() => solver.trace!(invalid)).toThrow(RangeError);
    }
  });

  it('propagates parse, trace option, and combined safe-integer overflow errors', () => {
    expect(() => solver.parse('')).toThrow(Error);
    expect(() => solver.parse('100\nbad')).toThrow(/Line 2:/);
    expect(() => solver.trace!(solver.parse('10\n\n20\n\n30'), { maxSteps: 0 })).toThrow(RangeError);

    const overflowElves = [
      new ElfInventory(1, [OVERFLOW_CALORIES]),
      new ElfInventory(2, [OVERFLOW_CALORIES]),
      new ElfInventory(3, [OVERFLOW_CALORIES]),
    ];
    expect(() => solveTopThreeCalories(overflowElves)).toThrow(RangeError);
  });

  it('retains earlier Elves on ties across the 3rd-place cutoff', () => {
    const tied = solver.parse('500\n\n400\n\n300\n\n300\n\n350');
    const frames = traceTopThreeCalories(tied);
    expect(frames).toHaveLength(5);
    expect(frames[2]?.leaders.map((e) => e.elfNumber)).toEqual([1, 2, 3]);
    expect(frames[3]?.enteredLeaderboard).toBe(false);
    expect(frames[3]?.leaders.map((e) => e.elfNumber)).toEqual([1, 2, 3]);
    expect(frames[4]?.enteredLeaderboard).toBe(true);
    expect(frames[4]?.leaders.map((e) => e.elfNumber)).toEqual([1, 2, 5]);
    expect(sumCalories(frames[4]!.leaders)).toBe(1250);
  });

  it('bounds trace frames via sampling and returns frozen snapshots', () => {
    const twentyElves = Array.from({ length: 20 }, (_, i) => new ElfInventory(i + 1, [100 * (i + 1)]));
    const frames = traceTopThreeCalories(twentyElves, { maxSteps: 6 });
    expect(frames).toHaveLength(6);
    expect(Object.isFrozen(frames)).toBe(true);
    const lastFrame = frames[frames.length - 1]!;
    expect(Object.isFrozen(lastFrame)).toBe(true);
    expect(Object.isFrozen(lastFrame.leaders)).toBe(true);
    expect(lastFrame.elfIndex).toBe(19);
    expect(lastFrame.leaders.map((e) => e.elfNumber)).toEqual([20, 19, 18]);
  });

  it('matches sortTopThreeOracle across 50 deterministic LCG trials', () => {
    const rng = new LcgRng(20220102);
    for (let trial = 0; trial < 50; trial += 1) {
      const elves = makeRandomElves(rng, rng.nextInt(3, 25));
      const expected = sortTopThreeOracle(elves);
      expect(solver.solve(elves)).toBe(expected);
      const frames = solver.trace!(elves, { maxSteps: 8 });
      const finalLeaders = frames[frames.length - 1]!.leaders;
      expect(finalLeaders).toHaveLength(3);
      expect(sumCalories(finalLeaders)).toBe(expected);
    }
  });
});
