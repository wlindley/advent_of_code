import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { parseDiagnosticReport, type DiagnosticReport } from '../../shared';
import { traceLifeSupport, type LifeSupportTraceFrame } from './lifeSupportTrace';
import { analyzeLifeSupport } from './ratingFilter';

function solvePart2(report: DiagnosticReport): bigint {
  return analyzeLifeSupport(report).lifeSupportRating;
}

function tracePart2(
  report: DiagnosticReport,
  options?: TraceOptions,
): readonly LifeSupportTraceFrame[] {
  return traceLifeSupport(report, options);
}

/** Solver for 2021 Day 3 Part 2 (oxygen generator and CO2 scrubber life-support rating). */
export const solver: PuzzleSolver<DiagnosticReport, bigint, LifeSupportTraceFrame> = Object.freeze({
  parse: parseDiagnosticReport,
  solve: solvePart2,
  trace: tracePart2,
});
