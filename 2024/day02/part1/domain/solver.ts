import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../../shared/core';
import { parseReports, Report } from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 200;

export interface ReportScanTraceFrame {
  readonly scannedCount: number;
  readonly totalReports: number;
  readonly activeReport: Report | null;
  readonly safeCount: number;
}

function createTraceFrame(
  scannedCount: number,
  totalReports: number,
  activeReport: Report | null,
  safeCount: number,
): ReportScanTraceFrame {
  return Object.freeze({ scannedCount, totalReports, activeReport, safeCount });
}

/** Counts how many parsed reactor reports satisfy all safety invariants. */
export function countSafeReports(reports: readonly Report[]): number {
  let safeCount = 0;
  for (let i = 0; i < reports.length; i += 1) {
    if (reports[i]!.isSafe) safeCount += 1;
  }
  return safeCount;
}

/** Traces report safety scanning sampled uniformly up to `maxSteps` frames. */
export function traceSafeReports(
  reports: readonly Report[],
  options?: TraceOptions,
): readonly ReportScanTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampledCounts = sampleTraceIndices(reports.length + 1, limit);
  const frames: ReportScanTraceFrame[] = [];
  let sampleCursor = 0;
  let safeCount = 0;

  for (let scannedCount = 0; scannedCount <= reports.length; scannedCount += 1) {
    const activeReport = scannedCount > 0 ? reports[scannedCount - 1]! : null;
    if (activeReport !== null && activeReport.isSafe) safeCount += 1;
    if (sampledCounts[sampleCursor] === scannedCount) {
      frames.push(createTraceFrame(scannedCount, reports.length, activeReport, safeCount));
      sampleCursor += 1;
    }
  }
  return Object.freeze(frames);
}

export const solver: PuzzleSolver<readonly Report[], number, ReportScanTraceFrame> = Object.freeze({
  parse: parseReports,
  solve: countSafeReports,
  trace: traceSafeReports,
});
