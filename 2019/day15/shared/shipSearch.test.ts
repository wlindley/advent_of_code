import { describe, expect, it } from 'vitest';
import { ORIGIN, ShipMap, type ShipTile } from './oxygenModels';
import {
  DistanceField,
  computeDistanceField,
  reconstructPath,
  requireOxygenPoint,
} from './shipSearch';

function buildMap(coords: readonly [number, number, ShipTile['kind']][], oxygen: { x: number; y: number } | null): ShipMap {
  const tiles = new Map<string, ShipTile>();
  for (const [x, y, kind] of coords) {
    tiles.set(`${x},${y}`, { x, y, kind });
  }
  return new ShipMap(tiles, ORIGIN, oxygen, 0, 0);
}

describe('shipSearch', () => {
  it('computes shortest distances and paths around walls in O(V) BFS', () => {
    const map = buildMap([
      [0, 0, 'open'],
      [1, 0, 'wall'],
      [0, 1, 'open'],
      [1, 1, 'open'],
      [2, 1, 'open'],
      [2, 0, 'oxygen'],
      [3, 0, 'open'],
    ], { x: 2, y: 0 });

    const field = computeDistanceField(map, ORIGIN);
    expect(Object.isFrozen(field)).toBe(true);
    expect(field.reachedCount).toBe(6);
    expect(field.maxDistance).toBe(5);
    expect(field.distanceTo(ORIGIN)).toBe(0);
    expect(field.distanceTo({ x: 2, y: 0 })).toBe(4);
    expect(field.distanceTo({ x: 1, y: 0 })).toBeNull();
    expect(field.requireDistance({ x: 3, y: 0 })).toBe(5);

    const path = reconstructPath(field, { x: 2, y: 0 });
    expect(Object.isFrozen(path)).toBe(true);
    expect(path).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 0 },
    ]);
    expect(reconstructPath(field, ORIGIN)).toEqual([ORIGIN]);
  });

  it('handles empty distance field and throws on unreachable or non-traversable queries', () => {
    const emptyField = new DistanceField(ORIGIN, new Map(), new Map());
    expect(emptyField.maxDistance).toBe(0);
    expect(emptyField.reachedCount).toBe(0);

    const map = buildMap([
      [0, 0, 'open'],
      [1, 0, 'wall'],
      [2, 0, 'oxygen'],
    ], { x: 2, y: 0 });

    const field = computeDistanceField(map, ORIGIN);
    expect(() => field.requireDistance({ x: 2, y: 0 })).toThrow('unreachable');
    expect(() => reconstructPath(field, { x: 2, y: 0 })).toThrow('unreachable');
    expect(() => computeDistanceField(map, { x: 1, y: 0 })).toThrow('not traversable');
  });

  it('requires an oxygen system coordinate on ShipMap', () => {
    const withOxygen = buildMap([[0, 0, 'oxygen']], ORIGIN);
    expect(requireOxygenPoint(withOxygen)).toEqual(ORIGIN);

    const withoutOxygen = buildMap([[0, 0, 'open']], null);
    expect(() => requireOxygenPoint(withoutOxygen)).toThrow('Oxygen system');
  });
});
