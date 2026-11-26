import { blinkStone, PebbleLine, type StoneTransition } from './pebbles';

/** Stone counts transformed by each rule during a single blink step. */
export interface RuleCounts {
  readonly zero: bigint;
  readonly split: bigint;
  readonly scale: bigint;
}

/** Result of advancing a stone frequency histogram by one blink. */
export interface HistogramStep {
  readonly next: Map<bigint, bigint>;
  readonly ruleCounts: RuleCounts;
}

/** Validates that a blink count is a non-negative integer. */
export function validateBlinkCount(blinkCount: number): number {
  if (!Number.isInteger(blinkCount) || blinkCount < 0) {
    throw new RangeError(
      `blinkCount must be a non-negative integer, got ${blinkCount}`,
    );
  }
  return blinkCount;
}

/** Looks up or computes and memoizes the transition for a stone label. */
export function resolveTransition(
  stone: bigint,
  cache: Map<bigint, StoneTransition>,
): StoneTransition {
  const cached = cache.get(stone);
  if (cached !== undefined) return cached;
  const computed = blinkStone(stone);
  cache.set(stone, computed);
  return computed;
}

/** Advances a stone frequency histogram by one blink, recording rule counts. */
export function stepHistogram(
  histogram: ReadonlyMap<bigint, bigint>,
  cache: Map<bigint, StoneTransition>,
): HistogramStep {
  const next = new Map<bigint, bigint>();
  const counts = { zero: 0n, split: 0n, scale: 0n };
  for (const [stone, count] of histogram) {
    const transition = resolveTransition(stone, cache);
    counts[transition.rule] += count;
    for (const out of transition.outputs) {
      next.set(out, (next.get(out) ?? 0n) + count);
    }
  }
  return Object.freeze({ next, ruleCounts: Object.freeze(counts) });
}

/** Sums all stone multiplicities in a histogram. */
export function sumHistogram(histogram: ReadonlyMap<bigint, bigint>): bigint {
  let total = 0n;
  for (const count of histogram.values()) {
    total += count;
  }
  return total;
}

/** Counts total pebbles remaining after `blinkCount` synchronous blinks. */
export function countStonesAfterBlinks(
  line: PebbleLine,
  blinkCount: number,
): bigint {
  const blinks = validateBlinkCount(blinkCount);
  let histogram: Map<bigint, bigint> = line.toHistogram();
  const cache = new Map<bigint, StoneTransition>();
  for (let blink = 0; blink < blinks; blink += 1) {
    histogram = stepHistogram(histogram, cache).next;
  }
  return sumHistogram(histogram);
}
