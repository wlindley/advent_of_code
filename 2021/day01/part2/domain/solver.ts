import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  countWindowIncreases,
  parseSonarReport,
  traceWindowIncreases,
  type SonarReport,
  type SweepTraceFrame,
} from '../../shared';

export const PART2_WINDOW_SIZE = 3;

function solvePart2(report: SonarReport): number {
  return countWindowIncreases(report, PART2_WINDOW_SIZE);
}

function tracePart2(report: SonarReport, options?: TraceOptions): readonly SweepTraceFrame[] {
  return traceWindowIncreases(report, PART2_WINDOW_SIZE, options);
}

/** Solver for 2021 Day 1 Part 2 (three-measurement sliding-window sum increase count). */
export const solver: PuzzleSolver<SonarReport, number, SweepTraceFrame> = Object.freeze({
  parse: parseSonarReport,
  solve: solvePart2,
  trace: tracePart2,
});
