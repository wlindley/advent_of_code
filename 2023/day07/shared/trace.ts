import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import { HAND_TYPE_COUNT, type HandType } from './cards';
import { RankedHand } from './hand';
import { CamelCardsDeal } from './ranking';
import { findTieBreakIndex, type CamelHandRule } from './rule';

export const DEFAULT_MAX_TRACE_STEPS = 200;

/** Exact integer-scaled ratio in `[0, 1]` safe for arbitrarily large `bigint` values. */
export function ratioBigInt(num: bigint, den: bigint): number {
  if (den < 0n) {
    throw new RangeError(`Denominator must be non-negative, got ${den}`);
  }
  if (den === 0n || num <= 0n) return 0;
  if (num >= den) return 1;
  return Number((num * 10000n) / den) / 10000;
}

function validateTierCounts(counts: readonly number[], expectedSum: number): void {
  if (counts.length !== HAND_TYPE_COUNT) {
    throw new RangeError(`Expected ${HAND_TYPE_COUNT} tier counts, got ${counts.length}`);
  }
  let sum = 0;
  for (const count of counts) {
    if (!Number.isInteger(count) || count < 0) {
      throw new RangeError(`Tier count must be a non-negative integer, got ${count}`);
    }
    sum += count;
  }
  if (sum !== expectedSum) {
    throw new RangeError(`Tier counts sum (${sum}) must equal rank (${expectedSum})`);
  }
}

function validateTraceFrame(
  ranked: RankedHand,
  previousRanked: RankedHand | undefined,
  totalHands: number,
  runningWinnings: bigint,
  cumulativeTierCounts: readonly number[],
): void {
  if (!Number.isInteger(totalHands) || totalHands < 1) {
    throw new RangeError(`totalHands must be a positive integer, got ${totalHands}`);
  }
  if (ranked.rank > totalHands) {
    throw new RangeError(`rank ${ranked.rank} exceeds totalHands ${totalHands}`);
  }
  if (ranked.rank === 1 && previousRanked !== undefined) {
    throw new RangeError('Rank 1 frame must not have a previousRanked predecessor');
  }
  if (ranked.rank > 1 && previousRanked?.rank !== ranked.rank - 1) {
    throw new RangeError(`previousRanked must have rank ${ranked.rank - 1}`);
  }
  if (runningWinnings < 0n) {
    throw new RangeError(`runningWinnings must be non-negative, got ${runningWinnings}`);
  }
  validateTierCounts(cumulativeTierCounts, ranked.rank);
}

/** Immutable trace snapshot for one ranked hand with exact predecessor and cumulative stats. */
export class CamelCardsTraceFrame {
  readonly ranked: RankedHand;
  readonly previousRanked: RankedHand | undefined;
  readonly totalHands: number;
  readonly runningWinnings: bigint;
  readonly cumulativeTierCounts: readonly number[];

  constructor(
    ranked: RankedHand,
    previousRanked: RankedHand | undefined,
    totalHands: number,
    runningWinnings: bigint,
    cumulativeTierCounts: readonly number[],
  ) {
    validateTraceFrame(ranked, previousRanked, totalHands, runningWinnings, cumulativeTierCounts);
    this.ranked = ranked;
    this.previousRanked = previousRanked;
    this.totalHands = totalHands;
    this.runningWinnings = runningWinnings;
    this.cumulativeTierCounts = Object.freeze([...cumulativeTierCounts]);
    Object.freeze(this);
  }

  get rank(): number {
    return this.ranked.rank;
  }

  get winnings(): bigint {
    return this.ranked.winnings;
  }

  get tieBreakIndex(): number | undefined {
    return this.previousRanked
      ? findTieBreakIndex(this.previousRanked.hand.cards, this.ranked.hand.cards)
      : undefined;
  }
}

/** Produces bounded trace frames for a deal while preserving exact predecessors and totals. */
export function traceCamelCardsDeal(
  deal: CamelCardsDeal,
  rule: CamelHandRule,
  options?: TraceOptions,
): readonly CamelCardsTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const rankedAll = deal.rankWith(rule);
  const totalHands = rankedAll.length;
  const indices = sampleTraceIndices(totalHands, limit);
  const tierCounts = new Array<number>(HAND_TYPE_COUNT).fill(0);
  const frames: CamelCardsTraceFrame[] = [];
  let runningWinnings = 0n;
  let samplePtr = 0;

  for (let i = 0; i < totalHands; i += 1) {
    const curr = rankedAll[i]!;
    runningWinnings += curr.winnings;
    tierCounts[curr.handType]! += 1;
    if (i === indices[samplePtr]) {
      const prev = i > 0 ? rankedAll[i - 1] : undefined;
      frames.push(new CamelCardsTraceFrame(curr, prev, totalHands, runningWinnings, tierCounts));
      samplePtr += 1;
    }
  }
  return Object.freeze(frames);
}

/** Returns the first trace frame index matching `tier`, or `undefined` if absent. */
export function findFirstFrameForTier(
  frames: readonly CamelCardsTraceFrame[],
  tier: HandType,
): number | undefined {
  for (let i = 0; i < frames.length; i += 1) {
    if (frames[i]!.ranked.handType === tier) return i;
  }
  return undefined;
}
