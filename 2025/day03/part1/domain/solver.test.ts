import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { BatteryBank } from '../../shared';
import { PART1_SELECTION_COUNT, solver } from './index';

const EXAMPLE_INPUT = [
  '987654321111111',
  '811111111111119',
  '234234234234278',
  '818181911112111',
].join('\n');

function brutePairSum(banks: readonly BatteryBank[]): bigint {
  let sum = 0n;
  for (const bank of banks) {
    let best = 0;
    for (let i = 0; i < bank.length; i += 1) {
      for (let j = i + 1; j < bank.length; j += 1) {
        const val = Number(bank.raw[i]! + bank.raw[j]!);
        if (val > best) best = val;
      }
    }
    sum += BigInt(best);
  }
  return sum;
}

describe('2025 Day 3 Part 1 solver', () => {
  it('solves official example via solver and executeSolver with exact bank selections', () => {
    expect(PART1_SELECTION_COUNT).toBe(2);
    const banks = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(banks)).toBe(357n);
    expect(executeSolver(solver, EXAMPLE_INPUT).answer).toBe(357n);

    const frames = solver.trace!(banks);
    expect(frames).toHaveLength(5);
    expect(frames.slice(1).map((f) => f.selection!.joltage)).toEqual([98n, 89n, 78n, 92n]);
    expect(frames.slice(1).map((f) => f.selection!.indices)).toEqual([[0, 1], [0, 14], [13, 14], [6, 11]]);
  });

  it('handles empty input, 2-digit banks, and rejects 1-digit banks', () => {
    expect(solver.solve([])).toBe(0n);
    expect(solver.solve(solver.parse('19\n91'))).toBe(110n);

    const oneDigit = solver.parse('9');
    expect(() => solver.solve(oneDigit)).toThrow(RangeError);
    expect(() => solver.trace!(oneDigit)).toThrow(RangeError);
  });

  it('traces empty, default, exact/non-multiple sampled, single-step, and invalid maxSteps', () => {
    expect(solver.trace!([])).toEqual([
      { step: 0, bankIndex: null, selection: null, cumulativeJoltage: 0n },
    ]);

    const tenBanks = Array.from({ length: 10 }, () => new BatteryBank('19'));
    const exact = solver.trace!(tenBanks, { maxSteps: 6 });
    expect(exact.map((f) => f.step)).toEqual([0, 2, 4, 6, 8, 10]);
    expect(exact.at(-1)!.cumulativeJoltage).toBe(190n);

    const elevenBanks = Array.from({ length: 11 }, () => new BatteryBank('19'));
    const nonMultiple = solver.trace!(elevenBanks, { maxSteps: 6 });
    expect(nonMultiple.map((f) => f.step)).toEqual([0, 3, 6, 9, 11]);
    expect(nonMultiple.at(-1)!.cumulativeJoltage).toBe(209n);

    const single = solver.trace!(tenBanks, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]).toMatchObject({ step: 10, bankIndex: 9, cumulativeJoltage: 190n });

    for (const bad of [0, -1, 1.5, Number.NaN]) {
      expect(() => solver.trace!(tenBanks, { maxSteps: bad })).toThrow(RangeError);
    }
  });

  it('matches O(L^2) nested-pair oracle including a 100-digit bank', () => {
    const hundredDigits = '123456789'.repeat(11) + '8';
    const banks = solver.parse(`${EXAMPLE_INPUT}\n19\n91\n5555\n${hundredDigits}`);
    expect(hundredDigits).toHaveLength(100);
    expect(solver.solve(banks)).toBe(brutePairSum(banks));
  });
});
