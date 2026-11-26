import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import { validateWindowSize, type SonarReport } from './sonarReport';

export const DEFAULT_MAX_TRACE_STEPS = 120;

export type SweepDeltaKind = 'increase' | 'decrease' | 'equal';

export interface SweepTraceFrame {
  readonly comparisonIndex: number;
  readonly exitingDepth: number;
  readonly enteringDepth: number;
  readonly deltaKind: SweepDeltaKind;
  readonly increasesSoFar: number;
}

/** Classifies a single sliding-window transition by comparing exiting vs entering depths. */
export function classifyDelta(exitingDepth: number, enteringDepth: number): SweepDeltaKind {
  if (enteringDepth > exitingDepth) return 'increase';
  if (enteringDepth < exitingDepth) return 'decrease';
  return 'equal';
}

/**
 * Counts consecutive stride-`windowSize` window sum increases in O(N) time and O(1) space.
 * Algebraic cancellation reduces sum(i-W+1..i) > sum(i-W..i-1) to depth[i] > depth[i-W].
 */
export function countWindowIncreases(report: SonarReport, windowSize: number): number {
  validateWindowSize(windowSize);
  let increases = 0;
  for (let i = windowSize; i < report.count; i += 1) {
    if (report.depthAt(i) > report.depthAt(i - windowSize)) {
      increases += 1;
    }
  }
  return increases;
}

/** Streams sliding-window cancellation trace frames, uniformly bounded by `options.maxSteps`. */
export function traceWindowIncreases(
  report: SonarReport,
  windowSize: number,
  options?: TraceOptions,
): readonly SweepTraceFrame[] {
  validateWindowSize(windowSize);
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const totalComparisons = report.count - windowSize;
  if (totalComparisons <= 0) return Object.freeze([]);

  const sampled = sampleTraceIndices(totalComparisons, limit);
  const frames: SweepTraceFrame[] = [];
  let increasesSoFar = 0;
  let sampleCursor = 0;

  for (let c = 0; c < totalComparisons; c += 1) {
    const exitingDepth = report.depthAt(c);
    const enteringDepth = report.depthAt(c + windowSize);
    const deltaKind = classifyDelta(exitingDepth, enteringDepth);
    if (deltaKind === 'increase') increasesSoFar += 1;
    if (c === sampled[sampleCursor]) {
      frames.push(Object.freeze({
        comparisonIndex: c,
        exitingDepth,
        enteringDepth,
        deltaKind,
        increasesSoFar,
      }));
      sampleCursor += 1;
    }
  }
  return Object.freeze(frames);
}
