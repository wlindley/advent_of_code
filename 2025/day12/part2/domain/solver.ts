import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';

export const TOTAL_2025_STARS = 24;
export const REQUIRED_PRIOR_STARS = 23;
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

export function buildStarTree(totalStars = TOTAL_2025_STARS): readonly FinaleStarNode[] {
  if (!Number.isInteger(totalStars) || totalStars < 2 || totalStars % 2 !== 0) {
    throw new RangeError('totalStars must be an even integer >= 2');
  }
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

export function verifyFinaleStar(collectedPriorStars: number): number {
  if (!Number.isInteger(collectedPriorStars) || collectedPriorStars < 0) {
    throw new RangeError('collectedPriorStars must be a non-negative integer');
  }
  if (collectedPriorStars < REQUIRED_PRIOR_STARS) {
    throw new Error(`Need ${REQUIRED_PRIOR_STARS} stars before claiming the final star (have ${collectedPriorStars})`);
  }
  return FINALE_SUBMISSION_VALUE;
}

export function traceFinale(collectedPriorStars: number, options?: TraceOptions): readonly FinaleTraceFrame[] {
  verifyFinaleStar(collectedPriorStars);
  const maxSteps = options?.maxSteps ?? TOTAL_2025_STARS;
  if (!Number.isInteger(maxSteps) || maxSteps < 1) {
    throw new RangeError('maxSteps must be a positive integer');
  }
  const nodes = buildStarTree(TOTAL_2025_STARS);
  const count = Math.min(maxSteps, TOTAL_2025_STARS);
  const frames: FinaleTraceFrame[] = [];
  for (let i = 0; i < count; i += 1) {
    const litStars =
      count === 1 ? TOTAL_2025_STARS : 1 + Math.round((i * (TOTAL_2025_STARS - 1)) / (count - 1));
    frames.push(
      Object.freeze({
        litStars,
        totalStars: TOTAL_2025_STARS,
        nodes,
        isComplete: litStars === TOTAL_2025_STARS,
      }),
    );
  }
  return Object.freeze(frames);
}

export const solver: PuzzleSolver<number, number, FinaleTraceFrame> = {
  parse(raw: string): number {
    const trimmed = raw.trim();
    if (/^\d+$/.test(trimmed)) return Number(trimmed);
    return REQUIRED_PRIOR_STARS;
  },
  solve: verifyFinaleStar,
  trace: traceFinale,
};
