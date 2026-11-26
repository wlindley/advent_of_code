import { describe, expect, it } from 'vitest';
import { parseLinenLayout } from './parser';

describe('parseLinenLayout', () => {
  it('parses CRLF input, deduplicates patterns preserving order, and preserves duplicate designs', () => {
    const raw = '  r, wr, b, r, g \r\n\r\nbr\r\nwr\r\nbr\r\n';
    const layout = parseLinenLayout(raw);

    expect(layout.patterns).toEqual(['r', 'wr', 'b', 'g']);
    expect(layout.designs).toEqual(['br', 'wr', 'br']);
    expect(layout.patternCount).toBe(4);
    expect(layout.designCount).toBe(3);
  });

  it('rejects empty input, missing blank separator, or missing designs', () => {
    expect(() => parseLinenLayout('')).toThrow(Error);
    expect(() => parseLinenLayout('   \r\n  ')).toThrow(Error);
    expect(() => parseLinenLayout('r, wr\nbr')).toThrow(Error);
    expect(() => parseLinenLayout('r, wr\n\n')).toThrow(Error);
    expect(() => parseLinenLayout('r, wr\nwr\nbr')).toThrow(Error);
  });

  it('rejects trailing commas, empty pattern tokens, blank lines inside designs, and invalid stripe chars', () => {
    expect(() => parseLinenLayout('r, wr,\n\nbr')).toThrow(Error);
    expect(() => parseLinenLayout('r, , wr\n\nbr')).toThrow(Error);
    expect(() => parseLinenLayout('r, wr\n\nbr\n\nwr')).toThrow(Error);
    expect(() => parseLinenLayout('r, wx\n\nbr')).toThrow(RangeError);
    expect(() => parseLinenLayout('r, wr\n\nbrx')).toThrow(RangeError);
  });
});
