import { describe, expect, it } from 'vitest';
import { parseOctopusGrid } from './parser';

describe('parseOctopusGrid', () => {
  it('parses rectangular digit lines including CRLF and trailing newlines', () => {
    const grid = parseOctopusGrid('012\r\n789\r\n');
    expect(grid.rows).toBe(2);
    expect(grid.cols).toBe(3);
    expect(grid.at(0, 0)).toBe(0);
    expect(grid.at(0, 2)).toBe(2);
    expect(grid.at(1, 0)).toBe(7);
    expect(grid.at(1, 2)).toBe(9);
  });

  it('rejects empty, jagged, or non-digit inputs', () => {
    expect(() => parseOctopusGrid('')).toThrow();
    expect(() => parseOctopusGrid('12\n3')).toThrow();
    expect(() => parseOctopusGrid('1/3')).toThrow(RangeError);
    expect(() => parseOctopusGrid('1a3')).toThrow(RangeError);
    expect(() => parseOctopusGrid('1:3')).toThrow(RangeError);
  });
});
