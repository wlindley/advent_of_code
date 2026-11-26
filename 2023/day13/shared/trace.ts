import {
  sampleTraceIndices,
  validateMaxSteps,
  type TraceOptions,
} from '../../../shared/core';
import type { MirrorPattern } from './pattern';
import { findReflection, validateTargetSmudges, type ReflectionMatch } from './reflection';

/** Default cap on sampled frames emitted by `buildIncidenceTrace`. */
export const DEFAULT_MAX_TRACE_STEPS = 100;

/** Lightweight playback snapshot for one sampled mirror pattern. */
export interface IncidenceTraceFrame {
  readonly patternIndex: number;
  readonly totalPatterns: number;
  readonly pattern: MirrorPattern;
  readonly match: ReflectionMatch;
  readonly cumulativeScore: number;
}

/**
 * Finds reflections across all `patterns` for `targetSmudges`
 * and emits uniformly sampled, frozen trace frames bounded by `maxSteps`.
 */
export function buildIncidenceTrace(
  patterns: readonly MirrorPattern[],
  targetSmudges: number,
  options?: TraceOptions,
): readonly IncidenceTraceFrame[] {
  validateTargetSmudges(targetSmudges);
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  if (patterns.length === 0) return Object.freeze([]);

  const sampled = sampleTraceIndices(patterns.length, limit);
  const frames: IncidenceTraceFrame[] = [];
  let cursor = 0;
  let cumulativeScore = 0;

  for (let i = 0; i < patterns.length; i += 1) {
    const pattern = patterns[i]!;
    const match = findReflection(pattern, targetSmudges);
    cumulativeScore += match.score;
    if (sampled[cursor] === i) {
      frames.push(
        Object.freeze({
          patternIndex: i,
          totalPatterns: patterns.length,
          pattern,
          match,
          cumulativeScore,
        }),
      );
      cursor += 1;
    }
  }
  return Object.freeze(frames);
}
