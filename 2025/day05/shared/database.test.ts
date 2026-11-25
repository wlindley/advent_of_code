import { describe, expect, it } from 'vitest';
import { ClosedInterval } from '../../../shared/core';
import { parseDatabase } from './index';

const EXAMPLE = [
  '3-5',
  '10-14',
  '16-20',
  '12-18',
  '',
  '1',
  '5',
  '8',
  '11',
  '17',
  '32',
].join('\n');

describe('parseDatabase', () => {
  it('parses the official example and freezes database and arrays', () => {
    const db = parseDatabase(EXAMPLE);
    expect(db.freshRanges).toEqual([
      new ClosedInterval(3n, 5n),
      new ClosedInterval(10n, 14n),
      new ClosedInterval(16n, 20n),
      new ClosedInterval(12n, 18n),
    ]);
    expect(db.availableIds).toEqual([1n, 5n, 8n, 11n, 17n, 32n]);
    expect(Object.isFrozen(db)).toBe(true);
    expect(Object.isFrozen(db.freshRanges)).toBe(true);
    expect(Object.isFrozen(db.availableIds)).toBe(true);
  });

  it('normalizes CRLF, trims outer whitespace, and handles zeros, singletons, duplicates, and 15+ digit BigInts', () => {
    const raw = '\r\n  \r\n0-0\r\n100000000000000-100000000000005\r\n0-0\r\n \r\n0\r\n0\r\n100000000000003\r\n\r\n';
    const db = parseDatabase(raw);
    expect(db.freshRanges).toEqual([
      new ClosedInterval(0n, 0n),
      new ClosedInterval(100_000_000_000_000n, 100_000_000_000_005n),
      new ClosedInterval(0n, 0n),
    ]);
    expect(db.availableIds).toEqual([0n, 0n, 100_000_000_000_003n]);
  });

  it('rejects empty, missing separator, multi-separator, inverted, and malformed inputs', () => {
    expect(() => parseDatabase('')).toThrow(Error);
    expect(() => parseDatabase('   \r\n  ')).toThrow(Error);
    expect(() => parseDatabase('3-5\n1')).toThrow(Error);
    expect(() => parseDatabase('3-5\n\n1\n\n2')).toThrow(Error);
    expect(() => parseDatabase('3-5\n \n10-14\n\n1')).toThrow(Error);
    expect(() => parseDatabase('10-5\n\n1')).toThrow(RangeError);
    expect(() => parseDatabase('3..5\n\n1')).toThrow(Error);
    expect(() => parseDatabase('-3-5\n\n1')).toThrow(Error);
    expect(() => parseDatabase('3-5\n\nabc')).toThrow(Error);
    expect(() => parseDatabase('3-5\n\n-1')).toThrow(Error);
  });
});
