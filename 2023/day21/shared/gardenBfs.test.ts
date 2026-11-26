import { describe, expect, it } from 'vitest';
import { DIRS_4 } from '../../../shared/core';
import {
  computeFiniteDistances,
  countFiniteReachable,
  countInfiniteReachable,
  FiniteDistanceMap,
  MAX_INFINITE_BFS_CELLS,
  UNREACHABLE_DISTANCE,
} from './gardenBfs';
import { type GardenMap, parseGardenMap } from './gardenMap';

const OFFICIAL_11X11 = [
  '...........',
  '.....###.#.',
  '.###.##..#.',
  '..#.#...#..',
  '....#.#....',
  '.##..S####.',
  '.##..#...#.',
  '.......##..',
  '.##.#.####.',
  '.##..##.##.',
  '...........',
].join('\n');

function oracleReachable(map: GardenMap, steps: number, infinite: boolean): number {
  let frontier = new Set<string>([`${map.startRow},${map.startCol}`]);
  for (let s = 0; s < steps; s += 1) {
    const next = new Set<string>();
    for (const key of frontier) {
      const [r, c] = key.split(',').map(Number);
      for (const [dr, dc] of DIRS_4) {
        const nr = r! + dr;
        const nc = c! + dc;
        if (infinite ? !map.isRockWrapped(nr, nc) : map.inBounds(nr, nc) && !map.isRock(nr, nc)) {
          next.add(`${nr},${nc}`);
        }
      }
    }
    frontier = next;
  }
  return frontier.size;
}

describe('FiniteDistanceMap', () => {
  it('validates parameters, defensively copies, and supports distanceAt and histogram', () => {
    const raw = new Int32Array([0, 1, 5, UNREACHABLE_DISTANCE]);
    const distMap = new FiniteDistanceMap(2, 2, 2, raw);
    raw[0] = 99;

    expect(Object.isFrozen(distMap)).toBe(true);
    expect(distMap.distanceAt(0, 0)).toBe(0);
    expect(distMap.distanceAt(1, 1)).toBe(UNREACHABLE_DISTANCE);
    expect(distMap.countReachableAt(0)).toBe(1);
    expect(distMap.countReachableAt(1)).toBe(1);
    expect(distMap.countReachableAt(2)).toBe(1);
    expect(distMap.distanceHistogram()).toEqual([1, 1, 0]);
    expect(Object.isFrozen(distMap.distanceHistogram())).toBe(true);

    expect(() => distMap.distanceAt(-1, 0)).toThrow(RangeError);
    expect(() => distMap.distanceAt(0, 2)).toThrow(RangeError);
    expect(() => distMap.distanceAt(0.5, 0)).toThrow(RangeError);
    expect(() => distMap.countReachableAt(-1)).toThrow(RangeError);
    expect(() => distMap.countReachableAt(3)).toThrow(RangeError);
    expect(() => distMap.countReachableAt(1.5)).toThrow(RangeError);

    expect(() => new FiniteDistanceMap(0, 2, 1, raw)).toThrow(RangeError);
    expect(() => new FiniteDistanceMap(2, -1, 1, raw)).toThrow(RangeError);
    expect(() => new FiniteDistanceMap(2, 2, -1, raw)).toThrow(RangeError);
    expect(() => new FiniteDistanceMap(2, 2, 1, new Int32Array(3))).toThrow(RangeError);
  });
});

describe('finite garden BFS', () => {
  it('matches brute-force oracle on official 11x11 map for 0, 1, 2, 3, 6, and 64 steps', () => {
    const map = parseGardenMap(OFFICIAL_11X11);
    const distMap = computeFiniteDistances(map, 64);
    for (const steps of [0, 1, 2, 3, 6, 64]) {
      expect(distMap.countReachableAt(steps)).toBe(oracleReachable(map, steps, false));
      expect(countFiniteReachable(map, steps)).toBe(oracleReachable(map, steps, false));
    }
    expect(countFiniteReachable(map, 6)).toBe(16);
    expect(() => computeFiniteDistances(map, -1)).toThrow(RangeError);
  });

  it('handles isolated S in finite 1x1 and 3x3 enclosed maps', () => {
    const single = parseGardenMap('S');
    expect(countFiniteReachable(single, 0)).toBe(1);
    expect(countFiniteReachable(single, 1)).toBe(0);
    expect(countFiniteReachable(single, 2)).toBe(0);

    const enclosed = parseGardenMap('.#.\n#S#\n.#.');
    expect(countFiniteReachable(enclosed, 0)).toBe(1);
    expect(countFiniteReachable(enclosed, 1)).toBe(0);
    expect(countFiniteReachable(enclosed, 2)).toBe(0);
  });
});

describe('infinite garden BFS', () => {
  it('matches official 11x11 infinite values and brute-force oracle', () => {
    const map = parseGardenMap(OFFICIAL_11X11);
    expect(countInfiniteReachable(map, 0)).toBe(1);
    expect(countInfiniteReachable(map, 3)).toBe(oracleReachable(map, 3, true));
    expect(countInfiniteReachable(map, 6)).toBe(16);
    expect(countInfiniteReachable(map, 10)).toBe(50);
    expect(countInfiniteReachable(map, 10)).toBe(oracleReachable(map, 10, true));
    expect(countInfiniteReachable(map, 50)).toBe(1594);
    expect(countInfiniteReachable(map, 100)).toBe(6536);
  });

  it('matches brute-force oracle for corner-start (0, 0) wrapping', () => {
    const map = parseGardenMap('S...\n.#..\n..#.\n...#');
    for (let steps = 0; steps <= 9; steps += 1) {
      expect(countInfiniteReachable(map, steps)).toBe(oracleReachable(map, steps, true));
    }
  });

  it('handles 1x1 open S and 2x2 isolated S in infinite mode', () => {
    const open = parseGardenMap('S');
    expect(countInfiniteReachable(open, 0)).toBe(1);
    expect(countInfiniteReachable(open, 1)).toBe(4);
    expect(countInfiniteReachable(open, 2)).toBe(9);

    const isolated = parseGardenMap('S#\n#.');
    expect(countInfiniteReachable(isolated, 0)).toBe(1);
    expect(countInfiniteReachable(isolated, 1)).toBe(0);
    expect(countInfiniteReachable(isolated, 2)).toBe(0);
  });

  it('rejects invalid step counts and allocations above MAX_INFINITE_BFS_CELLS', () => {
    const map = parseGardenMap(OFFICIAL_11X11);
    expect(() => countInfiniteReachable(map, -1)).toThrow(RangeError);
    expect(() => countInfiniteReachable(map, 1.5)).toThrow(RangeError);
    expect(MAX_INFINITE_BFS_CELLS).toBe(4_000_000);
    expect(() => countInfiniteReachable(map, 12_000)).toThrow(RangeError);
  });
});
