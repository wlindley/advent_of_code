import { describe, expect, it } from 'vitest';
import { HandType, STANDARD_CARD_LABELS, parseCardTuple, type CardLabel, type CardTuple } from './cards';
import {
  classifyFrequencySignature,
  createCardStrengthMap,
  findTieBreakIndex,
  formatStrengthKeyHex,
  packHandStrengthKey,
  tallyCards,
  type CamelHandRule,
} from './rule';

function makeTestRule(overrideStrength?: (label: CardLabel) => number): CamelHandRule {
  const map = createCardStrengthMap(STANDARD_CARD_LABELS);
  return {
    id: 'test',
    label: 'Test Rule',
    cardOrder: STANDARD_CARD_LABELS,
    wildLabel: null,
    cardStrength: (label) => (overrideStrength ? overrideStrength(label) : map.get(label)!),
    classifyHand: (cards: CardTuple) => {
      const counts = [...tallyCards(cards).values()].sort((a, b) => b - a);
      return classifyFrequencySignature(counts);
    },
  };
}

describe('Camel Cards rule helpers', () => {
  it('builds a strength map from a 13-card permutation and rejects invalid orders', () => {
    const map = createCardStrengthMap(STANDARD_CARD_LABELS);
    expect(map.size).toBe(13);
    expect(map.get('2')).toBe(0);
    expect(map.get('A')).toBe(12);

    expect(() => createCardStrengthMap(['2', '3'])).toThrow(RangeError);
    const dupOrder = [...STANDARD_CARD_LABELS.slice(0, 12), '2'] as CardLabel[];
    expect(() => createCardStrengthMap(dupOrder)).toThrow(RangeError);
    const badOrder = [...STANDARD_CARD_LABELS.slice(0, 12), 'X' as CardLabel];
    expect(() => createCardStrengthMap(badOrder)).toThrow(RangeError);
  });

  it('tallies card frequencies in a hand', () => {
    const counts = tallyCards(parseCardTuple('T55J5'));
    expect(counts.get('T')).toBe(1);
    expect(counts.get('5')).toBe(3);
    expect(counts.get('J')).toBe(1);
  });

  it('classifies all 7 frequency signatures and rejects invalid signatures', () => {
    expect(classifyFrequencySignature([5])).toBe(HandType.FiveOfAKind);
    expect(classifyFrequencySignature([4, 1])).toBe(HandType.FourOfAKind);
    expect(classifyFrequencySignature([3, 2])).toBe(HandType.FullHouse);
    expect(classifyFrequencySignature([3, 1, 1])).toBe(HandType.ThreeOfAKind);
    expect(classifyFrequencySignature([2, 2, 1])).toBe(HandType.TwoPair);
    expect(classifyFrequencySignature([2, 1, 1, 1])).toBe(HandType.OnePair);
    expect(classifyFrequencySignature([1, 1, 1, 1, 1])).toBe(HandType.HighCard);
    expect(() => classifyFrequencySignature([4])).toThrow(RangeError);
    expect(() => classifyFrequencySignature([])).toThrow(RangeError);
  });

  it('packs and formats 24-bit strength keys and validates bounds', () => {
    const rule = makeTestRule();
    const key = packHandStrengthKey(parseCardTuple('AAAAA'), rule);
    expect(key).toBe(0x6ccccc);
    expect(formatStrengthKeyHex(key)).toBe('0x6CCCCC');
    expect(formatStrengthKeyHex(0)).toBe('0x000000');

    expect(() => formatStrengthKeyHex(-1)).toThrow(RangeError);
    expect(() => formatStrengthKeyHex(0x6ccccd)).toThrow(RangeError);
    expect(() => formatStrengthKeyHex(1.5)).toThrow(RangeError);

    const negRule = makeTestRule(() => -1);
    const highRule = makeTestRule(() => 13);
    const floatRule = makeTestRule(() => 1.5);
    const hand = parseCardTuple('23456');
    expect(() => packHandStrengthKey(hand, negRule)).toThrow(RangeError);
    expect(() => packHandStrengthKey(hand, highRule)).toThrow(RangeError);
    expect(() => packHandStrengthKey(hand, floatRule)).toThrow(RangeError);
  });

  it('finds the first differing card index or undefined for identical hands', () => {
    expect(findTieBreakIndex(parseCardTuple('KK677'), parseCardTuple('KTJJT'))).toBe(1);
    expect(findTieBreakIndex(parseCardTuple('32T3K'), parseCardTuple('32T3K'))).toBeUndefined();
  });
});
