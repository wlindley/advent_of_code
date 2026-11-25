import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { BatteryBank } from '../../shared';
import { PART2_SELECTION_COUNT, solver, traceStackDrops } from './index';

const EXAMPLE = '987654321111111\n811111111111119\n234234234234278\n818181911112111';

function greedyWindowSelect(bank: BatteryBank, count: number): bigint {
  let start = 0;
  let digits = '';
  for (let remaining = count; remaining > 0; remaining -= 1) {
    const end = bank.length - remaining;
    let bestIdx = start;
    for (let i = start + 1; i <= end; i += 1) {
      if (bank.raw[i]! > bank.raw[bestIdx]!) bestIdx = i;
    }
    digits += bank.raw[bestIdx]!;
    start = bestIdx + 1;
  }
  return BigInt(digits);
}

describe('2025 Day 3 Part 2 solver', () => {
  it('solves official example with exact bank joltages and drop breakdowns', () => {
    expect(PART2_SELECTION_COUNT).toBe(12);
    const banks = solver.parse(EXAMPLE);
    expect(solver.solve(banks)).toBe(3121910778619n);
    expect(executeSolver(solver, EXAMPLE).answer).toBe(3121910778619n);

    const frames = solver.trace!(banks);
    expect(frames).toHaveLength(5);
    expect(frames[0]).toEqual({ step: 0, bankIndex: null, breakdown: null, cumulativeJoltage: 0n });
    expect(frames.slice(1).map((f) => f.breakdown!.selection.joltage)).toEqual([
      987654321111n, 811111111119n, 434234234278n, 888911112111n,
    ]);
    expect(frames.slice(1).map((f) => {
      const b = f.breakdown!;
      return [b.evictedCount, b.truncatedCount, b.dropBudget];
    })).toEqual([[0, 3, 3], [3, 0, 3], [3, 0, 3], [3, 0, 3]]);
  });

  it('tracks mixed eviction+truncation, equal digits, exact 12-digit banks, and immutability', () => {
    const mixed = traceStackDrops(new BatteryBank('198765432111111'), 12);
    expect(mixed.selection.joltage).toBe(987654321111n);
    expect([mixed.evictedCount, mixed.truncatedCount, mixed.dropBudget]).toEqual([1, 2, 3]);
    expect(mixed.dispositions).toEqual(['evicted', ...Array(12).fill('kept'), 'truncated', 'truncated']);
    expect(Object.isFrozen(mixed) && Object.isFrozen(mixed.dispositions)).toBe(true);

    const eq = traceStackDrops(new BatteryBank('9'.repeat(14)), 12);
    expect(eq.selection.joltage).toBe(999999999999n);
    expect([eq.evictedCount, eq.truncatedCount, eq.dropBudget]).toEqual([0, 2, 2]);

    const exact12 = traceStackDrops(new BatteryBank('123456789123'), 12);
    expect(exact12.selection.joltage).toBe(123456789123n);
    expect([exact12.evictedCount, exact12.truncatedCount, exact12.dropBudget]).toEqual([0, 0, 0]);
  });

  it('rejects empty/short banks, invalid counts, and invalid maxSteps', () => {
    expect(solver.solve([])).toBe(0n);
    const shortBank = new BatteryBank('12345678912');
    expect(() => solver.solve([shortBank])).toThrow(RangeError);
    expect(() => solver.trace!([shortBank])).toThrow(RangeError);
    expect(() => solver.trace!([shortBank, new BatteryBank('123456789123')], { maxSteps: 1 })).toThrow(RangeError);
    expect(() => traceStackDrops(shortBank, 12)).toThrow(RangeError);

    const twelve = new BatteryBank('123456789123');
    for (const badCount of [0, 13, 1.5]) expect(() => traceStackDrops(twelve, badCount)).toThrow(RangeError);
    for (const badSteps of [0, -1, 1.5, Number.NaN]) expect(() => solver.trace!([twelve], { maxSteps: badSteps })).toThrow(RangeError);
  });

  it('bounds trace frames with stride sampling and handles BigInt scale', () => {
    expect(solver.trace!([])).toEqual([{ step: 0, bankIndex: null, breakdown: null, cumulativeJoltage: 0n }]);
    expect(solver.trace!([], { maxSteps: 1 })).toEqual([{ step: 0, bankIndex: null, breakdown: null, cumulativeJoltage: 0n }]);

    const ten = Array.from({ length: 10 }, () => new BatteryBank('123456789123'));
    expect(solver.trace!(ten, { maxSteps: 6 }).map((f) => f.step)).toEqual([0, 2, 4, 6, 8, 10]);
    const eleven = Array.from({ length: 11 }, () => new BatteryBank('123456789123'));
    expect(solver.trace!(eleven, { maxSteps: 6 }).map((f) => f.step)).toEqual([0, 3, 6, 9, 11]);
    expect(solver.trace!(ten, { maxSteps: 1 })).toMatchObject([{ step: 10, bankIndex: 9, cumulativeJoltage: 1234567891230n }]);
    expect(solver.solve(Array.from({ length: 10_000 }, () => new BatteryBank('9'.repeat(12))))).toBe(9999999999990000n);
  });

  it('matches greedy-window differential oracle on official, edge, and LCG banks', () => {
    let seed = 20250302;
    const nextDigit = () => String(1 + (((seed = (seed * 1664525 + 1013904223) >>> 0)) % 9));
    const lcgBanks = [12, 15, 25, 100].map((len) => new BatteryBank(Array.from({ length: len }, nextDigit).join('')));
    const banks = [...solver.parse(EXAMPLE), new BatteryBank('198765432111111'), new BatteryBank('9'.repeat(14)), ...lcgBanks];
    expect(solver.solve(banks)).toBe(banks.reduce((acc, b) => acc + greedyWindowSelect(b, 12), 0n));
  });
});
