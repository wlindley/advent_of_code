import { describe, expect, it } from 'vitest';
import {
  MAX_SAFE_MATCH_COUNT,
  Scratchcard,
  assertCardId,
  assertNumberList,
  parseNumberList,
  parseScratchcard,
  parseScratchcards,
} from './index';

describe('2023 day 04 shared Scratchcard & validators', () => {
  it('validates card IDs and number lists with defensive frozen copies', () => {
    expect(MAX_SAFE_MATCH_COUNT).toBe(53);
    expect(assertCardId(1)).toBe(1);
    expect(assertCardId(42)).toBe(42);

    const src = [0, 7, 19];
    const frozen = assertNumberList(src, 'winning');
    src[0] = 999;
    expect(frozen).toEqual([0, 7, 19]);
    expect(Object.isFrozen(frozen)).toBe(true);
  });

  it('rejects each invalid card ID separately with RangeError', () => {
    expect(() => assertCardId(0)).toThrow(RangeError);
    expect(() => assertCardId(-3)).toThrow(RangeError);
    expect(() => assertCardId(1.5)).toThrow(RangeError);
    expect(() => assertCardId(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
    expect(() => new Scratchcard(0, [1], [1])).toThrow(RangeError);
  });

  it('rejects each invalid number list case separately with RangeError', () => {
    expect(() => assertNumberList([], 'empty')).toThrow(RangeError);
    expect(() => assertNumberList([-1], 'neg')).toThrow(RangeError);
    expect(() => assertNumberList([2.5], 'float')).toThrow(RangeError);
    expect(() => assertNumberList([Number.MAX_SAFE_INTEGER + 1], 'unsafe')).toThrow(RangeError);
    expect(() => new Scratchcard(1, [], [1])).toThrow(RangeError);
    expect(() => new Scratchcard(1, [1], [])).toThrow(RangeError);
  });

  it('computes dynamic matchingNumbers, matchCount, and points for k = 0, 1, 4, 32, 53, 54', () => {
    const k0 = new Scratchcard(1, [10, 20], [1, 2]);
    expect(Object.isFrozen(k0)).toBe(true);
    expect(Object.isFrozen(k0.winningNumbers)).toBe(true);
    expect(Object.isFrozen(k0.ownedNumbers)).toBe(true);
    expect(Object.isFrozen(k0.matchingNumbers)).toBe(true);
    expect(k0.matchingNumbers).toEqual([]);
    expect(k0.matchCount).toBe(0);
    expect(k0.points).toBe(0);

    const k1 = new Scratchcard(2, [5, 8], [1, 8, 9]);
    expect(k1.matchingNumbers).toEqual([8]);
    expect(k1.matchCount).toBe(1);
    expect(k1.points).toBe(1);

    const k4 = new Scratchcard(3, [41, 48, 83, 86, 17], [83, 86, 6, 31, 17, 9, 48, 53]);
    expect(k4.matchingNumbers).toEqual([83, 86, 17, 48]);
    expect(k4.matchCount).toBe(4);
    expect(k4.points).toBe(8);

    const seq32 = Array.from({ length: 32 }, (_, i) => i + 1);
    const k32 = new Scratchcard(4, seq32, seq32);
    expect(k32.matchCount).toBe(32);
    expect(k32.points).toBe(2147483648);

    const seq53 = Array.from({ length: 53 }, (_, i) => i + 1);
    const k53 = new Scratchcard(5, seq53, seq53);
    expect(k53.matchCount).toBe(53);
    expect(k53.points).toBe(2 ** 52);

    const seq54 = Array.from({ length: 54 }, (_, i) => i + 1);
    const k54 = new Scratchcard(6, seq54, seq54);
    expect(k54.matchCount).toBe(54);
    expect(() => k54.points).toThrow(RangeError);
  });

  it('deduplicates winning numbers via Set and preserves owned-list order', () => {
    const card = new Scratchcard(7, [12, 7, 12, 30], [30, 5, 7, 99, 12]);
    expect(card.matchingNumbers).toEqual([30, 7, 12]);
    expect(card.matchCount).toBe(3);
    expect(card.points).toBe(4);
  });
});

describe('2023 day 04 shared parser', () => {
  it('parses column-aligned multi-space cards and CRLF multiline inputs into frozen arrays', () => {
    const single = parseScratchcard('Card   1:  41 48  83 |  83  86  6  31');
    expect(single.id).toBe(1);
    expect(single.winningNumbers).toEqual([41, 48, 83]);
    expect(single.ownedNumbers).toEqual([83, 86, 6, 31]);

    const list = parseNumberList('  0  12   99 ', 'sample');
    expect(Object.isFrozen(list)).toBe(true);
    expect(list).toEqual([0, 12, 99]);

    const cards = parseScratchcards('Card  1:  1  2 |  2  3\r\nCard 10: 10 20 | 30 10\r\n');
    expect(Object.isFrozen(cards)).toBe(true);
    expect(cards).toHaveLength(2);
    expect(cards[0]!.points).toBe(1);
    expect(cards[1]!.id).toBe(10);
  });

  it('rejects each invalid parser case separately', () => {
    expect(() => parseNumberList('   ', 'winning')).toThrow(SyntaxError);
    expect(() => parseNumberList('12 abc 4', 'owned')).toThrow(SyntaxError);
    expect(() => parseNumberList('12 -4', 'owned')).toThrow(SyntaxError);

    expect(() => parseScratchcard('')).toThrow(SyntaxError);
    expect(() => parseScratchcard('Game 1: 1 2 | 3 4')).toThrow(SyntaxError);
    expect(() => parseScratchcard('Card x: 1 | 2')).toThrow(SyntaxError);
    expect(() => parseScratchcard('Card 1: 1 2 3')).toThrow(SyntaxError);
    expect(() => parseScratchcard('Card 1: 1 | 2 | 3')).toThrow(SyntaxError);
    expect(() => parseScratchcard('Card 1:   | 2 3')).toThrow(SyntaxError);
    expect(() => parseScratchcard('Card 1: 1 2 |   ')).toThrow(SyntaxError);
    expect(() => parseScratchcard('Card 0: 1 | 2')).toThrow(RangeError);

    expect(() => parseScratchcards('')).toThrow(SyntaxError);
    expect(() => parseScratchcards('  \r\n  ')).toThrow(SyntaxError);
  });
});
