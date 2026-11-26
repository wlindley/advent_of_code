import type { PuzzleSolver } from '../../../../shared/core';
import {
  parseCalibrationInput,
  totalCalibrationResult,
  traceCalibration,
  type CalibrationEquation,
  type CalibrationTraceFrame,
  type CalibrationTraceOptions,
} from '../../shared';
import { PART2_OPERATORS } from './concatOperator';

/** Sums targets of calibration equations solvable with `*`, `||`, and `+`. */
export function solvePart2(equations: readonly CalibrationEquation[]): bigint {
  return totalCalibrationResult(equations, PART2_OPERATORS);
}

/** Records a uniformly sampled Part 2 reverse-DFS calibration trace. */
export function tracePart2(
  equations: readonly CalibrationEquation[],
  options?: CalibrationTraceOptions,
): readonly CalibrationTraceFrame[] {
  return traceCalibration(equations, PART2_OPERATORS, options);
}

export const solver: PuzzleSolver<
  readonly CalibrationEquation[],
  bigint,
  CalibrationTraceFrame
> = Object.freeze({
  parse: parseCalibrationInput,
  solve: solvePart2,
  trace: tracePart2,
});
