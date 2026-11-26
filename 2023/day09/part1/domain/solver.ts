import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  OasisReport,
  OasisTraceFrame,
  parseOasisReport,
  traceOasisReport,
} from '../../shared';
import { FORWARD_EXTRAPOLATION_STRATEGY } from './strategy';

/** Sums forward-extrapolated next values across every OASIS history. */
export function solveMirageMaintenancePart1(report: OasisReport): bigint {
  return report.extrapolateSum(FORWARD_EXTRAPOLATION_STRATEGY);
}

/** Builds a bounded trace of Part 1 forward extrapolations across the report. */
export function traceMirageMaintenancePart1(
  report: OasisReport,
  options?: TraceOptions,
): readonly OasisTraceFrame[] {
  return traceOasisReport(report, FORWARD_EXTRAPOLATION_STRATEGY, options);
}

/** Pure domain solver registered for 2023 Day 9 Part 1. */
export const solver: PuzzleSolver<OasisReport, bigint, OasisTraceFrame> = Object.freeze({
  parse: parseOasisReport,
  solve: solveMirageMaintenancePart1,
  trace: traceMirageMaintenancePart1,
});
