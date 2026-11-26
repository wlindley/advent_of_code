import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { parseSensorReadings, type SensorReading } from '../../shared';
import { assertValidMaxCoord, findDistressBeacon, tuningFrequency } from './candidates';
import { buildDistressTrace, type DistressTraceFrame } from './trace';

/** Official Advent of Code 2022 Day 15 Part 2 search box upper bound. */
export const PART2_MAX_COORD = 4_000_000;

/** Creates a frozen Part 2 solver bounded to `[0, maxCoord]^2`. */
export function createPart2Solver(
  maxCoord: number,
): PuzzleSolver<readonly SensorReading[], bigint, DistressTraceFrame> {
  assertValidMaxCoord(maxCoord);
  return Object.freeze({
    parse: parseSensorReadings,
    solve: (readings: readonly SensorReading[]) =>
      tuningFrequency(findDistressBeacon(readings, maxCoord)),
    trace: (readings: readonly SensorReading[], options?: TraceOptions) =>
      buildDistressTrace(readings, maxCoord, options),
  });
}

/** Default Part 2 solver bounded to `[0, 4_000_000]^2`. */
export const solver = createPart2Solver(PART2_MAX_COORD);
