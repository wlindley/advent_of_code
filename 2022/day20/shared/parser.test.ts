import { describe, expect, it } from 'vitest';
import { parseEncryptedFile } from './parser';

describe('parseEncryptedFile', () => {
  it('parses newline and CRLF separated signed integers while trimming blanks', () => {
    const raw = '\n  1 \r\n2\r\n-3\n\n3\n-2\n0\n4\n  ';
    const file = parseEncryptedFile(raw);
    expect(file.values).toEqual([1n, 2n, -3n, 3n, -2n, 0n, 4n]);
    expect(file.zeroId).toBe(5);
  });

  it('parses arbitrarily large 64-bit+ signed integers losslessly', () => {
    const file = parseEncryptedFile('99999999999999999999\n0\n-88888888888888888888');
    expect(file.values).toEqual([99999999999999999999n, 0n, -88888888888888888888n]);
  });

  it('rejects non-integer lines with SyntaxError', () => {
    expect(() => parseEncryptedFile('1\nabc\n0')).toThrow(SyntaxError);
    expect(() => parseEncryptedFile('1.5\n0')).toThrow(SyntaxError);
    expect(() => parseEncryptedFile('+1\n0')).toThrow(SyntaxError);
  });

  it('delegates empty and missing/duplicate zero validation to EncryptedFile', () => {
    expect(() => parseEncryptedFile('   \n\r\n ')).toThrow(RangeError);
    expect(() => parseEncryptedFile('1\n2\n3')).toThrow(RangeError);
    expect(() => parseEncryptedFile('0\n1\n0')).toThrow(RangeError);
  });
});
