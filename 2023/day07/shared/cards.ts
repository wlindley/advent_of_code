export const HAND_SIZE = 5;
export const HAND_TYPE_COUNT = 7;

export const STANDARD_CARD_LABELS = Object.freeze([
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'T',
  'J',
  'Q',
  'K',
  'A',
] as const);

export type CardLabel = (typeof STANDARD_CARD_LABELS)[number];
export type CardTuple = readonly [CardLabel, CardLabel, CardLabel, CardLabel, CardLabel];

const CARD_LABEL_SET: ReadonlySet<string> = new Set(STANDARD_CARD_LABELS);

export const HandType = Object.freeze({
  HighCard: 0,
  OnePair: 1,
  TwoPair: 2,
  ThreeOfAKind: 3,
  FullHouse: 4,
  FourOfAKind: 5,
  FiveOfAKind: 6,
} as const);

export type HandType = (typeof HandType)[keyof typeof HandType];

export const HAND_TYPE_ORDER: readonly HandType[] = Object.freeze([
  HandType.HighCard,
  HandType.OnePair,
  HandType.TwoPair,
  HandType.ThreeOfAKind,
  HandType.FullHouse,
  HandType.FourOfAKind,
  HandType.FiveOfAKind,
]);

export const HAND_TYPE_LABELS: Readonly<Record<HandType, string>> = Object.freeze({
  [HandType.HighCard]: 'High Card',
  [HandType.OnePair]: 'One Pair',
  [HandType.TwoPair]: 'Two Pair',
  [HandType.ThreeOfAKind]: 'Three of a Kind',
  [HandType.FullHouse]: 'Full House',
  [HandType.FourOfAKind]: 'Four of a Kind',
  [HandType.FiveOfAKind]: 'Five of a Kind',
});

/** Type guard verifying that `value` is one of the 13 valid Camel Cards labels. */
export function isCardLabel(value: string): value is CardLabel {
  return CARD_LABEL_SET.has(value);
}

/** Parses a 5-character hand token into a frozen `CardTuple`. */
export function parseCardTuple(raw: string): CardTuple {
  if (raw.length !== HAND_SIZE) {
    throw new RangeError(`Expected ${HAND_SIZE} cards, got "${raw}" (length ${raw.length})`);
  }
  const parsed: CardLabel[] = [];
  for (let i = 0; i < HAND_SIZE; i += 1) {
    const ch = raw[i]!;
    if (!isCardLabel(ch)) {
      throw new RangeError(`Invalid card label "${ch}" in hand "${raw}"`);
    }
    parsed.push(ch);
  }
  return Object.freeze([parsed[0]!, parsed[1]!, parsed[2]!, parsed[3]!, parsed[4]!] as const);
}
