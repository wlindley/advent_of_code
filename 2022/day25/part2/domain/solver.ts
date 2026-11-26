import { sampleTraceIndices, validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../../shared/core';

export const TOTAL_2022_STARS = 50;
export const REQUIRED_PRIOR_STARS = 49;
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

export function buildStarCanopy(totalStars: number): readonly FinaleStarNode[] {
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
    throw new Error(`Need ${REQUIRED_PRIOR_STARS} stars before claiming the 50th star (have ${collectedPriorStars})`);
  }
  return FINALE_SUBMISSION_VALUE;
}

export function traceFinale(collectedPriorStars: number, options?: TraceOptions): readonly FinaleTraceFrame[] {
  verifyFinaleStar(collectedPriorStars);
  const limit = validateMaxSteps(options?.maxSteps, TOTAL_2022_STARS);
  const nodes = buildStarCanopy(TOTAL_2022_STARS);
  const indices = sampleTraceIndices(TOTAL_2022_STARS, limit);
  const frames: FinaleTraceFrame[] = [];
  for (const idx of indices) {
    const litStars = idx + 1;
    frames.push(
      Object.freeze({
        litStars,
        totalStars: TOTAL_2022_STARS,
        nodes,
        isComplete: litStars === TOTAL_2022_STARS,
      }),
    );
  }
  return Object.freeze(frames);
}

function parsePriorStars(raw: string): number {
  const trimmed = raw.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  return REQUIRED_PRIOR_STARS;
}

export const solver: Required<PuzzleSolver<number, number, FinaleTraceFrame>> = Object.freeze({
  parse: parsePriorStars,
  solve: verifyFinaleStar,
  trace: traceFinale,
});
