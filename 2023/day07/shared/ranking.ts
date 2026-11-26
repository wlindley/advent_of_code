import { CamelHand, RankedHand } from './hand';
import { packHandStrengthKey, type CamelHandRule } from './rule';

export interface ScoredHand {
  readonly hand: CamelHand;
  readonly key: number;
}

/** Compares scored hands ascending by packed key, breaking ties by `inputIndex`. */
export function compareScoredHands(a: ScoredHand, b: ScoredHand): number {
  return a.key !== b.key ? a.key - b.key : a.hand.inputIndex - b.hand.inputIndex;
}

/** Ranks hands from weakest (rank 1) to strongest (rank N) under `rule`. */
export function rankHands(
  hands: readonly CamelHand[],
  rule: CamelHandRule,
): readonly RankedHand[] {
  const scored = hands.map((hand) => ({
    hand,
    key: packHandStrengthKey(hand.cards, rule),
  }));
  scored.sort(compareScoredHands);
  return Object.freeze(scored.map((entry, idx) => new RankedHand(entry.hand, rule, idx + 1)));
}

/** Sums `rank * bid` across all ranked hands. */
export function computeTotalWinnings(ranked: readonly RankedHand[]): bigint {
  let total = 0n;
  for (const entry of ranked) {
    total += entry.winnings;
  }
  return total;
}

/** Immutable non-empty deal of Camel Cards hands. */
export class CamelCardsDeal {
  readonly hands: readonly CamelHand[];

  constructor(hands: readonly CamelHand[]) {
    if (hands.length === 0) {
      throw new RangeError('CamelCardsDeal requires at least one hand');
    }
    this.hands = Object.freeze([...hands]);
    Object.freeze(this);
  }

  rankWith(rule: CamelHandRule): readonly RankedHand[] {
    return rankHands(this.hands, rule);
  }

  totalWinningsWith(rule: CamelHandRule): bigint {
    return computeTotalWinnings(this.rankWith(rule));
  }
}
