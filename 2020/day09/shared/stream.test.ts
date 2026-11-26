import { describe, expect, it } from 'vitest';
import { parseXmasStream, XmasStream } from './stream';

describe('XmasStream', () => {
  it('stores frozen positive BigInts and exposes length and bounds-checked at()', () => {
    const raw = [1n, 2n, 9007199254740993n];
    const stream = new XmasStream(raw);
    expect(Object.isFrozen(stream)).toBe(true);
    expect(Object.isFrozen(stream.values)).toBe(true);
    expect(stream.length).toBe(3);
    expect(stream.at(0)).toBe(1n);
    expect(stream.at(2)).toBe(9007199254740993n);
    expect(() => stream.at(-1)).toThrow(RangeError);
    expect(() => stream.at(3)).toThrow(RangeError);
    expect(() => stream.at(1.5)).toThrow(RangeError);
  });

  it('rejects empty streams and non-positive values', () => {
    expect(() => new XmasStream([])).toThrow(RangeError);
    expect(() => new XmasStream([1n, 0n])).toThrow(RangeError);
    expect(() => new XmasStream([-5n, 2n])).toThrow(RangeError);
  });
});

describe('parseXmasStream', () => {
  it('parses newline-delimited integers with outer blank lines and whitespace', () => {
    const stream = parseXmasStream('\n  \n  35 \r\n 20\n15\n\n');
    expect(stream.values).toEqual([35n, 20n, 15n]);
  });

  it('rejects empty input, internal blank lines, malformed lines, and non-positive integers', () => {
    expect(() => parseXmasStream('')).toThrow();
    expect(() => parseXmasStream('  \n\t ')).toThrow();
    expect(() => parseXmasStream('1\n\n2')).toThrow();
    expect(() => parseXmasStream('1\n12.5\n2')).toThrow();
    expect(() => parseXmasStream('1\nabc\n2')).toThrow();
    expect(() => parseXmasStream('1\n0\n2')).toThrow(RangeError);
    expect(() => parseXmasStream('1\n-3\n2')).toThrow(RangeError);
  });
});
