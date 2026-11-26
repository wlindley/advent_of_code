import { describe, expect, it } from 'vitest';
import { CUBE_COLORS, CubeBag, GameRecord, isCubeColor } from './index';

describe('CUBE_COLORS and isCubeColor', () => {
  it('defines frozen primary cube colors and validates color strings', () => {
    expect(CUBE_COLORS).toEqual(['red', 'green', 'blue']);
    expect(Object.isFrozen(CUBE_COLORS)).toBe(true);
    expect(isCubeColor('red')).toBe(true);
    expect(isCubeColor('green')).toBe(true);
    expect(isCubeColor('blue')).toBe(true);
    expect(isCubeColor('yellow')).toBe(false);
    expect(isCubeColor('')).toBe(false);
    expect(isCubeColor('RED')).toBe(false);
  });
});

describe('CubeBag', () => {
  it('constructs frozen bags, exposes EMPTY, and computes dynamic power', () => {
    expect(Object.isFrozen(CubeBag.EMPTY)).toBe(true);
    expect(CubeBag.EMPTY.red).toBe(0);
    expect(CubeBag.EMPTY.green).toBe(0);
    expect(CubeBag.EMPTY.blue).toBe(0);
    expect(CubeBag.EMPTY.power).toBe(0);

    const bag = new CubeBag(4, 2, 6);
    expect(Object.isFrozen(bag)).toBe(true);
    expect(bag.power).toBe(48);
  });

  it('rejects negative and non-safe-integer cube counts', () => {
    expect(() => new CubeBag(-1, 0, 0)).toThrow(RangeError);
    expect(() => new CubeBag(0, -2, 0)).toThrow(RangeError);
    expect(() => new CubeBag(0, 0, -3)).toThrow(RangeError);
    expect(() => new CubeBag(1.5, 0, 0)).toThrow(RangeError);
    expect(() => new CubeBag(0, Number.NaN, 0)).toThrow(RangeError);
    expect(() => new CubeBag(0, 0, Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => new CubeBag(Number.MAX_SAFE_INTEGER + 1, 0, 0)).toThrow(RangeError);
  });

  it('checks fitsWithin across all short-circuit branches', () => {
    const limits = new CubeBag(12, 13, 14);
    expect(new CubeBag(12, 13, 14).fitsWithin(limits)).toBe(true);
    expect(new CubeBag(1, 2, 3).fitsWithin(limits)).toBe(true);
    expect(new CubeBag(13, 13, 14).fitsWithin(limits)).toBe(false);
    expect(new CubeBag(12, 14, 14).fitsWithin(limits)).toBe(false);
    expect(new CubeBag(12, 13, 15).fitsWithin(limits)).toBe(false);
  });

  it('computes component-wise maxWith and frozen exceededColors', () => {
    const a = new CubeBag(4, 15, 6);
    const b = new CubeBag(13, 8, 14);
    const merged = a.maxWith(b);
    expect(Object.isFrozen(merged)).toBe(true);
    expect(merged).toEqual(new CubeBag(13, 15, 14));

    const limits = new CubeBag(12, 13, 14);
    expect(new CubeBag(12, 13, 14).exceededColors(limits)).toEqual([]);
    const exceeded = new CubeBag(13, 10, 15).exceededColors(limits);
    expect(Object.isFrozen(exceeded)).toBe(true);
    expect(exceeded).toEqual(['red', 'blue']);
    expect(new CubeBag(13, 14, 15).exceededColors(limits)).toEqual(['red', 'green', 'blue']);
  });
});

describe('GameRecord', () => {
  it('stores frozen id and defensive frozen reveals, deriving minimumBag and possibility', () => {
    const rawReveals = [new CubeBag(4, 0, 3), new CubeBag(1, 2, 6), new CubeBag(0, 2, 0)];
    const game = new GameRecord(1, rawReveals);
    rawReveals.push(new CubeBag(99, 99, 99));

    expect(Object.isFrozen(game)).toBe(true);
    expect(Object.isFrozen(game.reveals)).toBe(true);
    expect(game.id).toBe(1);
    expect(game.reveals).toHaveLength(3);
    expect(game.minimumBag).toEqual(new CubeBag(4, 2, 6));
    expect(game.isPossibleWith(new CubeBag(12, 13, 14))).toBe(true);
    expect(game.isPossibleWith(new CubeBag(3, 13, 14))).toBe(false);
  });

  it('rejects non-positive/unsafe game IDs and empty reveal lists', () => {
    const validReveal = [new CubeBag(1, 0, 0)];
    expect(() => new GameRecord(0, validReveal)).toThrow(RangeError);
    expect(() => new GameRecord(-5, validReveal)).toThrow(RangeError);
    expect(() => new GameRecord(1.5, validReveal)).toThrow(RangeError);
    expect(() => new GameRecord(Number.MAX_SAFE_INTEGER + 1, validReveal)).toThrow(RangeError);
    expect(() => new GameRecord(1, [])).toThrow(RangeError);
  });
});
