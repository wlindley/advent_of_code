import type { PuzzleSolver, TraceOptions } from './solver';
import { sampleTraceIndices, validateMaxSteps } from './trace';

export const FINALE_SUBMISSION_VALUE = 0;

export interface FinaleStarNode {
  readonly starNumber: number;
  readonly day: number;
  readonly part: 1 | 2;
  readonly isTopper: boolean;
}

export interface FinaleTraceFrame {
  readonly litStars: number;
  readonly totalStars: number;
  readonly nodes: readonly FinaleStarNode[];
  readonly isComplete: boolean;
}

function assertValidTotalStars(totalStars: number): void {
  if (!Number.isInteger(totalStars) || totalStars < 2 || totalStars % 2 !== 0) {
    throw new RangeError('totalStars must be an even integer >= 2');
  }
}

/** Builds the ordered star canopy for an Advent of Code finale with `totalStars` stars. */
export function buildStarCanopy(totalStars: number): readonly FinaleStarNode[] {
  assertValidTotalStars(totalStars);
  const nodes: FinaleStarNode[] = [];
  for (let i = 1; i <= totalStars; i += 1) {
    nodes.push(
      Object.freeze({
        starNumber: i,
        day: Math.ceil(i / 2),
        part: (i % 2 === 1 ? 1 : 2) as 1 | 2,
        isTopper: i === totalStars,
      }),
    );
  }
  return Object.freeze(nodes);
}

/** Parses an explicit integer star count, falling back to `totalStars - 1` for raw puzzle input. */
export function parsePriorStars(raw: string, totalStars: number): number {
  assertValidTotalStars(totalStars);
  const trimmed = raw.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  return totalStars - 1;
}

/** Verifies that all `totalStars - 1` prerequisite stars have been collected before claiming the finale star. */
export function verifyFinaleStar(collectedPriorStars: number, totalStars: number): number {
  assertValidTotalStars(totalStars);
  if (!Number.isInteger(collectedPriorStars) || collectedPriorStars < 0) {
    throw new RangeError('collectedPriorStars must be a non-negative integer');
  }
  const required = totalStars - 1;
  if (collectedPriorStars < required) {
    throw new Error(`Need ${required} stars before claiming star #${totalStars} (have ${collectedPriorStars})`);
  }
  return FINALE_SUBMISSION_VALUE;
}

/** Emits a bounded star-canopy illumination trace for an Advent of Code finale. */
export function traceFinale(
  collectedPriorStars: number,
  totalStars: number,
  options?: TraceOptions,
): readonly FinaleTraceFrame[] {
  verifyFinaleStar(collectedPriorStars, totalStars);
  const limit = validateMaxSteps(options?.maxSteps, totalStars);
  const nodes = buildStarCanopy(totalStars);
  const indices = sampleTraceIndices(totalStars, limit);
  const frames: FinaleTraceFrame[] = [];
  for (const idx of indices) {
    const litStars = idx + 1;
    frames.push(
      Object.freeze({
        litStars,
        totalStars,
        nodes,
        isComplete: litStars === totalStars,
      }),
    );
  }
  return Object.freeze(frames);
}

/** Creates a frozen, reusable Advent of Code finale solver for a year with `totalStars` stars. */
export function createFinaleSolver(
  totalStars: number,
): Required<PuzzleSolver<number, number, FinaleTraceFrame>> {
  assertValidTotalStars(totalStars);
  return Object.freeze({
    parse: (raw: string): number => parsePriorStars(raw, totalStars),
    solve: (collectedPriorStars: number): number => verifyFinaleStar(collectedPriorStars, totalStars),
    trace: (collectedPriorStars: number, options?: TraceOptions): readonly FinaleTraceFrame[] =>
      traceFinale(collectedPriorStars, totalStars, options),
  });
}
