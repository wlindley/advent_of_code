import { describe, expect, it } from 'vitest';
import {
  compareNodeIds,
  compareNumbers,
  differenceSorted,
  findSortedString,
  hasSortedNumber,
  intersectSorted,
  lowerBound,
} from './sorted';

describe('sorted helpers', () => {
  it('compares numbers and node id sequences lexicographically', () => {
    expect(compareNumbers(2, 5)).toBeLessThan(0);
    expect(compareNumbers(5, 2)).toBeGreaterThan(0);
    expect(compareNumbers(3, 3)).toBe(0);

    expect(compareNodeIds([0, 1, 2], [0, 3, 4])).toBeLessThan(0);
    expect(compareNodeIds([0, 3], [0, 1])).toBeGreaterThan(0);
    expect(compareNodeIds([0, 1], [0, 1, 2])).toBeLessThan(0);
    expect(compareNodeIds([0, 1], [0, 1])).toBe(0);
  });

  it('finds lower bounds and membership in sorted number arrays', () => {
    const arr = [2, 5, 8, 12];
    expect(lowerBound(arr, 1)).toBe(0);
    expect(lowerBound(arr, 5)).toBe(1);
    expect(lowerBound(arr, 6)).toBe(2);
    expect(lowerBound(arr, 20)).toBe(4);
    expect(lowerBound([], 5)).toBe(0);

    expect(hasSortedNumber(arr, 8)).toBe(true);
    expect(hasSortedNumber(arr, 7)).toBe(false);
    expect(hasSortedNumber(arr, 20)).toBe(false);
  });

  it('finds indices in sorted string arrays', () => {
    const names = ['aa', 'co', 'de', 'ka', 'ta'];
    expect(findSortedString(names, 'aa')).toBe(0);
    expect(findSortedString(names, 'de')).toBe(2);
    expect(findSortedString(names, 'ta')).toBe(4);
    expect(findSortedString(names, 'zz')).toBe(-1);
    expect(findSortedString([], 'aa')).toBe(-1);
  });

  it('computes sorted intersections and differences', () => {
    expect(intersectSorted([1, 3, 5, 7], [2, 3, 6, 7, 9])).toEqual([3, 7]);
    expect(intersectSorted([], [1, 2])).toEqual([]);

    expect(differenceSorted([1, 3, 5, 7, 9], [2, 3, 7])).toEqual([1, 5, 9]);
    expect(differenceSorted([1, 2], [1, 2, 5])).toEqual([]);
  });
});
