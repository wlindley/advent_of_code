import { describe, expect, it } from 'vitest';
import { EXAMPLE_REDOUBT_SPACE, Robot, TorusSpace } from './model';
import { parseRobots } from './parser';
import {
  countAdjacentOccupied,
  countOccupancyQuadrants,
  countQuadrants,
  evaluateSafetyFactor,
  fillOccupancy,
  safetyFactorOf,
} from './simulation';

const EXAMPLE_INPUT = [
  'p=0,4 v=3,-3',
  'p=6,3 v=-1,-3',
  'p=10,3 v=-1,2',
  'p=2,0 v=2,-1',
  'p=0,0 v=1,3',
  'p=3,0 v=-2,-2',
  'p=7,6 v=-1,-3',
  'p=3,0 v=-1,-2',
  'p=9,3 v=2,3',
  'p=7,3 v=-1,2',
  'p=2,4 v=2,-3',
  'p=9,5 v=-3,-3',
].join('\n');

describe('simulation', () => {
  it('computes quadrant counts and safety factor for the official 11x7 example at t=100', () => {
    const robots = parseRobots(EXAMPLE_INPUT);
    const quadrants = countQuadrants(robots, EXAMPLE_REDOUBT_SPACE, 100);
    expect(Object.isFrozen(quadrants)).toBe(true);
    expect(quadrants).toEqual([1, 3, 4, 1]);
    expect(safetyFactorOf(quadrants)).toBe(12);
    expect(evaluateSafetyFactor(robots, EXAMPLE_REDOUBT_SPACE, 100)).toBe(12);
  });

  it('validates seconds upfront even when robot array is empty', () => {
    expect(countQuadrants([], EXAMPLE_REDOUBT_SPACE, 0)).toEqual([0, 0, 0, 0]);
    expect(() => countQuadrants([], EXAMPLE_REDOUBT_SPACE, -1)).toThrow(RangeError);
    expect(() => fillOccupancy([], EXAMPLE_REDOUBT_SPACE, -1)).toThrow(RangeError);
  });

  it('fills and reuses occupancy buffers while validating buffer lengths', () => {
    const space = new TorusSpace(3, 3);
    const robots = [new Robot(0, 0, 0, 0), new Robot(0, 0, 0, 0), new Robot(1, 1, 0, 0)];
    const buf = new Uint32Array(space.area).fill(99);
    const returned = fillOccupancy(robots, space, 0, buf);
    expect(returned).toBe(buf);
    expect(Array.from(buf)).toEqual([2, 0, 0, 0, 1, 0, 0, 0, 0]);
    expect(countOccupancyQuadrants(buf, space)).toEqual([2, 0, 0, 0]);

    const badBuf = new Uint32Array(space.area - 1);
    expect(() => fillOccupancy(robots, space, 0, badBuf)).toThrow(RangeError);
    expect(() => countOccupancyQuadrants(badBuf, space)).toThrow(RangeError);
    expect(() => countAdjacentOccupied(badBuf, space)).toThrow(RangeError);
  });

  it('counts orthogonal non-wrapping occupied neighbor pairs', () => {
    const space = new TorusSpace(3, 3);
    // Occupied: (0,0)=2, (1,0)=1, (2,0)=1, (0,2)=1 -> horizontal pairs (0,0)-(1,0) and (1,0)-(2,0); no wrap (0,0)-(0,2)
    const robots = [
      new Robot(0, 0, 0, 0),
      new Robot(0, 0, 0, 0),
      new Robot(1, 0, 0, 0),
      new Robot(2, 0, 0, 0),
      new Robot(0, 2, 0, 0),
    ];
    const occ = fillOccupancy(robots, space, 0);
    expect(countAdjacentOccupied(occ, space)).toBe(2);

    // Add (0,1) -> vertical pairs (0,0)-(0,1) and (0,1)-(0,2)
    const occWithVertical = fillOccupancy([...robots, new Robot(0, 1, 0, 0)], space, 0);
    expect(countAdjacentOccupied(occWithVertical, space)).toBe(4);
  });
});
