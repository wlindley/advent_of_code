import { describe, expect, it } from 'vitest';
import { ALPHABET_SIZE, ASCII_LOWER_A, DatastreamBuffer, parseDatastream } from './buffer';

describe('DatastreamBuffer', () => {
  it('exposes alphabet constants', () => {
    expect(ALPHABET_SIZE).toBe(26);
    expect(ASCII_LOWER_A).toBe(97);
  });

  it('constructs a frozen lowercase buffer with dynamic length', () => {
    const buffer = new DatastreamBuffer('mjqjpqmgbljsphdztnvjfqwrcgsmlb');
    expect(buffer.signal).toBe('mjqjpqmgbljsphdztnvjfqwrcgsmlb');
    expect(buffer.length).toBe(30);
    expect(Object.isFrozen(buffer)).toBe(true);
  });

  it('trims surrounding whitespace in parseDatastream', () => {
    const buffer = parseDatastream('  \n bvwbjplbgvbhsrlpgdmjqwftvncz \r\n ');
    expect(buffer.signal).toBe('bvwbjplbgvbhsrlpgdmjqwftvncz');
    expect(buffer.length).toBe(28);
  });

  it('rejects an empty string', () => {
    expect(() => new DatastreamBuffer('')).toThrow(RangeError);
  });

  it('rejects whitespace-only input via parseDatastream', () => {
    expect(() => parseDatastream('  \t \n ')).toThrow(RangeError);
  });

  it('rejects internal LF newline', () => {
    expect(() => new DatastreamBuffer('abcd\nefgh')).toThrow(RangeError);
  });

  it('rejects internal CRLF newline', () => {
    expect(() => new DatastreamBuffer('abcd\r\nefgh')).toThrow(RangeError);
  });

  it('rejects uppercase letters', () => {
    expect(() => new DatastreamBuffer('abcDef')).toThrow(RangeError);
  });

  it('rejects digits', () => {
    expect(() => new DatastreamBuffer('abc1def')).toThrow(RangeError);
  });

  it('rejects symbols', () => {
    expect(() => new DatastreamBuffer('abc-def')).toThrow(RangeError);
  });

  it('rejects internal spaces', () => {
    expect(() => new DatastreamBuffer('abc def')).toThrow(RangeError);
  });
});
