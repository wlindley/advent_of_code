import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  assertSafeInteger,
  countExcludedOnRow,
  parseSensorReadings,
  type SensorReading,
} from '../../shared';
import { buildExclusionTrace, type ExclusionTraceFrame } from './trace';

/** Official Advent of Code 2022 Day 15 Part 1 target scanline Y coordinate. */
export const PART1_TARGET_Y = 2_000_000;

/** Creates a frozen Part 1 solver bound to an integer `targetY` scanline. */
export function createPart1Solver(
  targetY: number,
): PuzzleSolver<readonly SensorReading[], bigint, ExclusionTraceFrame> {
  assertSafeInteger(targetY, 'targetY');
  return Object.freeze({
    parse: parseSensorReadings,
    solve: (readings: readonly SensorReading[]) => countExcludedOnRow(readings, targetY),
    trace: (readings: readonly SensorReading[], options?: TraceOptions) =>
      buildExclusionTrace(readings, targetY, options),
  });
}

/** Default Part 1 solver targeting `y = 2_000_000`. */
export const solver = createPart1Solver(PART1_TARGET_Y);
