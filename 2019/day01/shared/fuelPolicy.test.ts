import { describe, expect, it } from 'vitest';
import {
  RECURSIVE_FUEL_POLICY,
  SINGLE_STAGE_FUEL_POLICY,
  assertValidMass,
  computeStepFuel,
} from './fuelPolicy';

function naiveRecursiveOracle(mass: number): number {
  const fuel = Math.max(0, Math.floor(mass / 3) - 2);
  return fuel === 0 ? 0 : fuel + naiveRecursiveOracle(fuel);
}

function legendreBase3Oracle(mass: number): number {
  if (mass <= 8) return 0;
  const x = BigInt(mass) + 3n;
  const base3 = x.toString(3);
  let digitSum = 0n;
  for (const ch of base3) digitSum += BigInt(ch);
  const topDigit = BigInt(base3[0]!);
  const digits = BigInt(base3.length);
  return Number((x - digitSum) / 2n - topDigit - 3n * (digits - 2n));
}

describe('assertValidMass & computeStepFuel', () => {
  it('accepts zero through eight with zero fuel, and nine yields one', () => {
    for (let mass = 0; mass <= 8; mass += 1) {
      expect(() => assertValidMass(mass)).not.toThrow();
      expect(computeStepFuel(mass)).toBe(0);
    }
    expect(computeStepFuel(9)).toBe(1);
    expect(computeStepFuel(Number.MAX_SAFE_INTEGER)).toBe(3002399751580328);
  });

  it('rejects negative, fractional, non-finite, and unsafe integer masses', () => {
    const invalid = [-1, -0.5, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1];
    for (const bad of invalid) {
      expect(() => assertValidMass(bad)).toThrow(RangeError);
      expect(() => computeStepFuel(bad)).toThrow(RangeError);
    }
  });
});

describe('SINGLE_STAGE_FUEL_POLICY', () => {
  it('computes official Part 1 examples and frozen single stages', () => {
    expect(SINGLE_STAGE_FUEL_POLICY.label).toBe('Single-Stage Fuel');
    expect(Object.isFrozen(SINGLE_STAGE_FUEL_POLICY)).toBe(true);
    expect(SINGLE_STAGE_FUEL_POLICY.computeFuel(12)).toBe(2);
    expect(SINGLE_STAGE_FUEL_POLICY.computeFuel(14)).toBe(2);
    expect(SINGLE_STAGE_FUEL_POLICY.computeFuel(1969)).toBe(654);
    expect(SINGLE_STAGE_FUEL_POLICY.computeFuel(100756)).toBe(33583);
    expect(SINGLE_STAGE_FUEL_POLICY.fuelStages(8)).toEqual([]);
    expect(SINGLE_STAGE_FUEL_POLICY.fuelStages(12)).toEqual([2]);
    expect(Object.isFrozen(SINGLE_STAGE_FUEL_POLICY.fuelStages(12))).toBe(true);
  });
});

describe('RECURSIVE_FUEL_POLICY', () => {
  it('computes official Part 2 examples and frozen positive stage cascades', () => {
    expect(RECURSIVE_FUEL_POLICY.label).toBe('Recursive Fuel');
    expect(Object.isFrozen(RECURSIVE_FUEL_POLICY)).toBe(true);
    expect(RECURSIVE_FUEL_POLICY.computeFuel(14)).toBe(2);
    expect(RECURSIVE_FUEL_POLICY.fuelStages(14)).toEqual([2]);
    expect(RECURSIVE_FUEL_POLICY.computeFuel(1969)).toBe(966);
    expect(RECURSIVE_FUEL_POLICY.fuelStages(1969)).toEqual([654, 216, 70, 21, 5]);
    expect(RECURSIVE_FUEL_POLICY.computeFuel(100756)).toBe(50346);
    expect(RECURSIVE_FUEL_POLICY.fuelStages(100756)).toEqual([33583, 11192, 3728, 1240, 411, 135, 43, 12, 2]);
    expect(RECURSIVE_FUEL_POLICY.fuelStages(8)).toEqual([]);
    expect(Object.isFrozen(RECURSIVE_FUEL_POLICY.fuelStages(1969))).toBe(true);
  });

  it('cross-verifies 0..500, 10-prefix powers-of-3 transitions, and MAX_SAFE_INTEGER against two oracles', () => {
    for (let mass = 0; mass <= 500; mass += 1) {
      const actual = RECURSIVE_FUEL_POLICY.computeFuel(mass);
      expect(actual).toBe(naiveRecursiveOracle(mass));
      expect(actual).toBe(legendreBase3Oracle(mass));
    }
    let pow3 = 9;
    while (pow3 * 3 <= Number.MAX_SAFE_INTEGER) {
      const prevPow = pow3 / 3;
      for (const probe of [pow3 - 4, pow3 - 3, pow3 + prevPow - 4, pow3 + prevPow - 3]) {
        const actual = RECURSIVE_FUEL_POLICY.computeFuel(probe);
        expect(actual).toBe(naiveRecursiveOracle(probe));
        expect(actual).toBe(legendreBase3Oracle(probe));
      }
      pow3 *= 3;
    }
    const maxActual = RECURSIVE_FUEL_POLICY.computeFuel(Number.MAX_SAFE_INTEGER);
    expect(maxActual).toBe(naiveRecursiveOracle(Number.MAX_SAFE_INTEGER));
    expect(maxActual).toBe(legendreBase3Oracle(Number.MAX_SAFE_INTEGER));
  });
});
