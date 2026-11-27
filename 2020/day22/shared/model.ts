export type PlayerId = 1 | 2;

export const MAX_CARD_VALUE = 0x7fffffff;

const CARD_TOKEN_RE = /^[1-9]\d*$/;

/** Scores a player's deck using reverse-positional card weights (bottom * 1 .. top * N). */
export function scoreDeck(deck: readonly number[]): number {
  let total = 0;
  const len = deck.length;
  for (let i = 0; i < len; i += 1) {
    total += deck[i]! * (len - i);
  }
  return total;
}

function validateDeckCards(cards: readonly number[], seen: Set<number>): void {
  for (const card of cards) {
    if (!Number.isInteger(card) || card < 1 || card > MAX_CARD_VALUE) {
      throw new RangeError(`Card value must be an integer in [1, ${MAX_CARD_VALUE}], got ${card}`);
    }
    if (seen.has(card)) {
      throw new Error(`Duplicate card value ${card}`);
    }
    seen.add(card);
  }
}

/** Immutable validated starting decks for a two-player Crab Combat game. */
export class CombatDecks {
  readonly player1: readonly number[];
  readonly player2: readonly number[];

  constructor(player1: readonly number[], player2: readonly number[]) {
    if (player1.length === 0 || player2.length === 0) {
      throw new Error('Both players must have at least one card.');
    }
    const seen = new Set<number>();
    validateDeckCards(player1, seen);
    validateDeckCards(player2, seen);
    this.player1 = Object.freeze([...player1]);
    this.player2 = Object.freeze([...player2]);
    Object.freeze(this);
  }

  get totalCards(): number {
    return this.player1.length + this.player2.length;
  }

  get maxCard(): number {
    let max = 0;
    for (const card of this.player1) {
      if (card > max) max = card;
    }
    for (const card of this.player2) {
      if (card > max) max = card;
    }
    return max;
  }
}

function parseDeckSection(section: string, expectedHeader: string): number[] {
  const lines = section.split('\n').map((line) => line.trim());
  if (lines[0] !== expectedHeader) {
    throw new Error(`Expected section header "${expectedHeader}", got "${lines[0]}"`);
  }
  const cards: number[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const token = lines[i]!;
    if (!CARD_TOKEN_RE.test(token)) {
      throw new Error(`Invalid card token "${token}" in ${expectedHeader}`);
    }
    cards.push(Number(token));
  }
  return cards;
}

/** Parses two-player Crab Combat starting decks from puzzle input text. */
export function parseCombatDecks(raw: string): CombatDecks {
  const normalized = raw.replace(/\r\n?/g, '\n').trim();
  if (normalized.length === 0) {
    throw new Error('Combat input must not be empty.');
  }
  const sections = normalized.split(/\n\s*\n/);
  if (sections.length !== 2) {
    throw new Error(`Expected exactly 2 player sections, got ${sections.length}`);
  }
  const p1 = parseDeckSection(sections[0]!, 'Player 1:');
  const p2 = parseDeckSection(sections[1]!, 'Player 2:');
  return new CombatDecks(p1, p2);
}
