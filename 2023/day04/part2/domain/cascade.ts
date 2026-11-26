import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../../shared/core';
import type { Scratchcard } from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 200;

function assertCardCopies(cardCopies: readonly bigint[]): readonly bigint[] {
  if (cardCopies.length === 0) {
    throw new RangeError('cardCopies must be non-empty');
  }
  for (const count of cardCopies) {
    if (count < 1n) {
      throw new RangeError(`cardCopies entries must be >= 1n, got ${count}`);
    }
  }
  return Object.freeze(cardCopies.slice());
}

function assertCardIndex(cardIndex: number, totalCards: number): number {
  if (!Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= totalCards) {
    throw new RangeError(`cardIndex ${cardIndex} out of bounds for ${totalCards} cards`);
  }
  return cardIndex;
}

function applyCascadeDelta(
  delta: bigint[],
  cardIndex: number,
  matchCount: number,
  copies: bigint,
  totalCards: number,
): void {
  const end = Math.min(totalCards - 1, cardIndex + matchCount);
  if (end > cardIndex) {
    delta[cardIndex + 1] = delta[cardIndex + 1]! + copies;
    delta[end + 1] = delta[end + 1]! - copies;
  }
}

function buildCopiesSnapshot(
  settledCopies: readonly bigint[],
  delta: readonly bigint[],
  bonusAtCard: bigint,
  totalCards: number,
): readonly bigint[] {
  const snapshot = settledCopies.slice();
  let futureBonus = bonusAtCard;
  for (let j = settledCopies.length; j < totalCards; j += 1) {
    futureBonus += delta[j]!;
    snapshot.push(1n + futureBonus);
  }
  return Object.freeze(snapshot);
}

function sumCopiesUpTo(copies: readonly bigint[], endInclusive: number): bigint {
  let sum = 0n;
  for (let i = 0; i <= endInclusive; i += 1) {
    sum += copies[i]!;
  }
  return sum;
}

/** Immutable snapshot of the scratchcard cascade after processing one card. */
export class CascadeTraceFrame {
  readonly cardIndex: number;
  readonly card: Scratchcard;
  readonly cardCopies: readonly bigint[];

  constructor(cardIndex: number, card: Scratchcard, cardCopies: readonly bigint[]) {
    this.cardCopies = assertCardCopies(cardCopies);
    this.cardIndex = assertCardIndex(cardIndex, this.cardCopies.length);
    this.card = card;
    Object.freeze(this);
  }

  get totalCards(): number {
    return this.cardCopies.length;
  }

  get activeCopies(): bigint {
    return this.cardCopies[this.cardIndex]!;
  }

  get matchCount(): number {
    return this.card.matchCount;
  }

  get clampedEndIndex(): number {
    return Math.min(this.cardCopies.length - 1, this.cardIndex + this.matchCount);
  }

  get clampedSpan(): number {
    return this.clampedEndIndex - this.cardIndex;
  }

  get spawnedCopies(): bigint {
    return this.activeCopies * BigInt(this.clampedSpan);
  }

  get runningTotal(): bigint {
    return sumCopiesUpTo(this.cardCopies, this.cardIndex);
  }

  get projectedTotal(): bigint {
    return sumCopiesUpTo(this.cardCopies, this.cardCopies.length - 1);
  }

  get peakCopies(): bigint {
    let max = this.cardCopies[0]!;
    for (let i = 1; i < this.cardCopies.length; i += 1) {
      const value = this.cardCopies[i]!;
      if (value > max) max = value;
    }
    return max;
  }
}

/** Counts total scratchcards won via an O(N) forward difference-array cascade sweep. */
export function countTotalScratchcards(cards: readonly Scratchcard[]): bigint {
  const totalCards = cards.length;
  const delta = new Array<bigint>(totalCards + 1).fill(0n);
  let bonus = 0n;
  let total = 0n;
  for (let i = 0; i < totalCards; i += 1) {
    bonus += delta[i]!;
    const copies = 1n + bonus;
    total += copies;
    applyCascadeDelta(delta, i, cards[i]!.matchCount, copies, totalCards);
  }
  return total;
}

/** Produces sampled immutable cascade frames up to `options.maxSteps`. */
export function traceScratchcardCascade(
  cards: readonly Scratchcard[],
  options?: TraceOptions,
): readonly CascadeTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const totalCards = cards.length;
  if (totalCards === 0) return Object.freeze([]);
  const sampled = sampleTraceIndices(totalCards, maxSteps);
  const frames: CascadeTraceFrame[] = [];
  const delta = new Array<bigint>(totalCards + 1).fill(0n);
  const settledCopies: bigint[] = [];
  let bonus = 0n;
  let sampleCursor = 0;
  for (let i = 0; i < totalCards; i += 1) {
    bonus += delta[i]!;
    const copies = 1n + bonus;
    settledCopies.push(copies);
    const card = cards[i]!;
    applyCascadeDelta(delta, i, card.matchCount, copies, totalCards);
    if (sampled[sampleCursor] === i) {
      frames.push(new CascadeTraceFrame(i, card, buildCopiesSnapshot(settledCopies, delta, bonus, totalCards)));
      sampleCursor += 1;
    }
  }
  return Object.freeze(frames);
}
