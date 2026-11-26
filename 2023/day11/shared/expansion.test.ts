import { describe, expect, it } from 'vitest';
import {
  expandedGalaxyCoords,
  sumExpandedPairwiseDistances,
  sweepAxisDistances,
  validateExpansionFactor,
  type ExpandedGalaxyCoord,
} from './expansion';
import { parseUniverseMap } from './universe';

const EXAMPLE_RAW = [
  '...#......',
  '.......#..',
  '#.........',
  '..........',
  '......#...',
  '.#........',
  '.........#',
  '..........',
  '.......#..',
  '#...#.....',
].join('\n');

function manhattanBigInt(a: ExpandedGalaxyCoord, b: ExpandedGalaxyCoord): bigint {
  const dr = a.row >= b.row ? a.row - b.row : b.row - a.row;
  const dc = a.col >= b.col ? a.col - b.col : b.col - a.col;
  return dr + dc;
}

describe('validateExpansionFactor', () => {
  it('accepts factors >= 1n and rejects <= 0n', () => {
    expect(validateExpansionFactor(1n)).toBe(1n);
    expect(validateExpansionFactor(1_000_000n)).toBe(1_000_000n);
    expect(() => validateExpansionFactor(0n)).toThrow(RangeError);
    expect(() => validateExpansionFactor(-5n)).toThrow(RangeError);
  });
});

describe('sweepAxisDistances', () => {
  it('handles degenerate count arrays', () => {
    expect(sweepAxisDistances([], 2n)).toBe(0n);
    expect(sweepAxisDistances([0, 0, 0], 10n)).toBe(0n);
    expect(sweepAxisDistances([1], 2n)).toBe(0n);
    expect(sweepAxisDistances([0, 1, 0], 5n)).toBe(0n);
    expect(sweepAxisDistances([2, 2], 5n)).toBe(4n);
  });

  it('handles leading, trailing, and consecutive empty rifts', () => {
    // Galaxies at index 1 and 4 with consecutive rifts at 2, 3 and leading/trailing 0s.
    expect(sweepAxisDistances([0, 1, 0, 0, 1, 0], 10n)).toBe(21n);
  });

  it('rejects negative, non-integer counts and invalid expansion factors', () => {
    expect(() => sweepAxisDistances([-1, 1], 2n)).toThrow(RangeError);
    expect(() => sweepAxisDistances([1.5, 1], 2n)).toThrow(RangeError);
    expect(() => sweepAxisDistances([Number.NaN], 2n)).toThrow(RangeError);
    expect(() => sweepAxisDistances([Number.POSITIVE_INFINITY], 2n)).toThrow(RangeError);
    expect(() => sweepAxisDistances([1, 1], 0n)).toThrow(RangeError);
  });
});

describe('sumExpandedPairwiseDistances and expandedGalaxyCoords', () => {
  it('matches AoC example totals across F = 1, 2, 10, 100, 1_000_000, and 10^15', () => {
    const universe = parseUniverseMap(EXAMPLE_RAW);
    expect(sumExpandedPairwiseDistances(universe, 1n)).toBe(292n);
    expect(sumExpandedPairwiseDistances(universe, 2n)).toBe(374n);
    expect(sumExpandedPairwiseDistances(universe, 10n)).toBe(1030n);
    expect(sumExpandedPairwiseDistances(universe, 100n)).toBe(8410n);
    expect(sumExpandedPairwiseDistances(universe, 1_000_000n)).toBe(82_000_210n);

    const hugeFactor = 10n ** 15n;
    const expectedHuge = 292n + (hugeFactor - 1n) * (374n - 292n);
    expect(sumExpandedPairwiseDistances(universe, hugeFactor)).toBe(expectedHuge);
  });

  it('matches documented AoC example pair distances for F = 2n', () => {
    const universe = parseUniverseMap(EXAMPLE_RAW);
    const coords = expandedGalaxyCoords(universe, 2n);
    expect(Object.isFrozen(coords)).toBe(true);
    expect(Object.isFrozen(coords[0])).toBe(true);
    expect(coords).toHaveLength(9);

    // 1-based galaxies in reading order: 5<->9 = 9, 1<->7 = 15, 3<->6 = 17, 8<->9 = 5
    expect(manhattanBigInt(coords[4]!, coords[8]!)).toBe(9n);
    expect(manhattanBigInt(coords[0]!, coords[6]!)).toBe(15n);
    expect(manhattanBigInt(coords[2]!, coords[5]!)).toBe(17n);
    expect(manhattanBigInt(coords[7]!, coords[8]!)).toBe(5n);
  });

  it('handles 0-galaxy and 1-galaxy universes and rejects invalid factors', () => {
    const empty = parseUniverseMap('...\n...');
    expect(sumExpandedPairwiseDistances(empty, 2n)).toBe(0n);
    expect(expandedGalaxyCoords(empty, 2n)).toEqual([]);

    const single = parseUniverseMap('.#.');
    expect(sumExpandedPairwiseDistances(single, 100n)).toBe(0n);
    expect(expandedGalaxyCoords(single, 100n)).toEqual([{ row: 0n, col: 100n }]);

    expect(() => sumExpandedPairwiseDistances(single, 0n)).toThrow(RangeError);
    expect(() => expandedGalaxyCoords(single, -1n)).toThrow(RangeError);
  });
});
