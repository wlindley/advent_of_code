import type { PuzzleSolver } from '../../../../shared/core';
import {
  PART1_OPERATORS,
  parseCalibrationInput,
  totalCalibrationResult,
  traceCalibration,
  type CalibrationEquation,
  type CalibrationTraceFrame,
  type CalibrationTraceOptions,
} from '../../shared';

/** Sums targets of calibration equations solvable with `+` and `*`. */
export function solvePart1(equations: readonly CalibrationEquation[]): bigint {
  return totalCalibrationResult(equations, PART1_OPERATORS);
}

/** Records a uniformly sampled Part 1 reverse-DFS calibration trace. */
export function tracePart1(
  equations: readonly CalibrationEquation[],
  options?: CalibrationTraceOptions,
): readonly CalibrationTraceFrame[] {
  return traceCalibration(equations, PART1_OPERATORS, options);
}

export const solver: PuzzleSolver<
  readonly CalibrationEquation[],
  bigint,
  CalibrationTraceFrame
> = Object.freeze({
  parse: parseCalibrationInput,
  solve: solvePart1,
  trace: tracePart1,
});
