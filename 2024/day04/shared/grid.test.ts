import { describe, expect, it } from 'vitest';
import { DIRS_8, Grid2D } from '../../../shared/core';
import { WordSearchGrid, parseWordSearch } from './index';

describe('WordSearchGrid and parseWordSearch', () => {
  it('parses LF, CRLF, trailing blank lines, A-Z, and dots into a frozen grid', () => {
    const grid = parseWordSearch('X.M\r\nA.S\r\n\r\n');
    expect(Object.isFrozen(grid)).toBe(true);
    expect(grid.rows).toBe(2);
    expect(grid.cols).toBe(3);
    expect(grid.size).toBe(6);
    expect(grid.at(0, 0)).toBe('X');
    expect(grid.at(0, 1)).toBe('.');
    expect(grid.at(1, 2)).toBe('S');
    expect(grid.inBounds(0, 0)).toBe(true);
    expect(grid.inBounds(-1, 0)).toBe(false);
    expect(grid.inBounds(2, 0)).toBe(false);
  });

  it('rejects empty, ragged, lowercase, space, and digit inputs', () => {
    expect(() => parseWordSearch('')).toThrow();
    expect(() => parseWordSearch('XM\nA')).toThrow();
    expect(() => parseWordSearch('xM\nAS')).toThrow();
    expect(() => parseWordSearch('X M\nA.S')).toThrow();
    expect(() => parseWordSearch('X1M\nA.S')).toThrow();
    expect(() => parseWordSearch('X[M\nA.S')).toThrow();
  });

  it('rejects multi-char or empty cells in direct constructor', () => {
    expect(() => new WordSearchGrid(new Grid2D(1, 1, ['AB']))).toThrow();
    expect(() => new WordSearchGrid(new Grid2D(1, 1, ['']))).toThrow();
  });

  it('throws RangeError when reading out of bounds', () => {
    const grid = parseWordSearch('XM\nAS');
    expect(() => grid.at(-1, 0)).toThrow(RangeError);
    expect(() => grid.at(0, 2)).toThrow(RangeError);
  });

  it('matches words in all 8 directions around a central cell', () => {
    const grid = parseWordSearch([
      'S..S..S',
      '.A.A.A.',
      '..MMM..',
      'SAMXMAS',
      '..MMM..',
      '.A.A.A.',
      'S..S..S',
    ].join('\n'));
    for (const [dr, dc] of DIRS_8) {
      expect(grid.matchesAt(3, 3, dr, dc, 'XMAS')).toBe(true);
    }
  });

  it('handles 1-char words, mismatches, and out-of-bounds starts or ends', () => {
    const grid = parseWordSearch('XMAS\n....');
    expect(grid.matchesAt(0, 0, 0, 1, 'X')).toBe(true);
    expect(grid.matchesAt(0, 0, 0, 1, 'M')).toBe(false);
    expect(grid.matchesAt(0, 0, 0, 1, 'XMAM')).toBe(false);
    expect(grid.matchesAt(-1, 0, 0, 1, 'X')).toBe(false);
    expect(grid.matchesAt(0, 1, 0, 1, 'XMAS')).toBe(false);
  });

  it('throws RangeError for empty word or invalid direction deltas', () => {
    const grid = parseWordSearch('XMAS');
    expect(() => grid.matchesAt(0, 0, 0, 1, '')).toThrow(RangeError);
    expect(() => grid.matchesAt(0, 0, 0, 0, 'X')).toThrow(RangeError);
    expect(() => grid.matchesAt(0, 0, 0.5, 1, 'X')).toThrow(RangeError);
    expect(() => grid.matchesAt(0, 0, 0, 1.5, 'X')).toThrow(RangeError);
  });
});
