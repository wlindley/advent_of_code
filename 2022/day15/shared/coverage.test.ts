import { describe, expect, it } from 'vitest';
import {
  countExcludedOnRow,
  distinctBeaconXsOnRow,
  mergedRowCoverage,
  SensorReading,
} from './index';

describe('row coverage', () => {
  it('validates targetY upfront even on empty readings', () => {
    expect(() => mergedRowCoverage([], 1.5)).toThrow(RangeError);
    expect(() => distinctBeaconXsOnRow([], Number.NaN)).toThrow(RangeError);
    expect(() => countExcludedOnRow([], 1e16)).toThrow(RangeError);

    expect(mergedRowCoverage([], 10).intervals).toEqual([]);
    expect(distinctBeaconXsOnRow([], 10).size).toBe(0);
    expect(countExcludedOnRow([], 10)).toBe(0n);
  });

  it('merges disjoint, touching, and overlapping slices', () => {
    const readings = [
      new SensorReading(0, 0, 2, 0),   // radius 2 -> [-2, 2] on y=0
      new SensorReading(5, 0, 7, 0),   // radius 2 -> [3, 7] touches [-2, 2] -> [-2, 7]
      new SensorReading(12, 0, 13, 0), // radius 1 -> [11, 13] disjoint
      new SensorReading(1, 5, 1, 5),   // radius 0 on y=5 -> misses y=0
    ];
    const union = mergedRowCoverage(readings, 0);
    expect(union.intervals.map((iv) => [iv.start, iv.end])).toEqual([
      [-2n, 7n],
      [11n, 13n],
    ]);
    expect(union.totalLength).toBe(13n);
  });

  it('subtracts distinct beacons on row once while keeping sensors on row excluded', () => {
    const readings = [
      new SensorReading(0, 10, 2, 10),  // beacon at x=2 on y=10, sensor at x=0 on y=10
      new SensorReading(4, 10, 2, 10),  // duplicate beacon at x=2 on y=10
      new SensorReading(10, 10, 9, 10), // distinct beacon at x=9 on y=10
      new SensorReading(20, 0, 20, 2),  // misses y=10, beacon on y=2
    ];
    const beacons = distinctBeaconXsOnRow(readings, 10);
    expect([...beacons].sort((a, b) => a - b)).toEqual([2, 9]);
    // [-2, 6] (len 9) + [9, 11] (len 3) = 12 covered, minus 2 beacons = 10
    expect(countExcludedOnRow(readings, 10)).toBe(10n);
  });

  it('handles zero-radius reading on target row and huge coordinates', () => {
    const zeroOnRow = [new SensorReading(3, 5, 3, 5)];
    expect(mergedRowCoverage(zeroOnRow, 5).totalLength).toBe(1n);
    expect(countExcludedOnRow(zeroOnRow, 5)).toBe(0n);

    const big = 5_000_000_000_000_000;
    const huge = [new SensorReading(big, 0, -big, 0)]; // radius 2*big -> [-big, 3*big], len 4*big+1, 1 beacon
    expect(countExcludedOnRow(huge, 0)).toBe(BigInt(big) * 4n);
  });
});
