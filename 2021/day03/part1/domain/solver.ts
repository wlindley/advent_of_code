import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  analyzePowerConsumption,
  parseDiagnosticReport,
  tracePowerConsumption,
  type DiagnosticReport,
  type PowerTraceFrame,
} from '../../shared';

function solvePart1(report: DiagnosticReport): bigint {
  return analyzePowerConsumption(report).powerConsumption;
}

function tracePart1(report: DiagnosticReport, options?: TraceOptions): readonly PowerTraceFrame[] {
  return tracePowerConsumption(report, options);
}

/** Solver for 2021 Day 3 Part 1 (gamma/epsilon binary diagnostic power consumption). */
export const solver: PuzzleSolver<DiagnosticReport, bigint, PowerTraceFrame> = Object.freeze({
  parse: parseDiagnosticReport,
  solve: solvePart1,
  trace: tracePart1,
});
