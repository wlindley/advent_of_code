import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../../shared/core';
import { parseReports, type Report } from '../../shared';
import { DampenerEvaluation } from './dampener';

export const DEFAULT_MAX_TRACE_STEPS = 200;

export interface DampenerTraceFrame {
  readonly scannedCount: number;
  readonly totalReports: number;
  readonly activeEvaluation: DampenerEvaluation | null;
  readonly nativeSafeCount: number;
  readonly dampenedSafeCount: number;
  readonly totalSafeCount: number;
  readonly unsafeCount: number;
}

class TraceFrameSnapshot implements DampenerTraceFrame {
  readonly scannedCount: number;
  readonly totalReports: number;
  readonly activeEvaluation: DampenerEvaluation | null;
  readonly nativeSafeCount: number;
  readonly dampenedSafeCount: number;

  constructor(
    scannedCount: number,
    totalReports: number,
    activeEvaluation: DampenerEvaluation | null,
    nativeSafeCount: number,
    dampenedSafeCount: number,
  ) {
    this.scannedCount = scannedCount;
    this.totalReports = totalReports;
    this.activeEvaluation = activeEvaluation;
    this.nativeSafeCount = nativeSafeCount;
    this.dampenedSafeCount = dampenedSafeCount;
    Object.freeze(this);
  }

  get totalSafeCount(): number {
    return this.nativeSafeCount + this.dampenedSafeCount;
  }

  get unsafeCount(): number {
    return this.scannedCount - this.totalSafeCount;
  }
}

/** Counts how many parsed reports are safe natively or after removing one level. */
export function countDampenedSafeReports(reports: readonly Report[]): number {
  let safeCount = 0;
  for (let i = 0; i < reports.length; i += 1) {
    if (DampenerEvaluation.evaluate(reports[i]!).isSafe) safeCount += 1;
  }
  return safeCount;
}

/** Traces Problem Dampener report evaluation sampled uniformly up to `maxSteps` frames. */
export function traceDampenedReports(
  reports: readonly Report[],
  options?: TraceOptions,
): readonly DampenerTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampledCounts = sampleTraceIndices(reports.length + 1, limit);
  const frames: DampenerTraceFrame[] = [];
  let sampleCursor = 0;
  let nativeSafeCount = 0;
  let dampenedSafeCount = 0;

  for (let scannedCount = 0; scannedCount <= reports.length; scannedCount += 1) {
    const activeEvaluation =
      scannedCount > 0 ? DampenerEvaluation.evaluate(reports[scannedCount - 1]!) : null;
    if (activeEvaluation !== null) {
      if (activeEvaluation.outcome.kind === 'native-safe') nativeSafeCount += 1;
      else if (activeEvaluation.outcome.kind === 'dampened-safe') dampenedSafeCount += 1;
    }
    if (sampledCounts[sampleCursor] === scannedCount) {
      frames.push(
        new TraceFrameSnapshot(
          scannedCount,
          reports.length,
          activeEvaluation,
          nativeSafeCount,
          dampenedSafeCount,
        ),
      );
      sampleCursor += 1;
    }
  }
  return Object.freeze(frames);
}

export const solver: PuzzleSolver<readonly Report[], number, DampenerTraceFrame> = Object.freeze({
  parse: parseReports,
  solve: countDampenedSafeReports,
  trace: traceDampenedReports,
});
