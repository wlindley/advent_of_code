import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../shared/core';
import {
  analyzePassword,
  ceilNonDecreasing,
  nextNonDecreasing,
  type PasswordAnalysis,
} from './candidate';
import type { RunLengthPolicy } from './policy';
import { parsePasswordRange, type PasswordRange } from './range';

export const DEFAULT_MAX_TRACE_STEPS = 120;

export interface PasswordTraceFrameProps {
  readonly stepIndex: number;
  readonly totalCandidates: number;
  readonly range: PasswordRange;
  readonly candidate: PasswordAnalysis;
  readonly previousValue: number | null;
  readonly accepted: boolean;
  readonly matchedCount: number;
}

/** Sampled search frame emitted while stepping through monotone password candidates. */
export class PasswordTraceFrame {
  readonly stepIndex: number;
  readonly totalCandidates: number;
  readonly range: PasswordRange;
  readonly candidate: PasswordAnalysis;
  readonly previousValue: number | null;
  readonly accepted: boolean;
  readonly matchedCount: number;

  constructor(props: PasswordTraceFrameProps) {
    this.stepIndex = props.stepIndex;
    this.totalCandidates = props.totalCandidates;
    this.range = props.range;
    this.candidate = props.candidate;
    this.previousValue = props.previousValue;
    this.accepted = props.accepted;
    this.matchedCount = props.matchedCount;
    Object.freeze(this);
  }

  get rejectedCount(): number {
    return this.stepIndex + 1 - this.matchedCount;
  }

  get skippedIntegers(): number {
    return this.previousValue === null
      ? this.candidate.value - this.range.low
      : this.candidate.value - this.previousValue - 1;
  }
}

function collectMonotoneCandidates(range: PasswordRange): readonly number[] {
  const candidates: number[] = [];
  let current: number | null = ceilNonDecreasing(range.low);
  while (current !== null && current <= range.high) {
    candidates.push(current);
    current = nextNonDecreasing(current);
  }
  return candidates;
}

/** Counts 6-digit non-decreasing passwords in `range` accepted by `policy`. */
export function countMatchingPasswords(range: PasswordRange, policy: RunLengthPolicy): number {
  let matches = 0;
  let current: number | null = ceilNonDecreasing(range.low);
  while (current !== null && current <= range.high) {
    if (policy.accepts(analyzePassword(current).runs)) matches += 1;
    current = nextNonDecreasing(current);
  }
  return matches;
}

/** Generates bounded search frames across monotone candidates in `range`. */
export function tracePasswordSearch(
  range: PasswordRange,
  policy: RunLengthPolicy,
  options?: TraceOptions,
): readonly PasswordTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const candidates = collectMonotoneCandidates(range);
  const sampled = sampleTraceIndices(candidates.length, limit);
  const frames: PasswordTraceFrame[] = [];
  let matchedCount = 0;
  let sampleCursor = 0;
  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = analyzePassword(candidates[i]!);
    const accepted = policy.accepts(candidate.runs);
    if (accepted) matchedCount += 1;
    if (sampled[sampleCursor] === i) {
      const previousValue = i === 0 ? null : candidates[i - 1]!;
      frames.push(
        new PasswordTraceFrame({
          stepIndex: i,
          totalCandidates: candidates.length,
          range,
          candidate,
          previousValue,
          accepted,
          matchedCount,
        }),
      );
      sampleCursor += 1;
    }
  }
  return Object.freeze(frames);
}

/** Immutable PuzzleSolver bound to a specific RunLengthPolicy. */
export class SecureContainerSolver
  implements Required<PuzzleSolver<PasswordRange, number, PasswordTraceFrame>>
{
  readonly policy: RunLengthPolicy;

  constructor(policy: RunLengthPolicy) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): PasswordRange {
    return parsePasswordRange(raw);
  }

  solve(input: PasswordRange): number {
    return countMatchingPasswords(input, this.policy);
  }

  trace(input: PasswordRange, options?: TraceOptions): readonly PasswordTraceFrame[] {
    return tracePasswordSearch(input, this.policy, options);
  }
}

/** Creates a frozen Day 4 solver configured with the given run-length policy. */
export function createSecureContainerSolver(policy: RunLengthPolicy): SecureContainerSolver {
  return new SecureContainerSolver(policy);
}
