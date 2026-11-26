import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { parseSensorReadings, SensorReading } from '../../shared';
import {
  collectCandidates,
  createPart2Solver,
  findDistressBeacon,
  findUniqueUncoveredIndex,
  PART2_MAX_COORD,
  solver,
  TUNING_X_MULTIPLIER,
  tuningFrequency,
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

describe('tuningFrequency & PART2_MAX_COORD', () => {
  it('computes exact BigInt tuning frequency above Number.MAX_SAFE_INTEGER', () => {
    expect(TUNING_X_MULTIPLIER).toBe(4_000_000n);
    expect(PART2_MAX_COORD).toBe(4_000_000);
    expect(tuningFrequency({ x: 14, y: 11 })).toBe(56_000_011n);
    expect(tuningFrequency({ x: 3_000_000_000, y: 7 })).toBe(12_000_000_000_000_007n);
  });

  it('rejects non-safe-integer coordinates', () => {
    expect(() => tuningFrequency({ x: 1.5, y: 0 })).toThrow(RangeError);
    expect(() => tuningFrequency({ x: 0, y: Number.NaN })).toThrow(RangeError);
  });
});

describe('findDistressBeacon geometric edge cases', () => {
  it('solves the official 14-sensor example for maxCoord = 20', () => {
    const part2Example = createPart2Solver(20);
    const parsed = part2Example.parse(EXAMPLE_INPUT);
    expect(findDistressBeacon(parsed, 20)).toEqual({ x: 14, y: 11 });
    expect(part2Example.solve(parsed)).toBe(56_000_011n);
    expect(Object.isFrozen(findDistressBeacon(parsed, 20))).toBe(true);
  });

  it('finds all four box corners when uniquely uncovered in [0, 4]^2', () => {
    expect(findDistressBeacon([new SensorReading(4, 4, 4, -3)], 4)).toEqual({ x: 0, y: 0 });
    expect(findDistressBeacon([new SensorReading(0, 4, 0, -3)], 4)).toEqual({ x: 4, y: 0 });
    expect(findDistressBeacon([new SensorReading(4, 0, 4, 7)], 4)).toEqual({ x: 0, y: 4 });
    expect(findDistressBeacon([new SensorReading(0, 0, 0, 7)], 4)).toEqual({ x: 4, y: 4 });
  });

  it('finds all four box edges when uniquely uncovered in [0, 4]^2', () => {
    expect(findDistressBeacon([new SensorReading(3, 0, 3, -4), new SensorReading(3, 4, 3, 8)], 4)).toEqual({ x: 0, y: 2 });
    expect(findDistressBeacon([new SensorReading(1, 0, 1, -4), new SensorReading(1, 4, 1, 8)], 4)).toEqual({ x: 4, y: 2 });
    expect(findDistressBeacon([new SensorReading(0, 3, -4, 3), new SensorReading(4, 3, 8, 3)], 4)).toEqual({ x: 2, y: 0 });
    expect(findDistressBeacon([new SensorReading(0, 1, -4, 1), new SensorReading(4, 1, 8, 1)], 4)).toEqual({ x: 2, y: 4 });
  });

  it('handles odd (s + d) positive and negative diagonal pinches and maxCoord = 0', () => {
    const pinch = [
      new SensorReading(0, 0, 0, 3),
      new SensorReading(4, 4, 4, 1),
      new SensorReading(0, 3, 0, 4),
      new SensorReading(3, 0, 4, 0),
    ];
    expect(findDistressBeacon(pinch, 4)).toEqual({ x: 2, y: 2 });
    expect(findDistressBeacon([new SensorReading(1, 0, 1, 0)], 0)).toEqual({ x: 0, y: 0 });
  });
});

describe('validation, errors, and default solver', () => {
  it('returns sorted frozen candidates and rejects invalid maxCoord', () => {
    const pts = collectCandidates([new SensorReading(1, 0, 1, 0)], 1);
    expect(Object.isFrozen(pts)).toBe(true);
    expect(pts.length).toBeGreaterThanOrEqual(4);
    expect(() => createPart2Solver(-1)).toThrow(RangeError);
    expect(() => createPart2Solver(1.5)).toThrow(RangeError);
    expect(() => collectCandidates([], 1e16)).toThrow(RangeError);
  });

  it('throws when 0 or >= 2 uncovered candidates exist', () => {
    const fullCover = [new SensorReading(1, 1, 1, 5)];
    expect(() => findDistressBeacon(fullCover, 2)).toThrow(Error);
    const ambiguous = [new SensorReading(2, 2, 2, 2)];
    expect(() => findUniqueUncoveredIndex(ambiguous, [{ x: 0, y: 0 }, { x: 1, y: 1 }])).toThrow(Error);
  });

  it('executes default PART2_MAX_COORD solver with fake Clock and trace', () => {
    const input = parseSensorReadings('Sensor at x=2000000, y=2000000: closest beacon is at x=2000000, y=5999999');
    expect(input.length).toBe(1);
    let now = 10;
    const clock: Clock = { nowMs: () => (now += 7) };
    const singlePointInput = [
      'Sensor at x=0, y=0: closest beacon is at x=0, y=7999999',
    ].join('\n');
    const result = executeSolver(solver, singlePointInput, clock);
    expect(result.answer).toBe(16_000_004_000_000n);
    expect(result.elapsedMs).toBe(7);
    const frames = solver.trace!(solver.parse(singlePointInput), { maxSteps: 2 });
    expect(frames.length).toBe(2);
  });
});
