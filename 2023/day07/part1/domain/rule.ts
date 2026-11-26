import {
  STANDARD_CARD_LABELS,
  classifyFrequencySignature,
  createCardStrengthMap,
  tallyCards,
  type CamelHandRule,
  type CardLabel,
  type CardTuple,
  type HandType,
} from '../../shared';

const STANDARD_STRENGTH_MAP = createCardStrengthMap(STANDARD_CARD_LABELS);

/** Part 1 Camel Cards rule: standard card ordering `2..A` with no wildcards. */
export const standardHandRule: CamelHandRule = Object.freeze({
  id: 'part1-standard',
  label: 'Standard Jacks',
  cardOrder: STANDARD_CARD_LABELS,
  wildLabel: null,
  cardStrength(label: CardLabel): number {
    return STANDARD_STRENGTH_MAP.get(label)!;
  },
  classifyHand(cards: CardTuple): HandType {
    const counts = Array.from(tallyCards(cards).values()).sort((a, b) => b - a);
    return classifyFrequencySignature(counts);
  },
});
