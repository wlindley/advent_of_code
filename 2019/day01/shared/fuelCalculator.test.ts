import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_TRACE_STEPS,
  FuelTraceFrame,
  computeTotalFuel,
  createFuelSolver,
  traceFuelCalculation,
} from './fuelCalculator';
import { RECURSIVE_FUEL_POLICY, SINGLE_STAGE_FUEL_POLICY } from './fuelPolicy';
import { ModuleManifest } from './moduleManifest';

describe('FuelTraceFrame', () => {
  it('computes dynamic fuel getters and freezes frame and stages', () => {
    const frame = new FuelTraceFrame(1, 1969, [654, 216, 70, 21, 5], 10);
    expect(Object.isFrozen(frame)).toBe(true);
    expect(Object.isFrozen(frame.stages)).toBe(true);
    expect(frame.baseFuel).toBe(654);
    expect(frame.moduleFuel).toBe(966);
    expect(frame.extraFuel).toBe(312);
    expect(frame.cumulativeFuel).toBe(976);

    const zeroFrame = new FuelTraceFrame(0, 8, [], 4);
    expect(zeroFrame.baseFuel).toBe(0);
    expect(zeroFrame.moduleFuel).toBe(0);
    expect(zeroFrame.extraFuel).toBe(0);
    expect(zeroFrame.cumulativeFuel).toBe(4);
  });

  it('rejects invalid indices, masses, prior cumulative fuel, and non-positive stages', () => {
    expect(() => new FuelTraceFrame(-1, 12, [2], 0)).toThrow(RangeError);
    expect(() => new FuelTraceFrame(1.5, 12, [2], 0)).toThrow(RangeError);
    expect(() => new FuelTraceFrame(0, -1, [], 0)).toThrow(RangeError);
    expect(() => new FuelTraceFrame(0, 12, [2], -1)).toThrow(RangeError);
    expect(() => new FuelTraceFrame(0, 12, [0], 0)).toThrow(RangeError);
    expect(() => new FuelTraceFrame(0, 12, [2.5], 0)).toThrow(RangeError);
  });
});

describe('computeTotalFuel & traceFuelCalculation', () => {
  it('computes total fuel for single-stage and recursive policies', () => {
    const manifest = new ModuleManifest([12, 14, 1969, 100756]);
    expect(computeTotalFuel(manifest, SINGLE_STAGE_FUEL_POLICY)).toBe(34241);
    expect(computeTotalFuel(manifest, RECURSIVE_FUEL_POLICY)).toBe(51316);
  });

  it('traces all modules when count <= maxSteps and preserves cumulative totals', () => {
    const manifest = new ModuleManifest([8, 12, 1969]);
    const frames = traceFuelCalculation(manifest, RECURSIVE_FUEL_POLICY);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames.map((f) => [f.moduleIndex, f.priorCumulativeFuel, f.moduleFuel, f.cumulativeFuel])).toEqual([
      [0, 0, 0, 0],
      [1, 0, 2, 2],
      [2, 2, 966, 968],
    ]);
  });

  it('samples large manifests cleanly while maintaining exact cumulative fuel at endpoints', () => {
    const masses = Array.from({ length: 250 }, (_, i) => 12 + i * 3);
    const manifest = new ModuleManifest(masses);
    const expectedTotal = computeTotalFuel(manifest, SINGLE_STAGE_FUEL_POLICY);
    const sampled = traceFuelCalculation(manifest, SINGLE_STAGE_FUEL_POLICY);
    expect(sampled.length).toBe(DEFAULT_MAX_TRACE_STEPS);
    expect(sampled[0]!.moduleIndex).toBe(0);
    expect(sampled[sampled.length - 1]!.moduleIndex).toBe(249);
    expect(sampled[sampled.length - 1]!.cumulativeFuel).toBe(expectedTotal);

    const single = traceFuelCalculation(manifest, SINGLE_STAGE_FUEL_POLICY, { maxSteps: 1 });
    expect(single.length).toBe(1);
    expect(single[0]!.moduleIndex).toBe(249);
    expect(single[0]!.cumulativeFuel).toBe(expectedTotal);

    expect(() => traceFuelCalculation(manifest, SINGLE_STAGE_FUEL_POLICY, { maxSteps: 0 })).toThrow(RangeError);
  });
});

describe('createFuelSolver', () => {
  it('creates a frozen PuzzleSolver binding parse, solve, and trace to the given policy', () => {
    const solver = createFuelSolver(RECURSIVE_FUEL_POLICY);
    expect(Object.isFrozen(solver)).toBe(true);
    const parsed = solver.parse('14\n1969\n100756');
    expect(solver.solve(parsed)).toBe(51314);
    expect(solver.trace(parsed, { maxSteps: 2 }).map((f) => f.moduleIndex)).toEqual([0, 2]);
  });
});
