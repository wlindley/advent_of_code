import { describe, expect, it } from 'vitest';
import { BitCursor, HexBitstream, parseHexBitstream } from './bitstream';

describe('HexBitstream and BitCursor', () => {
  it('parses trimmed mixed-case hex and exposes derived bit/hex views', () => {
    const stream = parseHexBitstream('  d2Fe28 \n');
    expect(stream).toBeInstanceOf(HexBitstream);
    expect(Object.isFrozen(stream)).toBe(true);
    expect(stream.hexLength).toBe(6);
    expect(stream.bitLength).toBe(24);
    expect(stream.hex).toBe('D2FE28');
    expect(stream.sliceBits(0, 24)).toBe('110100101111111000101000');
    expect(stream.sliceBits(6, 6)).toBe('');
    expect(stream.bitAt(0)).toBe(1);
    expect(stream.bitAt(2)).toBe(0);
  });

  it('rejects empty or non-hex inputs with SyntaxError', () => {
    expect(() => parseHexBitstream('')).toThrow(SyntaxError);
    expect(() => parseHexBitstream('   \r\n ')).toThrow(SyntaxError);
    expect(() => parseHexBitstream('A0/1')).toThrow(SyntaxError);
    expect(() => parseHexBitstream('A0:1')).toThrow(SyntaxError);
    expect(() => parseHexBitstream('A0@1')).toThrow(SyntaxError);
    expect(() => parseHexBitstream('A0G1')).toThrow(SyntaxError);
    expect(() => parseHexBitstream('A0`1')).toThrow(SyntaxError);
    expect(() => parseHexBitstream('A0g1')).toThrow(SyntaxError);
  });

  it('validates bitAt and sliceBits bounds with RangeError', () => {
    const stream = parseHexBitstream('F0');
    expect(() => stream.bitAt(-1)).toThrow(RangeError);
    expect(() => stream.bitAt(8)).toThrow(RangeError);
    expect(() => stream.bitAt(1.5)).toThrow(RangeError);
    expect(() => stream.sliceBits(-1, 2)).toThrow(RangeError);
    expect(() => stream.sliceBits(4, 2)).toThrow(RangeError);
    expect(() => stream.sliceBits(0, 9)).toThrow(RangeError);
    expect(() => stream.sliceBits(0.5, 2)).toThrow(RangeError);
    expect(() => stream.sliceBits(0, 2.5)).toThrow(RangeError);
  });

  it('reads unsigned integers up to 30 bits via BitCursor', () => {
    const stream = parseHexBitstream('D2FE28');
    const cursor = stream.createCursor();
    expect(cursor).toBeInstanceOf(BitCursor);
    expect(cursor.position).toBe(0);
    expect(cursor.remainingBits).toBe(24);
    expect(cursor.readUint(3)).toBe(6);
    expect(cursor.readUint(3)).toBe(4);
    expect(cursor.readUint(5)).toBe(0b10111);
    expect(cursor.readUint(5)).toBe(0b11110);
    expect(cursor.readUint(5)).toBe(0b00101);
    expect(cursor.position).toBe(21);
    expect(cursor.remainingBits).toBe(3);
    expect(cursor.readUint(3)).toBe(0);
    expect(cursor.remainingBits).toBe(0);

    const wide = parseHexBitstream('FFFFFFFF');
    expect(wide.createCursor().readUint(30)).toBe(0x3fffffff);
  });

  it('rejects invalid read widths and EOF reads on BitCursor', () => {
    const cursor = parseHexBitstream('A').createCursor();
    expect(() => cursor.readUint(0)).toThrow(RangeError);
    expect(() => cursor.readUint(31)).toThrow(RangeError);
    expect(() => cursor.readUint(1.5)).toThrow(RangeError);
    expect(() => cursor.readUint(5)).toThrow(SyntaxError);
  });
});
