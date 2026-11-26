import { describe, expect, it } from 'vitest';
import { ClosedInterval, executeSolver, IntervalUnion, type Clock } from '../../../../shared/core';
import { SensorReading } from '../../shared';
import {
  buildExclusionTrace,
  createPart1Solver,
  ExclusionTraceFrame,
  PART1_TARGET_Y,
  solver,
} from './index';

const EXAMPLE_INPUT = [
  'Sensor at x=2, y=18: closest beacon is at x=-2, y=15',
  'Sensor at x=9, y=16: closest beacon is at x=10, y=16',
  'Sensor at x=13, y=2: closest beacon is at x=15, y=3',
  'Sensor at x=12, y=14: closest beacon is at x=10, y=16',
  'Sensor at x=10, y=20: closest beacon is at x=10, y=16',
  'Sensor at x=14, y=17: closest beacon is at x=10, y=16',
  'Sensor at x=8, y=7: closest beacon is at x=2, y=10',
  'Sensor at x=2, y=0: closest beacon is at x=2, y=10',
  'Sensor at x=0, y=11: closest beacon is at x=2, y=10',
  'Sensor at x=20, y=14: closest beacon is at x=25, y=17',
  'Sensor at x=17, y=20: closest beacon is at x=21, y=22',
  'Sensor at x=16, y=7: closest beacon is at x=15, y=3',
  'Sensor at x=14, y=3: closest beacon is at x=15, y=3',
  'Sensor at x=20, y=1: closest beacon is at x=15, y=3',
].join('\n');

describe('createPart1Solver & solver', () => {
  it('solves the official 14-sensor example at y = 10 to 26n', () => {
    const exampleSolver = createPart1Solver(10);
    const parsed = exampleSolver.parse(EXAMPLE_INPUT);
    expect(exampleSolver.solve(parsed)).toBe(26n);
  });

  it('uses PART1_TARGET_Y = 2_000_000 for the default solver and executes with Clock', () => {
    expect(PART1_TARGET_Y).toBe(2_000_000);
    const input = 'Sensor at x=0, y=2000000: closest beacon is at x=3, y=2000000';
    let ticks = 0;
    const fakeClock: Clock = { nowMs: () => (ticks += 5) };
    const result = executeSolver(solver, input, fakeClock);
    expect(result.answer).toBe(6n);
    expect(result.elapsedMs).toBe(5);
  });

  it('rejects invalid targetY eagerly in createPart1Solver', () => {
    expect(() => createPart1Solver(1.5)).toThrow(RangeError);
    expect(() => createPart1Solver(1e16)).toThrow(RangeError);
  });
});

describe('ExclusionTraceFrame', () => {
  it('computes dynamic getters and freezes instance', () => {
    const slice = new ClosedInterval(1n, 5n);
    const union = new IntervalUnion([slice]);
    const initial = new ExclusionTraceFrame(0, 2, null, new IntervalUnion([]), []);
    expect(initial.activeSensorIndex).toBeNull();
    expect(initial.coveredCount).toBe(0n);
    expect(initial.beaconCount).toBe(0);
    expect(initial.excludedCount).toBe(0n);
    expect(initial.isComplete).toBe(false);

    const finalFrame = new ExclusionTraceFrame(2, 2, slice, union, [5, 2]);
    expect(Object.isFrozen(finalFrame)).toBe(true);
    expect(Object.isFrozen(finalFrame.beaconsOnRow)).toBe(true);
    expect(finalFrame.beaconsOnRow).toEqual([2, 5]);
    expect(finalFrame.activeSensorIndex).toBe(1);
    expect(finalFrame.coveredCount).toBe(5n);
    expect(finalFrame.beaconCount).toBe(2);
    expect(finalFrame.excludedCount).toBe(3n);
    expect(finalFrame.isComplete).toBe(true);
  });

  it('enforces all constructor invariants with RangeError', () => {
    const emptyUnion = new IntervalUnion([]);
    const slice = new ClosedInterval(0n, 0n);
    expect(() => new ExclusionTraceFrame(0, -1, null, emptyUnion, [])).toThrow(RangeError);
    expect(() => new ExclusionTraceFrame(0, 1.5, null, emptyUnion, [])).toThrow(RangeError);
    expect(() => new ExclusionTraceFrame(-1, 1, null, emptyUnion, [])).toThrow(RangeError);
    expect(() => new ExclusionTraceFrame(2, 1, null, emptyUnion, [])).toThrow(RangeError);
    expect(() => new ExclusionTraceFrame(0.5, 2, null, emptyUnion, [])).toThrow(RangeError);
    expect(() => new ExclusionTraceFrame(0, 1, slice, emptyUnion, [])).toThrow(RangeError);
    expect(() => new ExclusionTraceFrame(1, 1, slice, emptyUnion, [0])).toThrow(RangeError);
  });
});

describe('buildExclusionTrace', () => {
  it('handles empty readings and validates options/targetY upfront', () => {
    const frames = buildExclusionTrace([], 10);
    expect(frames).toHaveLength(1);
    expect(frames[0]!.processedCount).toBe(0);
    expect(frames[0]!.excludedCount).toBe(0n);
    expect(frames[0]!.isComplete).toBe(true);

    expect(() => buildExclusionTrace([], 10, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => buildExclusionTrace([], 1.2)).toThrow(RangeError);
  });

  it('traces multiple distinct beacons on row and supports downsampling', () => {
    const readings = [
      new SensorReading(0, 10, 4, 10),   // slice [-4, 4], beacon 4
      new SensorReading(20, 0, 20, 2),   // misses y=10
      new SensorReading(10, 10, 8, 10),  // slice [8, 12], beacon 8
      new SensorReading(12, 10, 8, 10),  // slice [8, 16], duplicate beacon 8
    ];
    const full = solver.trace!(solver.parse('Sensor at x=0, y=2000000: closest beacon is at x=1, y=2000000'));
    expect(full).toHaveLength(2);
    expect(full[1]!.excludedCount).toBe(2n);

    const fullMulti = buildExclusionTrace(readings, 10);
    expect(fullMulti).toHaveLength(5);
    expect(fullMulti[4]!.beaconsOnRow).toEqual([4, 8]);
    expect(fullMulti[4]!.excludedCount).toBe(16n); // [-4,4] (9) + [8,16] (9) - 2 beacons

    const sampled3 = buildExclusionTrace(readings, 10, { maxSteps: 3 });
    expect(sampled3.map((f) => f.processedCount)).toEqual([0, 2, 4]);
    expect(sampled3[1]!.activeSlice).toBeNull();
    expect(sampled3[2]!.excludedCount).toBe(16n);

    const sampled1 = buildExclusionTrace(readings, 10, { maxSteps: 1 });
    expect(sampled1).toHaveLength(1);
    expect(sampled1[0]!.processedCount).toBe(4);
    expect(sampled1[0]!.isComplete).toBe(true);
  });
});
