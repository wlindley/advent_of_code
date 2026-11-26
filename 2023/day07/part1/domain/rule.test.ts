import { describe, expect, it } from 'vitest';
import { HandType, STANDARD_CARD_LABELS, parseCardTuple } from '../../shared';
import { standardHandRule } from './rule';

describe('Part 1 standardHandRule', () => {
  it('exposes frozen metadata and standard 2..A card strengths with no wildcards', () => {
    expect(Object.isFrozen(standardHandRule)).toBe(true);
    expect(standardHandRule.id).toBe('part1-standard');
    expect(standardHandRule.wildLabel).toBeNull();
    expect(standardHandRule.cardOrder).toBe(STANDARD_CARD_LABELS);
    expect(standardHandRule.cardStrength('2')).toBe(0);
    expect(standardHandRule.cardStrength('J')).toBe(9);
    expect(standardHandRule.cardStrength('A')).toBe(12);
  });

  it('classifies all 7 hand types without joker substitution', () => {
    expect(standardHandRule.classifyHand(parseCardTuple('AAAAA'))).toBe(HandType.FiveOfAKind);
    expect(standardHandRule.classifyHand(parseCardTuple('AA8AA'))).toBe(HandType.FourOfAKind);
    expect(standardHandRule.classifyHand(parseCardTuple('23332'))).toBe(HandType.FullHouse);
    expect(standardHandRule.classifyHand(parseCardTuple('TTT98'))).toBe(HandType.ThreeOfAKind);
    expect(standardHandRule.classifyHand(parseCardTuple('QQQJA'))).toBe(HandType.ThreeOfAKind);
    expect(standardHandRule.classifyHand(parseCardTuple('KTJJT'))).toBe(HandType.TwoPair);
    expect(standardHandRule.classifyHand(parseCardTuple('32T3K'))).toBe(HandType.OnePair);
    expect(standardHandRule.classifyHand(parseCardTuple('23456'))).toBe(HandType.HighCard);
  });
});
