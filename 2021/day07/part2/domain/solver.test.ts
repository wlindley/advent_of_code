import { describe, expect, it } from 'vitest';
import { executeSolver, floorDiv } from '../../../../shared/core';
import {
  CrabFleet,
  LINEAR_FUEL_MODEL,
  TRIANGULAR_FUEL_MODEL,
  findOptimalAlignment,
  type AlignmentResult,
} from '../../shared';
import { solver } from './index';

function nextPrng(state: number): number {
  return (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
}

function triangularSum(positions: readonly bigint[], target: bigint): bigint {
  let total = 0n;
  for (const pos of positions) {
    const dist = pos >= target ? pos - target : target - pos;
    total += (dist * (dist + 1n)) / 2n;
  }
  return total;
}

function bruteForceOptimal(positions: readonly bigint[]): AlignmentResult {
  let min = positions[0]!;
  let max = positions[0]!;
  for (const pos of positions) {
    if (pos < min) min = pos;
    if (pos > max) max = pos;
  }
  let target = min;
  let fuel = triangularSum(positions, min);
  for (let x = min + 1n; x <= max; x += 1n) {
    const candidate = triangularSum(positions, x);
    if (candidate < fuel) {
      target = x;
      fuel = candidate;
    }
  }
  return { target, fuel };
}

function analyticMeanOptimal(positions: readonly bigint[]): AlignmentResult {
  let sum = 0n;
  for (const pos of positions) sum += pos;
  const q = floorDiv(sum, BigInt(positions.length));
  const qFuel = triangularSum(positions, q);
  const nextFuel = triangularSum(positions, q + 1n);
  return qFuel <= nextFuel ? { target: q, fuel: qFuel } : { target: q + 1n, fuel: nextFuel };
}

describe('2021 Day 7 Part 2 solver', () => {
  it('binds the immutable triangular fuel model and solves the official example', () => {
    expect(solver.model).toBe(TRIANGULAR_FUEL_MODEL);
    expect(Object.isFrozen(solver)).toBe(true);
    const raw = '16,1,2,0,4,2,7,1,2,14';
    const fleet = solver.parse(raw);
    expect(fleet.fuelAt(2n, TRIANGULAR_FUEL_MODEL)).toBe(206n);
    const execution = executeSolver(solver, raw);
    expect(execution.answer).toBe(168n);
    expect(execution.runtime).toBe('main-thread');
    const frames = solver.trace(fleet);
    const last = frames[frames.length - 1]!;
    expect(last.mid).toBe(5n);
    expect(last.midFuel).toBe(168n);
    expect(last.isConverged).toBe(true);
  });

  it('handles single, equal, skewed-mean, negative, and huge >2^63 fleets', () => {
    const cases: ReadonlyArray<[string, bigint, bigint]> = [
      ['42', 42n, 0n],
      ['7,7,7', 7n, 0n],
      ['0,0,0,10', 2n, 45n],
      ['0,10,10,10', 8n, 45n],
      ['-10,-3,-3,-1', -4n, 29n],
      ['-10,-10,-10,0', -8n, 45n],
    ];
    for (const [raw, target, fuel] of cases) {
      const fleet = solver.parse(raw);
      expect(solver.solve(fleet)).toBe(fuel);
      expect(findOptimalAlignment(fleet, TRIANGULAR_FUEL_MODEL)).toEqual({ target, fuel });
    }
    const base = (1n << 64n) + 7n;
    const hugeFleet = new CrabFleet([base, base + (1n << 52n) + 1n]);
    const expectedFuel = ((1n << 51n) + 1n) ** 2n;
    expect(expectedFuel > 1n << 100n).toBe(true);
    expect(solver.solve(hugeFleet)).toBe(expectedFuel);
    const hugeFrames = solver.trace(hugeFleet);
    expect(hugeFrames[hugeFrames.length - 1]!.mid).toBe(base + (1n << 51n));
  });

  it('respects trace options and propagates parse/trace errors', () => {
    const base = (1n << 64n) + 7n;
    const hugeFleet = new CrabFleet([base, base + (1n << 52n) + 1n]);
    expect(solver.trace(hugeFleet, { maxSteps: 1 })).toHaveLength(1);
    const sampled = solver.trace(hugeFleet, { maxSteps: 8 });
    expect(sampled).toHaveLength(8);
    expect(sampled[0]!.step).toBe(0);
    expect(sampled[sampled.length - 1]!.isConverged).toBe(true);
    const fleet = solver.parse('16,1,2,0,4,2,7,1,2,14');
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('1,bad')).toThrow(SyntaxError);
    expect(() => solver.parse('1,2\n3')).toThrow(SyntaxError);
    expect(() => solver.trace(fleet, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('matches brute-force and analytic oracles across 40 seeded fleets', () => {
    let seed = 20_210_702;
    for (let trial = 0; trial < 40; trial += 1) {
      seed = nextPrng(seed);
      const count = 1 + (seed % 15);
      const positions: bigint[] = [];
      for (let i = 0; i < count; i += 1) {
        seed = nextPrng(seed);
        positions.push(BigInt((seed % 81) - 40));
      }
      const fleet = new CrabFleet(positions);
      const brute = bruteForceOptimal(positions);
      const analytic = analyticMeanOptimal(positions);
      expect(analytic).toEqual(brute);
      const frames = solver.trace(fleet);
      const last = frames[frames.length - 1]!;
      expect(last.mid).toBe(brute.target);
      expect(last.midFuel).toBe(brute.fuel);
      const p2Fuel = solver.solve(fleet);
      expect(p2Fuel).toBe(brute.fuel);
      expect(p2Fuel >= findOptimalAlignment(fleet, LINEAR_FUEL_MODEL).fuel).toBe(true);
    }
  });
});
