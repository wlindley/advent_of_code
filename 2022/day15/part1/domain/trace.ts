import {
  ClosedInterval,
  IntervalUnion,
  sampleTraceIndices,
  validateMaxSteps,
  type TraceOptions,
} from '../../../../shared/core';
import { assertSafeInteger, type SensorReading } from '../../shared';

/** Default frame cap so large sensor lists never stall browser playback. */
export const DEFAULT_MAX_TRACE_STEPS = 120;

/** Immutable snapshot of row-exclusion progress after processing a prefix of sensors. */
export class ExclusionTraceFrame {
  readonly processedCount: number;
  readonly totalSensors: number;
  readonly activeSlice: ClosedInterval | null;
  readonly mergedCoverage: IntervalUnion;
  readonly beaconsOnRow: readonly number[];

  constructor(
    processedCount: number,
    totalSensors: number,
    activeSlice: ClosedInterval | null,
    mergedCoverage: IntervalUnion,
    beaconsOnRow: readonly number[],
  ) {
    if (!Number.isSafeInteger(totalSensors) || totalSensors < 0) {
      throw new RangeError(`totalSensors must be a non-negative safe integer, got ${totalSensors}`);
    }
    if (!Number.isSafeInteger(processedCount) || processedCount < 0 || processedCount > totalSensors) {
      throw new RangeError(`processedCount (${processedCount}) must be in 0..${totalSensors}`);
    }
    if (processedCount === 0 && activeSlice !== null) {
      throw new RangeError('activeSlice must be null when processedCount is 0');
    }
    const sortedBeacons = Object.freeze([...new Set(beaconsOnRow)].sort((a, b) => a - b));
    if (mergedCoverage.totalLength < BigInt(sortedBeacons.length)) {
      throw new RangeError('mergedCoverage cannot be shorter than distinct beacons on row');
    }
    this.processedCount = processedCount;
    this.totalSensors = totalSensors;
    this.activeSlice = activeSlice;
    this.mergedCoverage = mergedCoverage;
    this.beaconsOnRow = sortedBeacons;
    Object.freeze(this);
  }

  get activeSensorIndex(): number | null {
    return this.processedCount === 0 ? null : this.processedCount - 1;
  }

  get coveredCount(): bigint {
    return this.mergedCoverage.totalLength;
  }

  get beaconCount(): number {
    return this.beaconsOnRow.length;
  }

  get excludedCount(): bigint {
    return this.mergedCoverage.totalLength - BigInt(this.beaconsOnRow.length);
  }

  get isComplete(): boolean {
    return this.processedCount === this.totalSensors;
  }
}

function accumulateReading(
  reading: SensorReading,
  targetY: number,
  slices: ClosedInterval[],
  beacons: Set<number>,
): ClosedInterval | null {
  const slice = reading.rowSlice(targetY);
  if (slice !== null) slices.push(slice);
  if (reading.beaconY === targetY) beacons.add(reading.beaconX);
  return slice;
}

/** Builds a bounded sequence of prefix exclusion frames along `y = targetY`. */
export function buildExclusionTrace(
  readings: readonly SensorReading[],
  targetY: number,
  options?: TraceOptions,
): readonly ExclusionTraceFrame[] {
  assertSafeInteger(targetY, 'targetY');
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampled = sampleTraceIndices(readings.length + 1, maxSteps);
  const slices: ClosedInterval[] = [];
  const beacons = new Set<number>();
  const frames: ExclusionTraceFrame[] = [];
  let processed = 0;
  let activeSlice: ClosedInterval | null = null;
  for (const targetCount of sampled) {
    while (processed < targetCount) {
      activeSlice = accumulateReading(readings[processed]!, targetY, slices, beacons);
      processed += 1;
    }
    frames.push(new ExclusionTraceFrame(
      processed, readings.length, activeSlice, new IntervalUnion(slices), Array.from(beacons),
    ));
  }
  return Object.freeze(frames);
}
