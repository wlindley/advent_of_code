import {
  HandType,
  classifyFrequencySignature,
  createCardStrengthMap,
  tallyCards,
  type CamelHandRule,
  type CardLabel,
  type CardTuple,
} from '../../shared';

export const JOKER_CARD_ORDER = Object.freeze([
  'J', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'Q', 'K', 'A',
] as const);

const JOKER_STRENGTH_MAP = createCardStrengthMap(JOKER_CARD_ORDER);

function compareDesc(a: number, b: number): number {
  return b - a;
}

/** Classifies a 5-card hand by adding `'J'` wildcards to the largest non-joker group. */
export function classifyJokerHand(cards: CardTuple): HandType {
  const counts = tallyCards(cards);
  const jokers = counts.get('J') ?? 0;
  const nonJokerCounts: number[] = [];
  for (const [label, count] of counts) {
    if (label !== 'J') nonJokerCounts.push(count);
  }
  if (nonJokerCounts.length === 0) return HandType.FiveOfAKind;
  nonJokerCounts.sort(compareDesc);
  nonJokerCounts[0] = nonJokerCounts[0]! + jokers;
  return classifyFrequencySignature(nonJokerCounts);
}

/** Part 2 Camel Cards rule: `'J'` is wild for hand classification and weakest (`0`) in tie-breaks. */
export const jokerHandRule: CamelHandRule = Object.freeze({
  id: 'part2-jokers',
  label: 'Wild Jokers',
  cardOrder: JOKER_CARD_ORDER,
  wildLabel: 'J',
  cardStrength(label: CardLabel): number {
    return JOKER_STRENGTH_MAP.get(label)!;
  },
  classifyHand: classifyJokerHand,
});
