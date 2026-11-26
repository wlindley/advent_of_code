import { describe, expect, it } from 'vitest';
import {
  computeReverseBfs,
  HeightMap,
  parseHeightMap,
  ReverseBfsField,
  type StartCondition,
} from './index';

const OFFICIAL_EXAMPLE = [
  'Sabqponm',
  'abcryxxl',
  'accszExk',
  'acctuvwj',
  'abdefghi',
].join('\n');

const START_S: StartCondition = {
  label: 'S',
  matches: (map, idx) => idx === map.startIndex,
};

const ANY_A: StartCondition = {
  label: 'any a',
  matches: (map, idx) => map.heightAtIndex(idx) === 0,
};

function assertValidForwardPath(map: HeightMap, path: readonly number[]): void {
  expect(Object.isFrozen(path)).toBe(true);
  expect(path[path.length - 1]).toBe(map.goalIndex);
  for (let i = 0; i + 1 < path.length; i += 1) {
    const [r1, c1] = map.coordsOf(path[i]!);
    const [r2, c2] = map.coordsOf(path[i + 1]!);
    expect(Math.abs(r1 - r2) + Math.abs(c1 - c2)).toBe(1);
    expect(map.heightAtIndex(path[i + 1]!)).toBeLessThanOrEqual(map.heightAtIndex(path[i]!) + 1);
  }
}

describe('computeReverseBfs', () => {
  it('solves the official 5x8 example for Part 1 (31) and Part 2 (29) with valid paths', () => {
    const map = parseHeightMap(OFFICIAL_EXAMPLE);
    const field = computeReverseBfs(map);
    expect(Object.isFrozen(field)).toBe(true);
    expect(field.cellCount).toBe(40);
    expect(field.reachableCount).toBe(40);

    const p1Start = field.findNearestStart(map, START_S);
    expect(p1Start).toBe(map.startIndex);
    expect(field.distanceAt(p1Start!)).toBe(31);
    const p1Path = field.reconstructPath(p1Start!);
    expect(p1Path).toHaveLength(32);
    expect(p1Path[0]).toBe(map.startIndex);
    assertValidForwardPath(map, p1Path);

    const p2Start = field.findNearestStart(map, ANY_A);
    expect(p2Start).not.toBeNull();
    expect(field.distanceAt(p2Start!)).toBe(29);
    const p2Path = field.reconstructPath(p2Start!);
    expect(p2Path).toHaveLength(30);
    assertValidForwardPath(map, p2Path);
  });

  it('allows steep drops (z -> a) but forbids +2 climbs (a -> c)', () => {
    const blockedClimb = parseHeightMap('SacdefghijklmnopqrstuvwxyE');
    const blockedField = computeReverseBfs(blockedClimb);
    expect(blockedField.distanceAt(blockedClimb.startIndex)).toBeNull();

    const steepDrop = parseHeightMap('SbcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyE');
    const dropField = computeReverseBfs(steepDrop);
    expect(dropField.distanceAt(25)).toBe(26);
    expect(dropField.nextStepFrom(25)).toBe(26);
    expect(dropField.distanceAt(steepDrop.startIndex)).toBe(51);
  });

  it('supports goal-matching condition at distance 0 with single-cell path', () => {
    const map = parseHeightMap('SbcdefghijklmnopqrstuvwxyE');
    const field = computeReverseBfs(map);
    const goalOnly: StartCondition = { label: 'E', matches: (m, i) => i === m.goalIndex };
    expect(field.findNearestStart(map, goalOnly)).toBe(map.goalIndex);
    expect(field.distanceAt(map.goalIndex)).toBe(0);
    expect(field.nextStepFrom(map.goalIndex)).toBeNull();
    expect(field.reconstructPath(map.goalIndex)).toEqual([map.goalIndex]);
  });

  it('returns null and empty frozen path for unreachable S and walled-off a pockets', () => {
    const blockedSE = parseHeightMap('SE');
    const blockedField = computeReverseBfs(blockedSE);
    expect(blockedField.reachableCount).toBe(1);
    expect(blockedField.maxReachableDistance).toBe(0);
    expect(blockedField.distanceAt(0)).toBeNull();
    expect(blockedField.nextStepFrom(0)).toBeNull();
    expect(blockedField.findNearestStart(blockedSE, START_S)).toBeNull();
    const emptyPath = blockedField.reconstructPath(0);
    expect(emptyPath).toEqual([]);
    expect(Object.isFrozen(emptyPath)).toBe(true);

    const walledA = parseHeightMap('acSbcdefghijklmnopqrstuvwxyE');
    const walledField = computeReverseBfs(walledA);
    expect(walledField.distanceAt(0)).toBeNull();
    expect(walledField.findNearestStart(walledA, START_S)).toBe(2);
    expect(walledField.findNearestStart(walledA, ANY_A)).toBe(2);
  });

  it('returns frozen countByDistance summing to reachableCount', () => {
    const map = parseHeightMap(OFFICIAL_EXAMPLE);
    const field = computeReverseBfs(map);
    const counts = field.countByDistance();
    expect(Object.isFrozen(counts)).toBe(true);
    expect(counts[0]).toBe(1);
    expect(counts).toHaveLength(field.maxReachableDistance + 1);
    expect(counts.reduce((sum, n) => sum + n, 0)).toBe(field.reachableCount);
  });
});

describe('ReverseBfsField validation and defensive copies', () => {
  it('defensively copies typed arrays without freezing them', () => {
    const dist = new Int32Array([0, 1]);
    const next = new Int32Array([-1, 0]);
    const order = new Int32Array([0, 1]);
    const field = new ReverseBfsField(dist, next, order);
    dist[1] = 99;
    next[1] = 99;
    order[1] = 0;
    expect(field.distanceAt(1)).toBe(1);
    expect(field.nextStepFrom(1)).toBe(0);
    expect(field.maxReachableDistance).toBe(1);
  });

  it('validates constructor arrays, visitOrder entries, index bounds, and map size mismatch', () => {
    expect(() => new ReverseBfsField(new Int32Array(0), new Int32Array(0), new Int32Array(0))).toThrow(RangeError);
    expect(() => new ReverseBfsField(new Int32Array([0, 1]), new Int32Array([-1]), new Int32Array([0]))).toThrow(RangeError);
    expect(() => new ReverseBfsField(new Int32Array([0, 1]), new Int32Array([-1, 0]), new Int32Array(0))).toThrow(RangeError);
    expect(() => new ReverseBfsField(new Int32Array([0]), new Int32Array([-1]), new Int32Array([0, 0]))).toThrow(RangeError);
    expect(() => new ReverseBfsField(new Int32Array([0, 1]), new Int32Array([-1, 0]), new Int32Array([-1]))).toThrow(RangeError);
    expect(() => new ReverseBfsField(new Int32Array([0, 1]), new Int32Array([-1, 0]), new Int32Array([0, 2]))).toThrow(RangeError);
    expect(() => new ReverseBfsField(new Int32Array([0, -1]), new Int32Array([-1, -1]), new Int32Array([0, 1]))).toThrow(RangeError);

    const field = computeReverseBfs(parseHeightMap('SbcdefghijklmnopqrstuvwxyE'));
    expect(() => field.distanceAt(-1)).toThrow(RangeError);
    expect(() => field.nextStepFrom(26)).toThrow(RangeError);
    expect(() => field.reconstructPath(1.5)).toThrow(RangeError);
    const otherMap = parseHeightMap('SE');
    expect(() => field.findNearestStart(otherMap, START_S)).toThrow(RangeError);
  });
});
