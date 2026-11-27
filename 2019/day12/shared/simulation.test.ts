import { describe, expect, it } from 'vitest';
import { MoonState, MoonSystem, Vec3 } from './models';
import {
  analyzeSystemCycles,
  AxisPeriodResult,
  CycleAnalysis,
  DEFAULT_MAX_AXIS_STEPS,
  findAxisPeriod,
  simulateSteps,
  stepAxisInPlace,
} from './simulation';

const EXAMPLE_1 = [
  '<x=-1, y=0, z=2>',
  '<x=2, y=-10, z=-7>',
  '<x=4, y=-8, z=8>',
  '<x=3, y=5, z=-1>',
].join('\n');

const EXAMPLE_2 = [
  '<x=-8, y=-10, z=0>',
  '<x=5, y=5, z=10>',
  '<x=2, y=-7, z=3>',
  '<x=9, y=-8, z=-3>',
].join('\n');

describe('2019 Day 12 shared simulation', () => {
  it('exposes DEFAULT_MAX_AXIS_STEPS and frozen AxisPeriodResult / CycleAnalysis models', () => {
    expect(DEFAULT_MAX_AXIS_STEPS).toBe(2_000_000);
    const rx = new AxisPeriodResult('x', 18n);
    const ry = new AxisPeriodResult('y', 28n);
    const rz = new AxisPeriodResult('z', 44n);
    expect(Object.isFrozen(rx)).toBe(true);
    expect(() => new AxisPeriodResult('x', 0n)).toThrow(RangeError);
    expect(() => new AxisPeriodResult('y', -3n)).toThrow(RangeError);

    const analysis = new CycleAnalysis(rx, ry, rz);
    expect(Object.isFrozen(analysis)).toBe(true);
    expect(analysis.globalPeriod).toBe(2772n);
    expect(analysis.maxAxisPeriod).toBe(44n);
    expect(analysis.sortedByPeriod().map((r) => r.axis)).toEqual(['x', 'y', 'z']);

    // Tie-break on equal periods follows canonical axis order x < y < z
    const tied = new CycleAnalysis(
      new AxisPeriodResult('x', 10n),
      new AxisPeriodResult('y', 4n),
      new AxisPeriodResult('z', 4n),
    );
    expect(tied.maxAxisPeriod).toBe(10n);
    expect(tied.sortedByPeriod().map((r) => r.axis)).toEqual(['y', 'z', 'x']);

    // Also test when x is the largest period
    const xLargest = new CycleAnalysis(
      new AxisPeriodResult('x', 20n),
      new AxisPeriodResult('y', 10n),
      new AxisPeriodResult('z', 10n),
    );
    expect(xLargest.maxAxisPeriod).toBe(20n);
    expect(xLargest.sortedByPeriod().map((r) => r.axis)).toEqual(['y', 'z', 'x']);
  });

  it('steps a 1D axis in place using strict < / > comparisons without overflow', () => {
    const pos = new Int32Array([-1_500_000_000, 1_500_000_000, 1_500_000_000]);
    const vel = new Int32Array([0, 0, 0]);
    stepAxisInPlace(pos, vel);
    expect(Array.from(vel)).toEqual([2, -1, -1]);
    expect(Array.from(pos)).toEqual([-1_499_999_998, 1_499_999_999, 1_499_999_999]);
  });

  it('simulates Example 1 for 0 and 10 steps and Example 2 for 100 steps', () => {
    const s1 = MoonSystem.parse(EXAMPLE_1);
    const same = simulateSteps(s1, 0);
    expect(same.moons[0]!.equals(s1.moons[0]!)).toBe(true);
    expect(simulateSteps(s1, 10).totalEnergy).toBe(179);

    const s2 = MoonSystem.parse(EXAMPLE_2);
    expect(simulateSteps(s2, 100).totalEnergy).toBe(1940);
  });

  it('rejects negative or non-integer step counts in simulateSteps', () => {
    const s1 = MoonSystem.parse(EXAMPLE_1);
    expect(() => simulateSteps(s1, -1)).toThrow(RangeError);
    expect(() => simulateSteps(s1, 1.5)).toThrow(RangeError);
  });

  it('finds exact axis periods including period-1 and arbitrary non-zero initial velocities', () => {
    expect(findAxisPeriod(new Int32Array([5, 5]), new Int32Array([0, 0]), 100)).toBe(1n);
    // Single moon with non-zero velocity diverges forever and hits maxAxisSteps
    expect(() => findAxisPeriod(new Int32Array([0]), new Int32Array([1]), 5)).toThrow(RangeError);

    // Non-zero initial velocities on a 2-body oscillating system
    const period = findAxisPeriod(new Int32Array([-1, 1]), new Int32Array([1, -1]), 100);
    expect(period).toBeGreaterThan(1n);
    // Verify via stepAxisInPlace
    const p = new Int32Array([-1, 1]);
    const v = new Int32Array([1, -1]);
    for (let i = 0; i < Number(period); i += 1) stepAxisInPlace(p, v);
    expect(Array.from(p)).toEqual([-1, 1]);
    expect(Array.from(v)).toEqual([1, -1]);
  });

  it('validates findAxisPeriod inputs', () => {
    expect(() => findAxisPeriod(new Int32Array([]), new Int32Array([]), 10)).toThrow(RangeError);
    expect(() => findAxisPeriod(new Int32Array([1, 2]), new Int32Array([0]), 10)).toThrow(RangeError);
    expect(() => findAxisPeriod(new Int32Array([1]), new Int32Array([0]), 0)).toThrow(RangeError);
    expect(() => findAxisPeriod(new Int32Array([1]), new Int32Array([0]), 1.5)).toThrow(RangeError);
  });

  it('analyzes full system cycles for Example 1 and Example 2', () => {
    const a1 = analyzeSystemCycles(MoonSystem.parse(EXAMPLE_1), DEFAULT_MAX_AXIS_STEPS);
    expect(a1.x.period).toBe(18n);
    expect(a1.y.period).toBe(28n);
    expect(a1.z.period).toBe(44n);
    expect(a1.globalPeriod).toBe(2772n);

    const a2 = analyzeSystemCycles(MoonSystem.parse(EXAMPLE_2), DEFAULT_MAX_AXIS_STEPS);
    expect(a2.globalPeriod).toBe(4686774924n);

    // Non-zero initial velocities via MoonState constructor
    const custom = new MoonSystem([
      new MoonState(new Vec3(0, 0, 0), new Vec3(0, 0, 0)),
      new MoonState(new Vec3(0, 0, 0), new Vec3(0, 0, 0)),
    ]);
    expect(analyzeSystemCycles(custom, 10).globalPeriod).toBe(1n);
  });
});
