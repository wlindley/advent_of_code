import { describe, expect, it } from 'vitest';
import { generatePermutations } from './permutations';

describe('generatePermutations', () => {
  it('returns a single frozen empty tuple for an empty input', () => {
    const result = generatePermutations([]);
    expect(result).toEqual([[]]);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result[0])).toBe(true);
  });

  it('returns a single frozen tuple for a singleton input', () => {
    const result = generatePermutations([7n]);
    expect(result).toEqual([[7n]]);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result[0])).toBe(true);
  });

  it('generates lexicographic permutations from unsorted inputs without mutating the source', () => {
    const source = [2n, 0n, 1n];
    const result = generatePermutations(source);
    expect(source).toEqual([2n, 0n, 1n]);
    expect(result).toEqual([
      [0n, 1n, 2n],
      [0n, 2n, 1n],
      [1n, 0n, 2n],
      [1n, 2n, 0n],
      [2n, 0n, 1n],
      [2n, 1n, 0n],
    ]);
    for (const tuple of result) {
      expect(Object.isFrozen(tuple)).toBe(true);
    }
  });

  it('handles duplicate values and emits distinct lexicographic permutations', () => {
    expect(generatePermutations([2n, 1n, 2n])).toEqual([
      [1n, 2n, 2n],
      [2n, 1n, 2n],
      [2n, 2n, 1n],
    ]);
  });

  it('generates all 120 unique permutations for 5 phase settings', () => {
    const perms = generatePermutations([4n, 3n, 2n, 1n, 0n]);
    expect(perms).toHaveLength(120);
    expect(perms[0]).toEqual([0n, 1n, 2n, 3n, 4n]);
    expect(perms[119]).toEqual([4n, 3n, 2n, 1n, 0n]);
    const unique = new Set(perms.map((p) => p.join(',')));
    expect(unique.size).toBe(120);
  });
});
