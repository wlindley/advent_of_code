import { describe, expect, it } from 'vitest';
import { TARGET_WORD, WordMatch } from './match';

describe('WordMatch', () => {
  it('constructs a frozen value object with dynamic endRow, endCol, and frozen cells', () => {
    const match = new WordMatch(3, 5, -1, -1, TARGET_WORD.length);
    expect(Object.isFrozen(match)).toBe(true);
    expect(match.row).toBe(3);
    expect(match.col).toBe(5);
    expect(match.dr).toBe(-1);
    expect(match.dc).toBe(-1);
    expect(match.length).toBe(4);
    expect(match.endRow).toBe(0);
    expect(match.endCol).toBe(2);

    const cells = match.cells;
    expect(Object.isFrozen(cells)).toBe(true);
    expect(cells.every((cell) => Object.isFrozen(cell))).toBe(true);
    expect(cells).toEqual([
      { row: 3, col: 5 },
      { row: 2, col: 4 },
      { row: 1, col: 3 },
      { row: 0, col: 2 },
    ]);
  });

  it('supports length 1 matches', () => {
    const match = new WordMatch(0, 0, 0, 1, 1);
    expect(match.endRow).toBe(0);
    expect(match.endCol).toBe(0);
    expect(match.cells).toEqual([{ row: 0, col: 0 }]);
  });

  it('rejects negative or non-integer row and col', () => {
    expect(() => new WordMatch(-1, 0, 0, 1, 4)).toThrow(RangeError);
    expect(() => new WordMatch(0.5, 0, 0, 1, 4)).toThrow(RangeError);
    expect(() => new WordMatch(0, -1, 0, 1, 4)).toThrow(RangeError);
    expect(() => new WordMatch(0, 1.5, 0, 1, 4)).toThrow(RangeError);
  });

  it('rejects non-unit, non-integer, or zero direction deltas', () => {
    expect(() => new WordMatch(0, 0, 0, 0, 4)).toThrow(RangeError);
    expect(() => new WordMatch(0, 0, 2, 0, 4)).toThrow(RangeError);
    expect(() => new WordMatch(0, 0, 0, -2, 4)).toThrow(RangeError);
    expect(() => new WordMatch(0, 0, 0.5, 1, 4)).toThrow(RangeError);
  });

  it('rejects non-positive or non-integer length', () => {
    expect(() => new WordMatch(0, 0, 0, 1, 0)).toThrow(RangeError);
    expect(() => new WordMatch(0, 0, 0, 1, -2)).toThrow(RangeError);
    expect(() => new WordMatch(0, 0, 0, 1, 2.5)).toThrow(RangeError);
  });

  it('rejects matches whose endpoint has negative row or col', () => {
    expect(() => new WordMatch(2, 3, -1, 0, 4)).toThrow(RangeError);
    expect(() => new WordMatch(3, 2, 0, -1, 4)).toThrow(RangeError);
  });
});
