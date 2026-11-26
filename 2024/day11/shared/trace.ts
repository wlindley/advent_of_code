import {
  sampleTraceIndices,
  validateMaxSteps,
  type TraceOptions,
} from '../../../shared/core';
import {
  resolveTransition,
  stepHistogram,
  sumHistogram,
  validateBlinkCount,
  type RuleCounts,
} from './evolution';
import { PebbleLine, type StoneTransition } from './pebbles';

/** Default maximum number of sampled trace frames for UI playback. */
export const DEFAULT_MAX_TRACE_STEPS = 80;

/** Maximum stone count for which an exact ordered pebble preview is kept. */
export const MAX_ORDERED_PREVIEW = 64n;

/** Maximum number of dominant stone buckets retained per trace frame. */
export const TOP_BUCKETS_LIMIT = 12;

/** Frequency bucket for a single distinct stone value in a trace frame. */
export interface StoneBucket {
  readonly stone: bigint;
  readonly count: bigint;
}

/** Sampled snapshot of pebble evolution at a specific blink count. */
export interface PebbleTraceFrame {
  readonly blink: number;
  readonly totalStones: bigint;
  readonly distinctStones: number;
  readonly ruleCounts: RuleCounts;
  readonly orderedPreview: readonly bigint[] | null;
  readonly topBuckets: readonly StoneBucket[];
}

const ZERO_RULE_COUNTS: RuleCounts = Object.freeze({
  zero: 0n,
  split: 0n,
  scale: 0n,
});

function compareStoneBuckets(a: StoneBucket, b: StoneBucket): number {
  if (a.count !== b.count) {
    return a.count > b.count ? -1 : 1;
  }
  return a.stone < b.stone ? -1 : 1;
}

function buildTopBuckets(
  histogram: ReadonlyMap<bigint, bigint>,
): readonly StoneBucket[] {
  const buckets: StoneBucket[] = [];
  for (const [stone, count] of histogram) {
    buckets.push(Object.freeze({ stone, count }));
  }
  buckets.sort(compareStoneBuckets);
  return Object.freeze(buckets.slice(0, TOP_BUCKETS_LIMIT));
}

function expandOrderedLine(
  stones: readonly bigint[],
  cache: Map<bigint, StoneTransition>,
): readonly bigint[] {
  const next: bigint[] = [];
  for (const stone of stones) {
    const transition = resolveTransition(stone, cache);
    for (const out of transition.outputs) {
      next.push(out);
    }
  }
  return Object.freeze(next);
}

function buildTraceFrame(
  blink: number,
  histogram: ReadonlyMap<bigint, bigint>,
  totalStones: bigint,
  ruleCounts: RuleCounts,
  orderedPreview: readonly bigint[] | null,
): PebbleTraceFrame {
  return Object.freeze({
    blink,
    totalStones,
    distinctStones: histogram.size,
    ruleCounts,
    orderedPreview,
    topBuckets: buildTopBuckets(histogram),
  });
}

/** Traces sampled pebble evolution frames over `0..blinkCount` blinks. */
export function tracePebbleEvolution(
  line: PebbleLine,
  blinkCount: number,
  options?: TraceOptions,
): readonly PebbleTraceFrame[] {
  const blinks = validateBlinkCount(blinkCount);
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampled = sampleTraceIndices(blinks + 1, maxSteps);
  const cache = new Map<bigint, StoneTransition>();
  const frames: PebbleTraceFrame[] = [];

  let histogram: Map<bigint, bigint> = line.toHistogram();
  let totalStones = BigInt(line.length);
  let lastRuleCounts = ZERO_RULE_COUNTS;
  let ordered: readonly bigint[] | null =
    totalStones <= MAX_ORDERED_PREVIEW ? line.stones : null;
  let sampleCursor = 0;

  for (let blink = 0; blink <= blinks; blink += 1) {
    if (sampled[sampleCursor] === blink) {
      frames.push(
        buildTraceFrame(blink, histogram, totalStones, lastRuleCounts, ordered),
      );
      sampleCursor += 1;
    }
    if (blink < blinks) {
      const step = stepHistogram(histogram, cache);
      histogram = step.next;
      lastRuleCounts = step.ruleCounts;
      totalStones = sumHistogram(histogram);
      ordered =
        ordered !== null && totalStones <= MAX_ORDERED_PREVIEW
          ? expandOrderedLine(ordered, cache)
          : null;
    }
  }

  return Object.freeze(frames);
}
