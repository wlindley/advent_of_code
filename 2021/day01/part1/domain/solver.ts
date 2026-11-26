import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  countWindowIncreases,
  parseSonarReport,
  traceWindowIncreases,
  type SonarReport,
  type SweepTraceFrame,
} from '../../shared';

export const PART1_WINDOW_SIZE = 1;

function solvePart1(report: SonarReport): number {
  return countWindowIncreases(report, PART1_WINDOW_SIZE);
}

function tracePart1(report: SonarReport, options?: TraceOptions): readonly SweepTraceFrame[] {
  return traceWindowIncreases(report, PART1_WINDOW_SIZE, options);
}

/** Solver for 2021 Day 1 Part 1 (single-step depth increase count). */
export const solver: PuzzleSolver<SonarReport, number, SweepTraceFrame> = Object.freeze({
  parse: parseSonarReport,
  solve: solvePart1,
  trace: tracePart1,
});
