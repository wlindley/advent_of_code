import { describe, expect, it } from 'vitest';
import { parseDiracDice } from './parser';
import { DiracDiceInput } from './types';

describe('parseDiracDice', () => {
  it('parses valid 2-line starting positions with CRLF and outer blank lines', () => {
    const raw = '\r\n  Player 1 starting position: 4  \r\nPlayer 2 starting position: 8\r\n\r\n';
    const parsed = parseDiracDice(raw);
    expect(parsed).toBeInstanceOf(DiracDiceInput);
    expect(parsed.player1).toBe(4);
    expect(parsed.player2).toBe(8);
    expect(Object.isFrozen(parsed)).toBe(true);
  });

  it('rejects empty or wrong line counts', () => {
    expect(() => parseDiracDice('')).toThrow(/2/);
    expect(() => parseDiracDice('Player 1 starting position: 4')).toThrow(/2/);
    expect(() =>
      parseDiracDice(
        'Player 1 starting position: 4\nPlayer 2 starting position: 8\nPlayer 3 starting position: 1',
      ),
    ).toThrow(/2/);
  });

  it('rejects malformed prefixes or missing values', () => {
    expect(() =>
      parseDiracDice('Player 2 starting position: 4\nPlayer 2 starting position: 8'),
    ).toThrow(/player 1/i);
    expect(() =>
      parseDiracDice('Player 1 starting position: 4\nPlayer X starting position: 8'),
    ).toThrow(/player 2/i);
    expect(() =>
      parseDiracDice('Player 1 starting position:   \nPlayer 2 starting position: 8'),
    ).toThrow(/missing/i);
  });

  it('delegates [1..10] integer validation to DiracDiceInput', () => {
    expect(() =>
      parseDiracDice('Player 1 starting position: 0\nPlayer 2 starting position: 8'),
    ).toThrow(RangeError);
    expect(() =>
      parseDiracDice('Player 1 starting position: 4\nPlayer 2 starting position: 11'),
    ).toThrow(RangeError);
    expect(() =>
      parseDiracDice('Player 1 starting position: 4.5\nPlayer 2 starting position: 8'),
    ).toThrow(RangeError);
    expect(() =>
      parseDiracDice('Player 1 starting position: abc\nPlayer 2 starting position: 8'),
    ).toThrow(RangeError);
  });
});
