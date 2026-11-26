import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  OasisReport,
  OasisTraceFrame,
  parseOasisReport,
  traceOasisReport,
} from '../../shared';
import { BACKWARD_EXTRAPOLATION_STRATEGY } from './strategy';

/** Sums backward-extrapolated previous values across every OASIS history. */
export function solveMirageMaintenancePart2(report: OasisReport): bigint {
  return report.extrapolateSum(BACKWARD_EXTRAPOLATION_STRATEGY);
}

/** Builds a bounded trace of Part 2 backward extrapolations across the report. */
export function traceMirageMaintenancePart2(
  report: OasisReport,
  options?: TraceOptions,
): readonly OasisTraceFrame[] {
  return traceOasisReport(report, BACKWARD_EXTRAPOLATION_STRATEGY, options);
}

/** Pure domain solver registered for 2023 Day 9 Part 2. */
export const solver: PuzzleSolver<OasisReport, bigint, OasisTraceFrame> = Object.freeze({
  parse: parseOasisReport,
  solve: solveMirageMaintenancePart2,
  trace: traceMirageMaintenancePart2,
});
