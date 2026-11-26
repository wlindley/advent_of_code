import {
  HAND_SIZE,
  HandType,
  STANDARD_CARD_LABELS,
  isCardLabel,
  type CardLabel,
  type CardTuple,
} from './cards';

export interface CamelHandRule {
  readonly id: string;
  readonly label: string;
  readonly cardOrder: readonly CardLabel[];
  readonly wildLabel: CardLabel | null;
  cardStrength(label: CardLabel): number;
  classifyHand(cards: CardTuple): HandType;
}

const SIGNATURE_TO_HAND_TYPE: ReadonlyMap<string, HandType> = new Map([
  ['5', HandType.FiveOfAKind],
  ['4,1', HandType.FourOfAKind],
  ['3,2', HandType.FullHouse],
  ['3,1,1', HandType.ThreeOfAKind],
  ['2,2,1', HandType.TwoPair],
  ['2,1,1,1', HandType.OnePair],
  ['1,1,1,1,1', HandType.HighCard],
]);

/** Validates a 13-card permutation of `STANDARD_CARD_LABELS` and maps each label to `0..12`. */
export function createCardStrengthMap(
  cardOrder: readonly CardLabel[],
): ReadonlyMap<CardLabel, number> {
  if (cardOrder.length !== STANDARD_CARD_LABELS.length) {
    throw new RangeError(`Expected ${STANDARD_CARD_LABELS.length} cards, got ${cardOrder.length}`);
  }
  const map = new Map<CardLabel, number>();
  for (let i = 0; i < cardOrder.length; i += 1) {
    const label = cardOrder[i]!;
    if (!isCardLabel(label) || map.has(label)) {
      throw new RangeError(`Invalid or duplicate card label "${label}" in cardOrder`);
    }
    map.set(label, i);
  }
  return map;
}

/** Counts occurrences of each card label present in a 5-card hand. */
export function tallyCards(cards: CardTuple): ReadonlyMap<CardLabel, number> {
  const counts = new Map<CardLabel, number>();
  for (const card of cards) {
    counts.set(card, (counts.get(card) ?? 0) + 1);
  }
  return counts;
}

/** Maps a descending frequency signature (e.g., `[3, 2]`) to its `HandType`. */
export function classifyFrequencySignature(sortedDescCounts: readonly number[]): HandType {
  const key = sortedDescCounts.join(',');
  const handType = SIGNATURE_TO_HAND_TYPE.get(key);
  if (handType === undefined) {
    throw new RangeError(`Invalid hand frequency signature "${key}"`);
  }
  return handType;
}

/** Packs hand type and 5 nibble card strengths into a 24-bit sortable integer key. */
export function packHandStrengthKey(cards: CardTuple, rule: CamelHandRule): number {
  let packed: number = rule.classifyHand(cards);
  for (let i = 0; i < HAND_SIZE; i += 1) {
    const strength = rule.cardStrength(cards[i]!);
    if (!Number.isInteger(strength) || strength < 0 || strength > 12) {
      throw new RangeError(`Card strength must be an integer in [0, 12], got ${strength}`);
    }
    packed = (packed << 4) | strength;
  }
  return packed;
}

/** Formats a packed 24-bit hand strength key as `0xXXXXXX`. */
export function formatStrengthKeyHex(key: number): string {
  if (!Number.isInteger(key) || key < 0 || key > 0x6ccccc) {
    throw new RangeError(`Strength key must be an integer in [0, 0x6CCCCC], got ${key}`);
  }
  return `0x${key.toString(16).toUpperCase().padStart(6, '0')}`;
}

/** Returns the first card index `[0..4]` where two hands differ, or `undefined` if identical. */
export function findTieBreakIndex(prev: CardTuple, curr: CardTuple): number | undefined {
  for (let i = 0; i < HAND_SIZE; i += 1) {
    if (prev[i] !== curr[i]) return i;
  }
  return undefined;
}
