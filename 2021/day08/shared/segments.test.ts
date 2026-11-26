import { describe, expect, it } from 'vitest';
import {
  CANONICAL_DIGIT_MASKS,
  CANONICAL_MASK_TO_DIGIT,
  SignalPattern,
  UNIQUE_SEGMENT_COUNTS,
  WIRE_INDICES,
  WIRE_LETTERS,
  popcount7,
} from './segments';

describe('2021 Day 8 segments', () => {
  it('exposes canonical wire constants and digit masks', () => {
    expect(WIRE_INDICES).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(WIRE_LETTERS).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
    expect(CANONICAL_DIGIT_MASKS).toHaveLength(10);
    expect(CANONICAL_MASK_TO_DIGIT.size).toBe(10);
    expect(CANONICAL_MASK_TO_DIGIT.get(0b0100100)).toBe(1);
    expect(CANONICAL_MASK_TO_DIGIT.get(0b1111111)).toBe(8);
    expect([...UNIQUE_SEGMENT_COUNTS].sort()).toEqual([2, 3, 4, 7]);
  });

  it('computes popcount7 and rejects out-of-range masks', () => {
    expect(popcount7(0)).toBe(0);
    expect(popcount7(0b1010101)).toBe(4);
    expect(popcount7(127)).toBe(7);
    expect(() => popcount7(-1)).toThrow(RangeError);
    expect(() => popcount7(128)).toThrow(RangeError);
    expect(() => popcount7(1.5)).toThrow(RangeError);
  });

  it('constructs frozen SignalPattern instances and rejects invalid masks', () => {
    const one = new SignalPattern(CANONICAL_DIGIT_MASKS[1]);
    expect(Object.isFrozen(one)).toBe(true);
    expect(one.segmentCount).toBe(2);
    expect(one.letters).toBe('cf');
    expect(one.isUniqueSegmentCount).toBe(true);
    expect(one.hasWire(2)).toBe(true);
    expect(one.hasWire(0)).toBe(false);

    expect(() => new SignalPattern(0)).toThrow(RangeError);
    expect(() => new SignalPattern(128)).toThrow(RangeError);
    expect(() => new SignalPattern(2.5)).toThrow(RangeError);
  });

  it('parses order-independent wire strings and rejects malformed tokens', () => {
    const a = SignalPattern.parse('fc');
    const b = SignalPattern.parse('cf');
    expect(a.mask).toBe(b.mask);
    expect(a.letters).toBe('cf');

    const five = SignalPattern.parse('abdfg');
    expect(five.segmentCount).toBe(5);
    expect(five.isUniqueSegmentCount).toBe(false);

    expect(() => SignalPattern.parse('')).toThrow(SyntaxError);
    expect(() => SignalPattern.parse('abx')).toThrow(SyntaxError);
    expect(() => SignalPattern.parse('CF')).toThrow(SyntaxError);
    expect(() => SignalPattern.parse('aba')).toThrow(SyntaxError);
  });
});
