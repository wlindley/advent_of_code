import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../shared/core';
import type { DisplayEntry } from './entry';
import { parseDisplayNotes } from './parser';
import type { DisplayEvaluationPolicy } from './policy';
import { decodeDisplayEntry, type DecodedDisplay } from './wiring';

export const DEFAULT_MAX_TRACE_STEPS = 64;

export interface DisplayTraceFrameProps {
  readonly entryIndex: number;
  readonly totalEntries: number;
  readonly decoded: DecodedDisplay;
  readonly policy: DisplayEvaluationPolicy;
  readonly runningTotal: number;
}

/** Immutable playback snapshot for one decoded 7-segment display entry. */
export class DisplayTraceFrame {
  readonly entryIndex: number;
  readonly totalEntries: number;
  readonly decoded: DecodedDisplay;
  readonly policy: DisplayEvaluationPolicy;
  readonly runningTotal: number;

  constructor(props: DisplayTraceFrameProps) {
    this.entryIndex = props.entryIndex;
    this.totalEntries = props.totalEntries;
    this.decoded = props.decoded;
    this.policy = props.policy;
    this.runningTotal = props.runningTotal;
    Object.freeze(this);
  }

  get contribution(): number {
    return this.policy.evaluate(this.decoded);
  }
}

/** Generates sampled playback frames over decoded display entries, preserving endpoints. */
export function traceDisplays(
  entries: readonly DisplayEntry[],
  policy: DisplayEvaluationPolicy,
  options?: TraceOptions,
): readonly DisplayTraceFrame[] {
  const maxSteps = options === undefined ? undefined : options.maxSteps;
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_STEPS);
  if (entries.length === 0) return Object.freeze([]);
  const keep = new Set(sampleTraceIndices(entries.length, limit));
  const frames: DisplayTraceFrame[] = [];
  let runningTotal = 0;
  for (const [entryIndex, entry] of entries.entries()) {
    const decoded = decodeDisplayEntry(entry);
    runningTotal += policy.evaluate(decoded);
    if (keep.has(entryIndex)) {
      frames.push(
        new DisplayTraceFrame({
          entryIndex,
          totalEntries: entries.length,
          decoded,
          policy,
          runningTotal,
        }),
      );
    }
  }
  return Object.freeze(frames);
}

/** Parameterized 7-segment display solver bound to a Part 1 or Part 2 evaluation policy. */
export class SevenSegmentSolver
  implements Required<PuzzleSolver<readonly DisplayEntry[], number, DisplayTraceFrame>>
{
  readonly policy: DisplayEvaluationPolicy;

  constructor(policy: DisplayEvaluationPolicy) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): readonly DisplayEntry[] {
    return parseDisplayNotes(raw);
  }

  solve(entries: readonly DisplayEntry[]): number {
    let total = 0;
    for (const entry of entries) {
      total += this.policy.evaluate(decodeDisplayEntry(entry));
    }
    return total;
  }

  trace(entries: readonly DisplayEntry[], options?: TraceOptions): readonly DisplayTraceFrame[] {
    return traceDisplays(entries, this.policy, options);
  }
}
