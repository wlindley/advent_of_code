import { describe, expect, it } from 'vitest';
import { PasswordRange, parsePasswordRange } from './range';

describe('PasswordRange', () => {
  it('stores frozen bounds and computes span and containment dynamically', () => {
    const range = new PasswordRange(111_111, 123_789);
    expect(Object.isFrozen(range)).toBe(true);
    expect(range.low).toBe(111_111);
    expect(range.high).toBe(123_789);
    expect(range.span).toBe(12_679);
    expect(range.contains(111_111)).toBe(true);
    expect(range.contains(120_000)).toBe(true);
    expect(range.contains(123_789)).toBe(true);
    expect(range.contains(111_110)).toBe(false);
    expect(range.contains(123_790)).toBe(false);
    expect(range.contains(120_000.5)).toBe(false);

    const single = new PasswordRange(555_555, 555_555);
    expect(single.span).toBe(1);
    expect(single.contains(555_555)).toBe(true);
  });

  it('rejects out-of-range bounds and inverted ranges with RangeError', () => {
    expect(() => new PasswordRange(99_999, 123_456)).toThrow(RangeError);
    expect(() => new PasswordRange(123_456, 1_000_000)).toThrow(RangeError);
    expect(() => new PasswordRange(300_000, 200_000)).toThrow(RangeError);
  });

  it('parses trimmed LOW-HIGH inputs and delegates bound checks to PasswordRange', () => {
    const parsed = parsePasswordRange('  111111-123789 \n');
    expect(parsed.low).toBe(111_111);
    expect(parsed.high).toBe(123_789);

    expect(() => parsePasswordRange('')).toThrow(SyntaxError);
    expect(() => parsePasswordRange('12345-123456')).toThrow(SyntaxError);
    expect(() => parsePasswordRange('123456')).toThrow(SyntaxError);
    expect(() => parsePasswordRange('012345-123456')).toThrow(RangeError);
    expect(() => parsePasswordRange('300000-200000')).toThrow(RangeError);
  });
});
