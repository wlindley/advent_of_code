import { describe, expect, it } from 'vitest';
import { HandType, STANDARD_CARD_LABELS, parseCardTuple, type CardTuple } from './cards';
import { CamelHand, RankedHand } from './hand';
import {
  classifyFrequencySignature,
  createCardStrengthMap,
  tallyCards,
  type CamelHandRule,
} from './rule';

const TEST_STRENGTHS = createCardStrengthMap(STANDARD_CARD_LABELS);
const TEST_RULE: CamelHandRule = {
  id: 'std',
  label: 'Standard',
  cardOrder: STANDARD_CARD_LABELS,
  wildLabel: null,
  cardStrength: (label) => TEST_STRENGTHS.get(label)!,
  classifyHand: (cards: CardTuple) =>
    classifyFrequencySignature([...tallyCards(cards).values()].sort((a, b) => b - a)),
};

describe('CamelHand and RankedHand', () => {
  it('constructs a frozen CamelHand with derived label', () => {
    const hand = new CamelHand(parseCardTuple('32T3K'), 765n, 0);
    expect(Object.isFrozen(hand)).toBe(true);
    expect(Object.isFrozen(hand.cards)).toBe(true);
    expect(hand.bid).toBe(765n);
    expect(hand.inputIndex).toBe(0);
    expect(hand.label).toBe('32T3K');
  });

  it('rejects negative bids and invalid input indices on CamelHand', () => {
    const cards = parseCardTuple('32T3K');
    expect(() => new CamelHand(cards, -1n, 0)).toThrow(RangeError);
    expect(() => new CamelHand(cards, 10n, -1)).toThrow(RangeError);
    expect(() => new CamelHand(cards, 10n, 1.5)).toThrow(RangeError);
  });

  it('constructs a frozen RankedHand with derived type, key, hexKey, and winnings', () => {
    const hand = new CamelHand(parseCardTuple('KTJJT'), 220n, 3);
    const ranked = new RankedHand(hand, TEST_RULE, 2);
    expect(Object.isFrozen(ranked)).toBe(true);
    expect(ranked.hand).toBe(hand);
    expect(ranked.rule).toBe(TEST_RULE);
    expect(ranked.rank).toBe(2);
    expect(ranked.handType).toBe(HandType.TwoPair);
    expect(ranked.handTypeLabel).toBe('Two Pair');
    expect(ranked.strengthKey).toBe(0x2b8998);
    expect(ranked.hexKey).toBe('0x2B8998');
    expect(ranked.winnings).toBe(440n);
  });

  it('rejects invalid rank on RankedHand', () => {
    const hand = new CamelHand(parseCardTuple('32T3K'), 765n, 0);
    expect(() => new RankedHand(hand, TEST_RULE, 0)).toThrow(RangeError);
    expect(() => new RankedHand(hand, TEST_RULE, -2)).toThrow(RangeError);
    expect(() => new RankedHand(hand, TEST_RULE, 1.5)).toThrow(RangeError);
  });
});
