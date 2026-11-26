import { describe, expect, it } from 'vitest';
import { clampFallenCount, findShortestPath } from './bfs';
import { MemorySpace, UNVISITED } from './model';
import { parseMemorySpace } from './parser';

const EXAMPLE_INPUT = [
  '5,4', '4,2', '4,5', '3,0', '2,1',
  '6,3', '2,4', '1,5', '0,6', '3,3',
  '2,6', '5,1', '1,2', '5,5', '2,5',
  '6,5', '1,4', '0,4', '6,4', '1,1',
  '6,1', '1,0', '0,5', '1,6', '2,0',
].join('\n');

describe('clampFallenCount', () => {
  it('clamps fallenCount to byteCount and validates non-negative integers', () => {
    const space = new MemorySpace(3, [{ x: 1, y: 1 }]);
    expect(clampFallenCount(space, 0)).toBe(0);
    expect(clampFallenCount(space, 1)).toBe(1);
    expect(clampFallenCount(space, 100)).toBe(1);
    expect(() => clampFallenCount(space, -1)).toThrow(RangeError);
    expect(() => clampFallenCount(space, 1.5)).toThrow(RangeError);
  });
});

describe('findShortestPath', () => {
  it('solves the official 7x7 example after 12 bytes with valid path and distances', () => {
    const space = parseMemorySpace(EXAMPLE_INPUT, 7);
    const result = findShortestPath(space, 12);

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.path)).toBe(true);
    expect(result.fallenCount).toBe(12);
    expect(result.reachable).toBe(true);
    expect(result.distance).toBe(22);
    expect(result.path).toHaveLength(23);
    expect(result.path[0]).toEqual({ x: 0, y: 0 });
    expect(result.path[22]).toEqual({ x: 6, y: 6 });
    expect(result.distanceAt(0, 0)).toBe(0);
    expect(result.distanceAt(6, 6)).toBe(22);
    expect(result.distanceAt(5, 4)).toBe(UNVISITED);
    expect(result.visitedCount).toBeGreaterThan(22);
    expect(result.maxDistance).toBeGreaterThanOrEqual(22);

    const copy = result.copyDistances();
    expect(copy[0]).toBe(0);
    copy[0] = 999;
    expect(result.distanceAt(0, 0)).toBe(0);
    expect(() => result.distanceAt(7, 0)).toThrow(RangeError);
  });

  it('handles 1x1 open grid and blocked start/exit short-circuits', () => {
    const open1x1 = new MemorySpace(1, []);
    const res1 = findShortestPath(open1x1, 0);
    expect(res1.reachable).toBe(true);
    expect(res1.distance).toBe(0);
    expect(res1.visitedCount).toBe(1);
    expect(res1.maxDistance).toBe(0);
    expect(res1.path).toEqual([{ x: 0, y: 0 }]);

    const blockedStart = new MemorySpace(3, [{ x: 0, y: 0 }]);
    const resStart = findShortestPath(blockedStart, 1);
    expect(resStart.reachable).toBe(false);
    expect(resStart.distance).toBeNull();
    expect(resStart.visitedCount).toBe(0);
    expect(resStart.maxDistance).toBe(-1);
    expect(resStart.path).toEqual([]);

    const blockedGoal = new MemorySpace(3, [{ x: 2, y: 2 }]);
    const resGoal = findShortestPath(blockedGoal, 1);
    expect(resGoal.reachable).toBe(false);
    expect(resGoal.distance).toBeNull();
    expect(resGoal.visitedCount).toBe(0);
    expect(resGoal.maxDistance).toBe(-1);
  });

  it('returns unreachable when a wall separates start and exit', () => {
    const walled = new MemorySpace(3, [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ]);
    const result = findShortestPath(walled, 3);
    expect(result.reachable).toBe(false);
    expect(result.distance).toBeNull();
    expect(result.visitedCount).toBe(3);
    expect(result.maxDistance).toBe(2);
    expect(result.distanceAt(0, 2)).toBe(2);
    expect(result.distanceAt(2, 2)).toBe(UNVISITED);
    expect(result.path).toEqual([]);
  });
});
