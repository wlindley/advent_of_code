import { describe, expect, it } from 'vitest';
import { DIRS_4, DIRS_8, Grid2D } from './index';

describe('Grid2D & direction constants', () => {
  it('exposes frozen 4-way and 8-way direction deltas', () => {
    expect(DIRS_4).toHaveLength(4);
    expect(Object.isFrozen(DIRS_4)).toBe(true);
    expect(DIRS_8).toHaveLength(8);
    expect(Object.isFrozen(DIRS_8)).toBe(true);
    expect(DIRS_8).not.toContainEqual([0, 0]);
  });

  it('validates constructor dimensions, cell count, and defensively copies cells', () => {
    const source = ['a', 'b', 'c', 'd', 'e', 'f'];
    const grid = new Grid2D(2, 3, source);
    source[0] = 'Z';

    expect(grid.rows).toBe(2);
    expect(grid.cols).toBe(3);
    expect(grid.size).toBe(6);
    expect(grid.at(0, 0)).toBe('a');
    expect(grid.at(1, 2)).toBe('f');

    for (const bad of [0, -1, 1.5, Number.NaN]) {
      expect(() => new Grid2D(bad, 2, [])).toThrow(RangeError);
      expect(() => new Grid2D(2, bad, [])).toThrow(RangeError);
    }
    expect(() => new Grid2D(2, 2, [1, 2, 3])).toThrow(RangeError);
    expect(() => new Grid2D(2, 2, [1, 2, 3, 4, 5])).toThrow(RangeError);
  });

  it('parses LF and CRLF inputs while preserving meaningful leading/trailing spaces', () => {
    const lf = Grid2D.fromLines(' @ \n@.@\n', (ch, r, c) => `${ch}:${r},${c}`);
    expect(lf.rows).toBe(2);
    expect(lf.cols).toBe(3);
    expect(lf.at(0, 0)).toBe(' :0,0');
    expect(lf.at(0, 1)).toBe('@:0,1');
    expect(lf.at(0, 2)).toBe(' :0,2');
    expect(lf.at(1, 1)).toBe('.:1,1');

    const crlf = Grid2D.fromLines('ab\r\ncd\r\n\r\n', (ch) => ch);
    expect(crlf.rows).toBe(2);
    expect(crlf.cols).toBe(2);
    expect(crlf.at(1, 0)).toBe('c');
  });

  it('rejects empty, newline-only, leading-blank, blank-internal, and jagged inputs', () => {
    for (const bad of ['', '\n', '\r\n\n', '\nab\ncd', 'ab\n\ncd', 'ab\ncde', 'abc\nd']) {
      expect(() => Grid2D.fromLines(bad, (ch) => ch)).toThrow(Error);
    }
  });

  it('checks bounds accurately and throws RangeError on out-of-bounds at()', () => {
    const grid = Grid2D.fromLines('xy\nzw', (ch) => ch);
    expect(grid.inBounds(0, 0)).toBe(true);
    expect(grid.inBounds(1, 1)).toBe(true);

    for (const [r, c] of [
      [-1, 0],
      [0, -1],
      [2, 0],
      [0, 2],
      [0.5, 0],
      [0, Number.NaN],
    ] as const) {
      expect(grid.inBounds(r, c)).toBe(false);
      expect(() => grid.at(r, c)).toThrow(RangeError);
    }
  });
});
