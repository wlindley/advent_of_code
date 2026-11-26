import { describe, expect, it } from 'vitest';
import { STANDARD_CARD_LABELS, parseCardTuple, type CardTuple } from './cards';
import { CamelHand } from './hand';
import {
  CamelCardsDeal,
  compareScoredHands,
  computeTotalWinnings,
  rankHands,
} from './ranking';
import {
  classifyFrequencySignature,
  createCardStrengthMap,
  tallyCards,
  type CamelHandRule,
} from './rule';

const STRENGTHS = createCardStrengthMap(STANDARD_CARD_LABELS);
const RULE: CamelHandRule = {
  id: 'std',
  label: 'Standard',
  cardOrder: STANDARD_CARD_LABELS,
  wildLabel: null,
  cardStrength: (label) => STRENGTHS.get(label)!,
  classifyHand: (cards: CardTuple) =>
    classifyFrequencySignature([...tallyCards(cards).values()].sort((a, b) => b - a)),
};

describe('ranking and CamelCardsDeal', () => {
  it('breaks key ties deterministically using inputIndex', () => {
    const first = new CamelHand(parseCardTuple('32T3K'), 10n, 0);
    const duplicate = new CamelHand(parseCardTuple('32T3K'), 20n, 4);
    const stronger = new CamelHand(parseCardTuple('KK677'), 30n, 1);

    expect(compareScoredHands({ hand: first, key: 100 }, { hand: duplicate, key: 100 })).toBeLessThan(0);
    expect(compareScoredHands({ hand: duplicate, key: 100 }, { hand: first, key: 100 })).toBeGreaterThan(0);
    expect(compareScoredHands({ hand: first, key: 100 }, { hand: stronger, key: 200 })).toBeLessThan(0);
  });

  it('ranks hands ascending and computes total winnings including duplicate hands', () => {
    const hands = [
      new CamelHand(parseCardTuple('KK677'), 28n, 0),
      new CamelHand(parseCardTuple('32T3K'), 765n, 1),
      new CamelHand(parseCardTuple('32T3K'), 10n, 2),
    ];
    const ranked = rankHands(hands, RULE);
    expect(Object.isFrozen(ranked)).toBe(true);
    expect(ranked.map((r) => [r.hand.inputIndex, r.rank, r.winnings])).toEqual([
      [1, 1, 765n],
      [2, 2, 20n],
      [0, 3, 84n],
    ]);
    expect(computeTotalWinnings(ranked)).toBe(869n);
  });

  it('constructs a frozen non-empty CamelCardsDeal with cohesive ranking methods', () => {
    const h1 = new CamelHand(parseCardTuple('32T3K'), 765n, 0);
    const h2 = new CamelHand(parseCardTuple('QQQJA'), 483n, 1);
    const deal = new CamelCardsDeal([h1, h2]);

    expect(Object.isFrozen(deal)).toBe(true);
    expect(Object.isFrozen(deal.hands)).toBe(true);
    expect(deal.rankWith(RULE).map((r) => r.hand.label)).toEqual(['32T3K', 'QQQJA']);
    expect(deal.totalWinningsWith(RULE)).toBe(765n + 483n * 2n);
  });

  it('rejects an empty deal', () => {
    expect(() => new CamelCardsDeal([])).toThrow(RangeError);
  });
});
