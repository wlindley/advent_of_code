import { describe, expect, it } from 'vitest';
import { HAND_TYPE_COUNT, HandType, STANDARD_CARD_LABELS, parseCardTuple, type CardTuple } from './cards';
import { CamelHand, RankedHand } from './hand';
import { parseCamelCardsDeal } from './parser';
import {
  classifyFrequencySignature,
  createCardStrengthMap,
  tallyCards,
  type CamelHandRule,
} from './rule';
import {
  CamelCardsTraceFrame,
  DEFAULT_MAX_TRACE_STEPS,
  findFirstFrameForTier,
  ratioBigInt,
  traceCamelCardsDeal,
} from './trace';

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

const EXAMPLE_INPUT = [
  '32T3K 765',
  'T55J5 684',
  'KK677 28',
  'KTJJT 220',
  'QQQJA 483',
].join('\n');

describe('trace and ratioBigInt', () => {
  it('computes exact BigInt-scaled ratios in [0, 1] and rejects negative denominators', () => {
    expect(ratioBigInt(0n, 0n)).toBe(0);
    expect(ratioBigInt(-5n, 100n)).toBe(0);
    expect(ratioBigInt(150n, 100n)).toBe(1);
    expect(ratioBigInt(1n, 2n)).toBe(0.5);
    expect(ratioBigInt(10n ** 30n, 4n * 10n ** 30n)).toBe(0.25);
    expect(() => ratioBigInt(1n, -1n)).toThrow(RangeError);
  });

  it('validates CamelCardsTraceFrame invariants and computes derived getters', () => {
    const h1 = new RankedHand(new CamelHand(parseCardTuple('32T3K'), 765n, 0), RULE, 1);
    const h2 = new RankedHand(new CamelHand(parseCardTuple('KTJJT'), 220n, 3), RULE, 2);
    const counts1 = [0, 1, 0, 0, 0, 0, 0];
    const counts2 = [0, 1, 1, 0, 0, 0, 0];

    const f1 = new CamelCardsTraceFrame(h1, undefined, 2, 765n, counts1);
    expect(Object.isFrozen(f1)).toBe(true);
    expect(Object.isFrozen(f1.cumulativeTierCounts)).toBe(true);
    expect(f1.rank).toBe(1);
    expect(f1.winnings).toBe(765n);
    expect(f1.tieBreakIndex).toBeUndefined();

    const f2 = new CamelCardsTraceFrame(h2, h1, 2, 1205n, counts2);
    expect(f2.rank).toBe(2);
    expect(f2.winnings).toBe(440n);
    expect(f2.tieBreakIndex).toBe(0);

    expect(() => new CamelCardsTraceFrame(h1, undefined, 0, 0n, counts1)).toThrow(RangeError);
    expect(() => new CamelCardsTraceFrame(h1, undefined, 1.5, 0n, counts1)).toThrow(RangeError);
    expect(() => new CamelCardsTraceFrame(h2, h1, 1, 1205n, counts2)).toThrow(RangeError);
    expect(() => new CamelCardsTraceFrame(h1, h1, 2, 765n, counts1)).toThrow(RangeError);
    expect(() => new CamelCardsTraceFrame(h2, undefined, 2, 1205n, counts2)).toThrow(RangeError);
    const h3 = new RankedHand(new CamelHand(parseCardTuple('KK677'), 28n, 2), RULE, 3);
    expect(() => new CamelCardsTraceFrame(h3, h1, 3, 1205n, [0, 1, 2, 0, 0, 0, 0])).toThrow(RangeError);
    expect(() => new CamelCardsTraceFrame(h1, undefined, 2, -1n, counts1)).toThrow(RangeError);
    expect(() => new CamelCardsTraceFrame(h1, undefined, 2, 765n, [1, 0])).toThrow(RangeError);
    expect(() => new CamelCardsTraceFrame(h1, undefined, 2, 765n, [0, -1, 2, 0, 0, 0, 0])).toThrow(RangeError);
    expect(() => new CamelCardsTraceFrame(h1, undefined, 2, 765n, [0, 0.5, 0.5, 0, 0, 0, 0])).toThrow(RangeError);
    expect(() => new CamelCardsTraceFrame(h1, undefined, 2, 765n, [0, 2, 0, 0, 0, 0, 0])).toThrow(RangeError);
  });

  it('produces exact trace frames with full predecessor and bounded sampling', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(200);
    const deal = parseCamelCardsDeal(EXAMPLE_INPUT);
    const full = traceCamelCardsDeal(deal, RULE);
    expect(Object.isFrozen(full)).toBe(true);
    expect(full.length).toBe(5);
    expect(full.map((f) => f.ranked.hand.label)).toEqual([
      '32T3K',
      'KTJJT',
      'KK677',
      'T55J5',
      'QQQJA',
    ]);
    expect(full[2]!.previousRanked?.hand.label).toBe('KTJJT');
    expect(full[2]!.tieBreakIndex).toBe(1);
    expect(full[4]!.runningWinnings).toBe(6440n);
    expect(full[4]!.cumulativeTierCounts.length).toBe(HAND_TYPE_COUNT);
    expect(full[4]!.cumulativeTierCounts).toEqual([0, 1, 2, 2, 0, 0, 0]);

    const sampled = traceCamelCardsDeal(deal, RULE, { maxSteps: 3 });
    expect(sampled.length).toBe(3);
    expect(sampled.map((f) => f.rank)).toEqual([1, 3, 5]);
    expect(sampled[1]!.previousRanked?.rank).toBe(2);
    expect(sampled[2]!.runningWinnings).toBe(6440n);
  });

  it('finds first frame index for a given tier or returns undefined', () => {
    const deal = parseCamelCardsDeal(EXAMPLE_INPUT);
    const frames = traceCamelCardsDeal(deal, RULE);
    expect(findFirstFrameForTier(frames, HandType.OnePair)).toBe(0);
    expect(findFirstFrameForTier(frames, HandType.TwoPair)).toBe(1);
    expect(findFirstFrameForTier(frames, HandType.ThreeOfAKind)).toBe(3);
    expect(findFirstFrameForTier(frames, HandType.FullHouse)).toBeUndefined();
  });
});
