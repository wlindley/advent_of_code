import { describe, expect, it } from 'vitest';
import { CubeBag, parseGameLine, parseGames } from './index';

describe('parseGameLine', () => {
  it('parses valid game lines with multiple reveals and arbitrary whitespace', () => {
    const game = parseGameLine('  Game 3: 8 green, 6 blue, 20 red; 5 blue, 4 red, 13 green; 5 green, 1 red  ');
    expect(game.id).toBe(3);
    expect(game.reveals).toEqual([
      new CubeBag(20, 8, 6),
      new CubeBag(4, 13, 5),
      new CubeBag(1, 5, 0),
    ]);

    const zeroGame = parseGameLine('Game 42: 0 red');
    expect(zeroGame.id).toBe(42);
    expect(zeroGame.reveals).toEqual([CubeBag.EMPTY]);
  });

  it('rejects malformed game headers and invalid IDs', () => {
    expect(() => parseGameLine('1: 3 red')).toThrow(SyntaxError);
    expect(() => parseGameLine('Game abc: 3 red')).toThrow(SyntaxError);
    expect(() => parseGameLine('Game 1:   ')).toThrow(SyntaxError);
    expect(() => parseGameLine('Game 0: 1 red')).toThrow(RangeError);
    expect(() => parseGameLine('Game 99999999999999999999: 1 red')).toThrow(RangeError);
  });

  it('rejects blank segments, duplicate colors, invalid clauses, unknown colors, and unsafe counts', () => {
    expect(() => parseGameLine('Game 1: 1 red; ; 2 blue')).toThrow(SyntaxError);
    expect(() => parseGameLine('Game 1: 1 red; ')).toThrow(SyntaxError);
    expect(() => parseGameLine('Game 1: 2 red, 3 red')).toThrow(SyntaxError);
    expect(() => parseGameLine('Game 1: red')).toThrow(SyntaxError);
    expect(() => parseGameLine('Game 1: -2 red')).toThrow(SyntaxError);
    expect(() => parseGameLine('Game 1: 2 red blue')).toThrow(SyntaxError);
    expect(() => parseGameLine('Game 1: 2 yellow')).toThrow(SyntaxError);
    expect(() => parseGameLine('Game 1: 99999999999999999999 red')).toThrow(RangeError);
  });
});

describe('parseGames', () => {
  it('parses LF and CRLF inputs into a frozen array of GameRecord', () => {
    const games = parseGames('\nGame 1: 3 blue, 4 red; 1 red, 2 green\r\nGame 2: 2 green\n');
    expect(Object.isFrozen(games)).toBe(true);
    expect(games).toHaveLength(2);
    expect(games[0]?.id).toBe(1);
    expect(games[1]?.id).toBe(2);
  });

  it('rejects empty or whitespace-only input', () => {
    expect(() => parseGames('')).toThrow(SyntaxError);
    expect(() => parseGames('   \n\t  ')).toThrow(SyntaxError);
  });
});
