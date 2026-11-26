import { ClosedInterval, IntervalUnion } from '../../../shared/core';
import { assertSafeInteger, type SensorReading } from './sensorReading';

/** Computes the normalized union of horizontal sensor-covered intervals along `y = targetY`. */
export function mergedRowCoverage(
  readings: readonly SensorReading[],
  targetY: number,
): IntervalUnion {
  assertSafeInteger(targetY, 'targetY');
  const slices: ClosedInterval[] = [];
  for (const reading of readings) {
    const slice = reading.rowSlice(targetY);
    if (slice !== null) {
      slices.push(slice);
    }
  }
  return new IntervalUnion(slices);
}

/** Collects the unique X coordinates of known beacons located on `y = targetY`. */
export function distinctBeaconXsOnRow(
  readings: readonly SensorReading[],
  targetY: number,
): ReadonlySet<number> {
  assertSafeInteger(targetY, 'targetY');
  const beaconXs = new Set<number>();
  for (const reading of readings) {
    if (reading.beaconY === targetY) {
      beaconXs.add(reading.beaconX);
    }
  }
  return beaconXs;
}

/** Counts positions along `y = targetY` where a beacon cannot exist. */
export function countExcludedOnRow(
  readings: readonly SensorReading[],
  targetY: number,
): bigint {
  const union = mergedRowCoverage(readings, targetY);
  const beacons = distinctBeaconXsOnRow(readings, targetY);
  return union.totalLength - BigInt(beacons.size);
}
