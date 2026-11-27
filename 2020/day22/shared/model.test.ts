import { describe, expect, it } from 'vitest';
import { CombatDecks, MAX_CARD_VALUE, parseCombatDecks, scoreDeck } from './model';

const OFFICIAL_EXAMPLE = [
  'Player 1:',
  '9',
  '2',
  '6',
  '3',
  '1',
  '',
  'Player 2:',
  '5',
  '8',
  '4',
  '7',
  '10',
].join('\n');

describe('scoreDeck', () => {
  it('computes reverse-positional weighted sum and handles empty decks', () => {
    expect(scoreDeck([])).toBe(0);
    expect(scoreDeck([3, 2, 10, 6, 8, 5, 9, 4, 7, 1])).toBe(306);
    expect(scoreDeck([7, 5, 6, 2, 4, 1, 10, 8, 9, 3])).toBe(291);
  });
});

describe('CombatDecks', () => {
  it('freezes decks, exposes totalCards and maxCard getters, and rejects invalid decks', () => {
    const decks = new CombatDecks([9, 2], [5, 10]);
    expect(Object.isFrozen(decks)).toBe(true);
    expect(Object.isFrozen(decks.player1)).toBe(true);
    expect(Object.isFrozen(decks.player2)).toBe(true);
    expect(decks.totalCards).toBe(4);
    expect(decks.maxCard).toBe(10);

    const p1MaxDecks = new CombatDecks([42, 2], [5, 10]);
    expect(p1MaxDecks.maxCard).toBe(42);

    expect(() => new CombatDecks([], [1])).toThrow();
    expect(() => new CombatDecks([1], [])).toThrow();
    expect(() => new CombatDecks([0], [1])).toThrow();
    expect(() => new CombatDecks([1.5], [2])).toThrow();
    expect(() => new CombatDecks([MAX_CARD_VALUE + 1], [1])).toThrow();
    expect(() => new CombatDecks([5, 5], [1])).toThrow();
    expect(() => new CombatDecks([5], [5])).toThrow();
  });
});

describe('parseCombatDecks', () => {
  it('parses the official example and tolerates CRLF and outer blank lines', () => {
    const crlf = `\r\n\r\n${OFFICIAL_EXAMPLE.replace(/\n/g, '\r\n')}\r\n\r\n`;
    const parsed = parseCombatDecks(crlf);
    expect(parsed.player1).toEqual([9, 2, 6, 3, 1]);
    expect(parsed.player2).toEqual([5, 8, 4, 7, 10]);
    expect(parsed.totalCards).toBe(10);
    expect(parsed.maxCard).toBe(10);
  });

  it('rejects empty input, wrong section counts, wrong headers, and non-positive card tokens', () => {
    expect(() => parseCombatDecks('')).toThrow();
    expect(() => parseCombatDecks('Player 1:\n1')).toThrow();
    expect(() => parseCombatDecks('Player 1:\n1\n\nPlayer 2:\n2\n\nPlayer 3:\n3')).toThrow();
    expect(() => parseCombatDecks('Player A:\n1\n\nPlayer 2:\n2')).toThrow();
    expect(() => parseCombatDecks('Player 1:\n1\n\nPlayer B:\n2')).toThrow();
    expect(() => parseCombatDecks('Player 1:\n0\n\nPlayer 2:\n2')).toThrow();
    expect(() => parseCombatDecks('Player 1:\nabc\n\nPlayer 2:\n2')).toThrow();
    expect(() => parseCombatDecks('Player 1:\n1\n\nPlayer 2:\n02')).toThrow();
  });
});
