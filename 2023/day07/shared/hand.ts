import { HAND_TYPE_LABELS, type CardTuple, type HandType } from './cards';
import { formatStrengthKeyHex, packHandStrengthKey, type CamelHandRule } from './rule';

/** Immutable Camel Cards hand with its bid and original 0-based input position. */
export class CamelHand {
  readonly cards: CardTuple;
  readonly bid: bigint;
  readonly inputIndex: number;

  constructor(cards: CardTuple, bid: bigint, inputIndex: number) {
    if (bid < 0n) {
      throw new RangeError(`Bid must be non-negative, got ${bid}`);
    }
    if (!Number.isInteger(inputIndex) || inputIndex < 0) {
      throw new RangeError(`inputIndex must be a non-negative integer, got ${inputIndex}`);
    }
    this.cards = Object.freeze([...cards]) as unknown as CardTuple;
    this.bid = bid;
    this.inputIndex = inputIndex;
    Object.freeze(this);
  }

  /** Five-character string representation of this hand's cards. */
  get label(): string {
    return this.cards.join('');
  }
}

/** Immutable hand evaluated and ranked under a specific `CamelHandRule`. */
export class RankedHand {
  readonly hand: CamelHand;
  readonly rule: CamelHandRule;
  readonly rank: number;

  constructor(hand: CamelHand, rule: CamelHandRule, rank: number) {
    if (!Number.isInteger(rank) || rank < 1) {
      throw new RangeError(`Rank must be an integer >= 1, got ${rank}`);
    }
    this.hand = hand;
    this.rule = rule;
    this.rank = rank;
    Object.freeze(this);
  }

  get handType(): HandType {
    return this.rule.classifyHand(this.hand.cards);
  }

  get handTypeLabel(): string {
    return HAND_TYPE_LABELS[this.handType];
  }

  get strengthKey(): number {
    return packHandStrengthKey(this.hand.cards, this.rule);
  }

  get hexKey(): string {
    return formatStrengthKeyHex(this.strengthKey);
  }

  get winnings(): bigint {
    return this.hand.bid * BigInt(this.rank);
  }
}
