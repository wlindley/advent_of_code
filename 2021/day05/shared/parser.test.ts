import { describe, expect, it } from 'vitest';
import { parseVentField } from './parser';

describe('parseVentField', () => {
  it('parses CRLF/LF lines, blank lines, negative coordinates, and extra spacing', () => {
    const raw = '\n  0,9 -> 5,9  \r\n\r\n  -2, 3 -> 4, -1 \n';
    const field = parseVentField(raw);
    expect(field.segmentCount).toBe(2);
    expect(field.segments[0]!.start.x).toBe(0);
    expect(field.segments[0]!.end.y).toBe(9);
    expect(field.segments[1]!.start.x).toBe(-2);
    expect(field.segments[1]!.end.y).toBe(-1);
  });

  it('rejects empty or whitespace-only input with RangeError', () => {
    expect(() => parseVentField('')).toThrow(RangeError);
    expect(() => parseVentField('  \r\n \t \n')).toThrow(RangeError);
  });

  it('throws SyntaxError with 1-based line number on malformed lines', () => {
    expect(() => parseVentField('0,9 -> 5,9\nbad-line')).toThrow(SyntaxError);
    expect(() => parseVentField('0,9 -> 5,9\n\nbad-line')).toThrow(/Line 3:/);
  });

  it('throws RangeError with 1-based line number on unsafe integer coordinates or deltas', () => {
    expect(() => parseVentField('0,0 -> 9007199254740992,0')).toThrow(RangeError);
    expect(() => parseVentField('0,0 -> 1,1\n-1,0 -> 9007199254740991,0')).toThrow(/Line 2:/);
  });
});
