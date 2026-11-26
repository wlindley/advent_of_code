import { describe, expect, it } from 'vitest';
import { PartNumber } from './partNumber';
import {
  isAsciiDigit,
  isSchematicSymbol,
  SchematicSymbol,
} from './schematicSymbol';

describe('PartNumber', () => {
  it('constructs a frozen value object and computes length dynamically', () => {
    const single = new PartNumber(0, 0, 5, 5, 7);
    expect(single.id).toBe(0);
    expect(single.row).toBe(0);
    expect(single.startCol).toBe(5);
    expect(single.endCol).toBe(5);
    expect(single.value).toBe(7);
    expect(single.length).toBe(1);
    expect(Object.isFrozen(single)).toBe(true);

    const multi = new PartNumber(3, 2, 4, 6, 467);
    expect(multi.length).toBe(3);
  });

  it('rejects negative, non-integer, or unsafe integer fields with RangeError', () => {
    expect(() => new PartNumber(-1, 0, 0, 0, 1)).toThrow(RangeError);
    expect(() => new PartNumber(0, -1, 0, 0, 1)).toThrow(RangeError);
    expect(() => new PartNumber(0, 0, -1, 0, 1)).toThrow(RangeError);
    expect(() => new PartNumber(0, 0, 0, -1, 1)).toThrow(RangeError);
    expect(() => new PartNumber(0, 0, 0, 0, -1)).toThrow(RangeError);
    expect(() => new PartNumber(1.5, 0, 0, 0, 1)).toThrow(RangeError);
    expect(() => new PartNumber(0, 0, 0, 0, Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
    expect(() => new PartNumber(0, 0, 0, 0, Number.NaN)).toThrow(RangeError);
  });

  it('rejects endCol < startCol with RangeError', () => {
    expect(() => new PartNumber(0, 1, 4, 3, 12)).toThrow(RangeError);
  });
});

describe('isAsciiDigit and isSchematicSymbol', () => {
  it('recognizes only single ASCII digit characters 0-9', () => {
    expect(isAsciiDigit('0')).toBe(true);
    expect(isAsciiDigit('9')).toBe(true);
    expect(isAsciiDigit('/')).toBe(false);
    expect(isAsciiDigit(':')).toBe(false);
    expect(isAsciiDigit('.')).toBe(false);
    expect(isAsciiDigit('')).toBe(false);
    expect(isAsciiDigit('12')).toBe(false);
  });

  it('recognizes single non-dot non-digit non-whitespace characters as symbols', () => {
    for (const ch of ['*', '+', '-', '#', '$', '/', '=', '@', '%', '&']) {
      expect(isSchematicSymbol(ch)).toBe(true);
    }
    for (const ch of ['.', '0', '9', ' ', '\t', '\n', '', '**']) {
      expect(isSchematicSymbol(ch)).toBe(false);
    }
  });
});

describe('SchematicSymbol', () => {
  it('constructs a frozen symbol and exposes isGearCandidate dynamically', () => {
    const star = new SchematicSymbol(0, 1, 3, '*');
    expect(star.id).toBe(0);
    expect(star.row).toBe(1);
    expect(star.col).toBe(3);
    expect(star.char).toBe('*');
    expect(star.isGearCandidate).toBe(true);
    expect(Object.isFrozen(star)).toBe(true);

    const plus = new SchematicSymbol(1, 8, 5, '+');
    expect(plus.isGearCandidate).toBe(false);
  });

  it('rejects invalid id or coordinates with RangeError', () => {
    expect(() => new SchematicSymbol(-1, 0, 0, '*')).toThrow(RangeError);
    expect(() => new SchematicSymbol(0, -1, 0, '*')).toThrow(RangeError);
    expect(() => new SchematicSymbol(0, 0, -1, '*')).toThrow(RangeError);
    expect(() => new SchematicSymbol(0, 1.2, 0, '*')).toThrow(RangeError);
  });

  it('rejects invalid symbol characters with SyntaxError', () => {
    for (const bad of ['.', '5', ' ', '\t', '', '+-']) {
      expect(() => new SchematicSymbol(0, 0, 0, bad)).toThrow(SyntaxError);
    }
  });
});
