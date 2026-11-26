import { describe, expect, it } from 'vitest';
import {
  HandType,
  formatStrengthKeyHex,
  packHandStrengthKey,
  parseCardTuple,
} from '../../shared';
import { JOKER_CARD_ORDER, classifyJokerHand, jokerHandRule } from './rule';

describe('Part 2 jokerHandRule', () => {
  it('exposes frozen metadata and monotonic J < 2..A card strengths', () => {
    expect(Object.isFrozen(jokerHandRule)).toBe(true);
    expect(Object.isFrozen(JOKER_CARD_ORDER)).toBe(true);
    expect(jokerHandRule.id).toBe('part2-jokers');
    expect(jokerHandRule.label).toBe('Wild Jokers');
    expect(jokerHandRule.wildLabel).toBe('J');
    expect(jokerHandRule.cardOrder).toBe(JOKER_CARD_ORDER);

    const expectedOrder = ['J', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'Q', 'K', 'A'] as const;
    expect(JOKER_CARD_ORDER).toEqual(expectedOrder);
    expectedOrder.forEach((label, idx) => {
      expect(jokerHandRule.cardStrength(label)).toBe(idx);
    });
  });

  it('classifies all 19 (joker count, non-joker partition) hand patterns', () => {
    const cases: readonly (readonly [string, HandType])[] = [
      // j = 0 (7 partitions)
      ['AAAAA', HandType.FiveOfAKind],
      ['AA8AA', HandType.FourOfAKind],
      ['23332', HandType.FullHouse],
      ['TTT98', HandType.ThreeOfAKind],
      ['KK677', HandType.TwoPair],
      ['32T3K', HandType.OnePair],
      ['23456', HandType.HighCard],
      // j = 1 (5 partitions)
      ['AAAAJ', HandType.FiveOfAKind],
      ['AAA2J', HandType.FourOfAKind],
      ['2233J', HandType.FullHouse],
      ['2234J', HandType.ThreeOfAKind],
      ['2345J', HandType.OnePair],
      // j = 2 (3 partitions)
      ['AAAJJ', HandType.FiveOfAKind],
      ['QJJQ2', HandType.FourOfAKind],
      ['234JJ', HandType.ThreeOfAKind],
      // j = 3 (2 partitions)
      ['AAJJJ', HandType.FiveOfAKind],
      ['23JJJ', HandType.FourOfAKind],
      // j = 4 (1 partition)
      ['2JJJJ', HandType.FiveOfAKind],
      // j = 5 (1 partition)
      ['JJJJJ', HandType.FiveOfAKind],
    ];

    for (const [raw, expectedType] of cases) {
      const tuple = parseCardTuple(raw);
      expect(classifyJokerHand(tuple)).toBe(expectedType);
      expect(jokerHandRule.classifyHand(tuple)).toBe(expectedType);
    }
  });

  it('packs exact hex keys using wild hand type and J=0 card tie-break strength', () => {
    const expectedHex: readonly (readonly [string, string])[] = [
      ['JJJJJ', '0x600000'],
      ['JJJJ2', '0x600001'],
      ['22222', '0x611111'],
      ['AAAAK', '0x5CCCCB'],
      ['JKKK2', '0x50BBB1'],
      ['QQQQ2', '0x5AAAA1'],
      ['QJJQ2', '0x5A00A1'],
    ];

    for (const [raw, hex] of expectedHex) {
      const key = packHandStrengthKey(parseCardTuple(raw), jokerHandRule);
      expect(formatStrengthKeyHex(key)).toBe(hex);
    }
  });
});
