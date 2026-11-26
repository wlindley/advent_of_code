import { describe, expect, it } from 'vitest';
import {
  HAND_SIZE,
  HAND_TYPE_COUNT,
  HAND_TYPE_LABELS,
  HAND_TYPE_ORDER,
  HandType,
  STANDARD_CARD_LABELS,
  isCardLabel,
  parseCardTuple,
} from './cards';

describe('cards primitives', () => {
  it('defines frozen standard card labels and hand type constants', () => {
    expect(HAND_SIZE).toBe(5);
    expect(HAND_TYPE_COUNT).toBe(7);
    expect(Object.isFrozen(STANDARD_CARD_LABELS)).toBe(true);
    expect(STANDARD_CARD_LABELS).toEqual([
      '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A',
    ]);
    expect(Object.isFrozen(HandType)).toBe(true);
    expect(Object.isFrozen(HAND_TYPE_ORDER)).toBe(true);
    expect(HAND_TYPE_ORDER).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(Object.isFrozen(HAND_TYPE_LABELS)).toBe(true);
    expect(HAND_TYPE_LABELS[HandType.FiveOfAKind]).toBe('Five of a Kind');
    expect(HAND_TYPE_LABELS[HandType.HighCard]).toBe('High Card');
  });

  it('validates single card labels', () => {
    for (const label of STANDARD_CARD_LABELS) {
      expect(isCardLabel(label)).toBe(true);
    }
    expect(isCardLabel('1')).toBe(false);
    expect(isCardLabel('X')).toBe(false);
    expect(isCardLabel('')).toBe(false);
    expect(isCardLabel('AA')).toBe(false);
  });

  it('parses a 5-character card string into a frozen CardTuple', () => {
    const tuple = parseCardTuple('32T3K');
    expect(tuple).toEqual(['3', '2', 'T', '3', 'K']);
    expect(Object.isFrozen(tuple)).toBe(true);
  });

  it('rejects card strings whose length is not 5', () => {
    expect(() => parseCardTuple('')).toThrow(RangeError);
    expect(() => parseCardTuple('32T3')).toThrow(RangeError);
    expect(() => parseCardTuple('32T3KA')).toThrow(RangeError);
  });

  it('rejects card strings containing invalid labels', () => {
    expect(() => parseCardTuple('32X3K')).toThrow(RangeError);
    expect(() => parseCardTuple('12345')).toThrow(RangeError);
  });
});
