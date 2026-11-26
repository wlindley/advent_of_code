import { describe, expect, it } from 'vitest';
import { DoorCode } from './model';
import { parseDoorCodes } from './parser';

describe('parseDoorCodes', () => {
  it('parses newline- and CRLF-delimited door codes while skipping blank lines', () => {
    const raw = ' 029A \r\n\r\n980A\n  179A\r\n456A\n379A  \n';
    const codes = parseDoorCodes(raw);
    expect(Object.isFrozen(codes)).toBe(true);
    expect(codes.map((c) => c.raw)).toEqual(['029A', '980A', '179A', '456A', '379A']);
    expect(codes[0]).toBeInstanceOf(DoorCode);
  });

  it('rejects empty or whitespace-only input and invalid code lines', () => {
    expect(() => parseDoorCodes('')).toThrow(RangeError);
    expect(() => parseDoorCodes('  \r\n \n  ')).toThrow(RangeError);
    expect(() => parseDoorCodes('029A\nBAD')).toThrow(RangeError);
  });
});
