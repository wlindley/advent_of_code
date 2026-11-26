import { describe, expect, it } from 'vitest';
import { floorDiv } from '../../../shared/core';
import {
  AlignmentSearchFrame,
  CrabAlignmentSolver,
  DEFAULT_MAX_TRACE_STEPS,
  findOptimalAlignment,
  traceAlignmentSearch,
} from './alignment';
import { CrabFleet } from './fleet';
import { type FuelCostModel, LINEAR_FUEL_MODEL, TRIANGULAR_FUEL_MODEL } from './fuelModel';

function bruteForceOptimal(fleet: CrabFleet, model: FuelCostModel): bigint {
  let bestTarget = fleet.minPosition;
  let bestFuel = fleet.fuelAt(bestTarget, model);
  for (let x = fleet.minPosition + 1n; x <= fleet.maxPosition; x += 1n) {
    const fuel = fleet.fuelAt(x, model);
    if (fuel < bestFuel) {
      bestFuel = fuel;
      bestTarget = x;
    }
  }
  return bestTarget;
}

function analyticLinearTarget(fleet: CrabFleet): bigint {
  const sorted = [...fleet.positions].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return sorted[Math.floor((sorted.length - 1) / 2)]!;
}

function analyticTriangularTarget(fleet: CrabFleet): bigint {
  let sum = 0n;
  for (const pos of fleet.positions) sum += pos;
  const q = floorDiv(sum, BigInt(fleet.size));
  return fleet.fuelAt(q, TRIANGULAR_FUEL_MODEL) <= fleet.fuelAt(q + 1n, TRIANGULAR_FUEL_MODEL) ? q : q + 1n;
}

function nextPrng(state: number): number {
  return (Math.imul(state, 1664525) + 1013904223) >>> 0;
}

describe('findOptimalAlignment & CrabAlignmentSolver', () => {
  it('solves the official example for both linear and triangular fuel models', () => {
    const linearSolver = new CrabAlignmentSolver(LINEAR_FUEL_MODEL);
    const triSolver = new CrabAlignmentSolver(TRIANGULAR_FUEL_MODEL);
    expect(Object.isFrozen(linearSolver)).toBe(true);
    expect(linearSolver.model).toBe(LINEAR_FUEL_MODEL);

    const fleet = linearSolver.parse('16,1,2,0,4,2,7,1,2,14');
    expect(findOptimalAlignment(fleet, LINEAR_FUEL_MODEL)).toEqual({ target: 2n, fuel: 37n });
    expect(linearSolver.solve(fleet)).toBe(37n);
    expect(findOptimalAlignment(fleet, TRIANGULAR_FUEL_MODEL)).toEqual({ target: 5n, fuel: 168n });
    expect(triSolver.solve(fleet)).toBe(168n);
  });

  it('handles single crab, identical crabs, even plateaus, negative, skewed, and huge fleets', () => {
    expect(findOptimalAlignment(new CrabFleet([42n]), LINEAR_FUEL_MODEL)).toEqual({ target: 42n, fuel: 0n });
    expect(findOptimalAlignment(new CrabFleet([7n, 7n, 7n]), TRIANGULAR_FUEL_MODEL)).toEqual({ target: 7n, fuel: 0n });
    expect(findOptimalAlignment(new CrabFleet([0n, 1n]), LINEAR_FUEL_MODEL)).toEqual({ target: 0n, fuel: 1n });
    expect(findOptimalAlignment(new CrabFleet([0n, 100n]), LINEAR_FUEL_MODEL)).toEqual({ target: 0n, fuel: 100n });
    expect(findOptimalAlignment(new CrabFleet([-10n, -5n, -2n, -2n]), LINEAR_FUEL_MODEL)).toEqual({
      target: -5n, fuel: 11n,
    });
    expect(findOptimalAlignment(new CrabFleet([0n, 0n, 0n, 1000n]), LINEAR_FUEL_MODEL)).toEqual({
      target: 0n, fuel: 1000n,
    });
    const big = 1n << 105n;
    expect(findOptimalAlignment(new CrabFleet([big, big + 3n, big + 9n]), LINEAR_FUEL_MODEL)).toEqual({
      target: big + 3n, fuel: 9n,
    });
  });

  it('cross-checks 40 seeded PRNG fleets against brute-force and analytic oracles', () => {
    let seed = 0x12345678;
    for (let trial = 0; trial < 40; trial += 1) {
      seed = nextPrng(seed);
      const count = 1 + (seed % 18);
      const positions: bigint[] = [];
      for (let i = 0; i < count; i += 1) {
        seed = nextPrng(seed);
        positions.push(BigInt((seed % 81) - 40));
      }
      const fleet = new CrabFleet(positions);
      const linear = findOptimalAlignment(fleet, LINEAR_FUEL_MODEL);
      expect(linear.target).toBe(bruteForceOptimal(fleet, LINEAR_FUEL_MODEL));
      expect(linear.target).toBe(analyticLinearTarget(fleet));

      const tri = findOptimalAlignment(fleet, TRIANGULAR_FUEL_MODEL);
      expect(tri.target).toBe(bruteForceOptimal(fleet, TRIANGULAR_FUEL_MODEL));
      expect(tri.target).toBe(analyticTriangularTarget(fleet));
    }
  });
});

describe('traceAlignmentSearch', () => {
  it('emits frozen frames ending in converged state and computes dynamic getters', () => {
    const solver = new CrabAlignmentSolver(LINEAR_FUEL_MODEL);
    const fleet = solver.parse('16,1,2,0,4,2,7,1,2,14');
    const frames = solver.trace(fleet);
    expect(frames.length).toBeGreaterThan(1);
    const first = frames[0]!;
    const last = frames[frames.length - 1]!;
    expect(first).toBeInstanceOf(AlignmentSearchFrame);
    expect(Object.isFrozen(first)).toBe(true);
    expect(first.bracketWidth).toBe(17n);
    expect(first.isConverged).toBe(false);
    expect(first.nextPosition).toBe(first.mid + 1n);
    expect(last.direction).toBe('converged');
    expect(last.isConverged).toBe(true);
    expect(last.bracketWidth).toBe(1n);
    expect(last.nextPosition).toBeNull();
    expect(last.mid).toBe(2n);
    expect(last.midFuel).toBe(37n);
  });

  it('caps large search traces via maxSteps and preserves endpoints', () => {
    const fleet = new CrabFleet([0n, 1n << 80n]);
    const defaultTrace = traceAlignmentSearch(fleet, LINEAR_FUEL_MODEL);
    expect(defaultTrace.length).toBe(DEFAULT_MAX_TRACE_STEPS);
    expect(defaultTrace[0]!.step).toBe(0);
    expect(defaultTrace[defaultTrace.length - 1]!.isConverged).toBe(true);

    const oneStep = traceAlignmentSearch(fleet, LINEAR_FUEL_MODEL, { maxSteps: 1 });
    expect(oneStep).toHaveLength(1);
    expect(oneStep[0]!.isConverged).toBe(true);

    const threeSteps = traceAlignmentSearch(fleet, LINEAR_FUEL_MODEL, { maxSteps: 3 });
    expect(threeSteps).toHaveLength(3);
    expect(threeSteps[0]!.step).toBe(0);
    expect(threeSteps[2]!.isConverged).toBe(true);
  });

  it('rejects invalid maxSteps values', () => {
    const fleet = new CrabFleet([1n, 5n]);
    expect(() => traceAlignmentSearch(fleet, LINEAR_FUEL_MODEL, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceAlignmentSearch(fleet, LINEAR_FUEL_MODEL, { maxSteps: -2 })).toThrow(RangeError);
    expect(() => traceAlignmentSearch(fleet, LINEAR_FUEL_MODEL, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});
