import {
  sampleTraceIndices,
  validateMaxSteps,
  type TraceOptions,
} from '../../../../shared/core';
import type { Scratchcard } from '../../shared';

/** Default upper bound on trace frames emitted for interactive playback. */
export const DEFAULT_MAX_TRACE_STEPS = 200;

/** Immutable snapshot of scoring one scratchcard during Part 1 evaluation. */
export class ScratchcardTraceFrame {
  readonly cardIndex: number;
  readonly totalCards: number;
  readonly card: Scratchcard;
  readonly runningTotal: number;
  readonly winningCardCount: number;

  constructor(
    cardIndex: number,
    totalCards: number,
    card: Scratchcard,
    runningTotal: number,
    winningCardCount: number,
  ) {
    this.cardIndex = cardIndex;
    this.totalCards = totalCards;
    this.card = card;
    this.runningTotal = runningTotal;
    this.winningCardCount = winningCardCount;
    Object.freeze(this);
  }

  get matchingNumbers(): readonly number[] {
    return this.card.matchingNumbers;
  }

  get matchCount(): number {
    return this.card.matchCount;
  }

  get cardPoints(): number {
    return this.card.points;
  }
}

/** Adds `delta` points to `total`, throwing `RangeError` if the sum leaves safe integers. */
export function addSafePoints(total: number, delta: number): number {
  const next = total + delta;
  if (!Number.isSafeInteger(next)) {
    throw new RangeError(`Point total ${next} exceeds MAX_SAFE_INTEGER`);
  }
  return next;
}

/** Sums Part 1 doubling points across all scratchcards safely. */
export function sumScratchcardPoints(cards: readonly Scratchcard[]): number {
  let total = 0;
  for (const card of cards) {
    total = addSafePoints(total, card.points);
  }
  return total;
}

/** Generates sampled trace frames across scratchcards while keeping exact running totals. */
export function traceScratchcards(
  cards: readonly Scratchcard[],
  options?: TraceOptions,
): readonly ScratchcardTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const totalCards = cards.length;
  if (totalCards === 0) return Object.freeze([]);
  const sampledSet = new Set(sampleTraceIndices(totalCards, maxSteps));
  const frames: ScratchcardTraceFrame[] = [];
  let runningTotal = 0;
  let winningCardCount = 0;
  for (let i = 0; i < totalCards; i += 1) {
    const card = cards[i]!;
    const pts = card.points;
    runningTotal = addSafePoints(runningTotal, pts);
    if (pts > 0) winningCardCount += 1;
    if (sampledSet.has(i)) {
      frames.push(new ScratchcardTraceFrame(i, totalCards, card, runningTotal, winningCardCount));
    }
  }
  return Object.freeze(frames);
}
