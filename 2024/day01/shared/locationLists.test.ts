import { describe, expect, it } from 'vitest';
import { LocationLists, parseLocationLists } from './index';

describe('LocationLists', () => {
  it('stores defensively copied, frozen columns and normalizes -0', () => {
    const left = [-0, 3, 4];
    const right = [4, -0, 3];
    const lists = new LocationLists(left, right);
    left[0] = 999;
    right[1] = 888;

    expect(lists.size).toBe(3);
    expect(lists.isEmpty).toBe(false);
    expect(lists.left).toEqual([0, 3, 4]);
    expect(lists.right).toEqual([4, 0, 3]);
    expect(Object.is(lists.left[0], 0)).toBe(true);
    expect(Object.is(lists.right[1], 0)).toBe(true);
    expect(Object.isFrozen(lists)).toBe(true);
    expect(Object.isFrozen(lists.left)).toBe(true);
    expect(Object.isFrozen(lists.right)).toBe(true);
  });

  it('allows empty location lists', () => {
    const lists = new LocationLists([], []);
    expect(lists.size).toBe(0);
    expect(lists.isEmpty).toBe(true);
    expect(lists.left).toEqual([]);
    expect(lists.right).toEqual([]);
  });

  it('rejects mismatched column lengths', () => {
    expect(() => new LocationLists([1, 2], [1])).toThrow(RangeError);
  });

  it('rejects non-integer or unsafe integers in either column', () => {
    expect(() => new LocationLists([1.5], [2])).toThrow(RangeError);
    expect(() => new LocationLists([1], [Number.NaN])).toThrow(RangeError);
    expect(() => new LocationLists([Number.POSITIVE_INFINITY], [1])).toThrow(RangeError);
    expect(() => new LocationLists([1], [Number.MAX_SAFE_INTEGER + 1])).toThrow(RangeError);
  });
});

describe('parseLocationLists', () => {
  it('parses whitespace-separated pairs including CRLF, negatives, and -0', () => {
    const raw = '  3   4\r\n-5\t9\n-0   2  \r\n';
    const lists = parseLocationLists(raw);

    expect(lists.size).toBe(3);
    expect(lists.left).toEqual([3, -5, 0]);
    expect(lists.right).toEqual([4, 9, 2]);
    expect(Object.is(lists.left[2], 0)).toBe(true);
  });

  it('rejects empty or whitespace-only inputs', () => {
    expect(() => parseLocationLists('')).toThrow('Input must contain at least one location pair');
    expect(() => parseLocationLists('   \r\n\t ')).toThrow('Input must contain at least one location pair');
  });

  it('rejects malformed rows with 1-based line numbers', () => {
    expect(() => parseLocationLists('3 4\n42')).toThrow(/Line 2:/);
    expect(() => parseLocationLists('3 4\n\n5 6')).toThrow(/Line 2:/);
    expect(() => parseLocationLists('1 2 3')).toThrow(/Line 1:/);
    expect(() => parseLocationLists('abc 2')).toThrow(/Line 1:/);
  });

  it('rejects unsafe integers during parsing with 1-based line numbers', () => {
    expect(() => parseLocationLists('3 4\n9007199254740992 1')).toThrow(RangeError);
    expect(() => parseLocationLists('3 4\n9007199254740992 1')).toThrow(/Line 2:/);
    expect(() => parseLocationLists('1 -9007199254740992')).toThrow(RangeError);
    expect(() => parseLocationLists('1 -9007199254740992')).toThrow(/Line 1:/);
  });
});
