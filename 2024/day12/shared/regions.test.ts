import { describe, expect, it } from 'vitest';
import { parseGardenMap } from './map';
import { GardenRegion, RegionPartition, partitionGarden } from './regions';

describe('GardenRegion', () => {
  it('freezes instance and defensively copies cells with derived area', () => {
    const cells = [0, 1, 2];
    const region = new GardenRegion(0, 'A', cells);
    cells.push(3);

    expect(Object.isFrozen(region)).toBe(true);
    expect(Object.isFrozen(region.cells)).toBe(true);
    expect(region.id).toBe(0);
    expect(region.plant).toBe('A');
    expect(region.cells).toEqual([0, 1, 2]);
    expect(region.area).toBe(3);
  });

  it('rejects invalid id, plant, or empty cells', () => {
    expect(() => new GardenRegion(-1, 'A', [0])).toThrow(RangeError);
    expect(() => new GardenRegion(0.5, 'A', [0])).toThrow(RangeError);
    expect(() => new GardenRegion(0, 'a', [0])).toThrow('Invalid region plant "a"');
    expect(() => new GardenRegion(0, 'A', [])).toThrow('Region must contain at least one cell');
  });
});

describe('RegionPartition', () => {
  it('freezes instance, copies inputs defensively, and checks bounds', () => {
    const map = parseGardenMap('AB\nAA');
    const r0 = new GardenRegion(0, 'A', [0, 2, 3]);
    const r1 = new GardenRegion(1, 'B', [1]);
    const regions = [r0, r1];
    const ids = new Int32Array([0, 1, 0, 0]);
    const partition = new RegionPartition(map, regions, ids);

    regions.pop();
    ids[0] = 99;

    expect(Object.isFrozen(partition)).toBe(true);
    expect(Object.isFrozen(partition.regions)).toBe(true);
    expect(partition.regions).toHaveLength(2);
    expect(partition.regionIdAt(0, 0)).toBe(0);
    expect(partition.regionIdAt(0, 1)).toBe(1);
    expect(() => partition.regionIdAt(2, 0)).toThrow(RangeError);

    expect(partition.sameRegion(0, 1, 1)).toBe(true);
    expect(partition.sameRegion(0, 0, 1)).toBe(false);
    expect(partition.sameRegion(0, -1, 0)).toBe(false);
    expect(partition.sameRegion(0, 2, 0)).toBe(false);
    expect(partition.sameRegion(0, 0, -1)).toBe(false);
    expect(partition.sameRegion(0, 0, 2)).toBe(false);
    expect(partition.sameRegion(0, 0.5, 0)).toBe(false);
  });

  it('rejects mismatched regionIdByCell length or empty regions', () => {
    const map = parseGardenMap('AB');
    const r0 = new GardenRegion(0, 'A', [0]);
    expect(() => new RegionPartition(map, [r0], new Int32Array([0]))).toThrow(RangeError);
    expect(() => new RegionPartition(map, [], new Int32Array([0, 0]))).toThrow(
      'Partition must contain at least one region',
    );
  });
});

describe('partitionGarden', () => {
  it('partitions 1x1, uniform 3x3, diagonal checkerboard, and disconnected same-plant regions', () => {
    const p1 = partitionGarden(parseGardenMap('X'));
    expect(p1.regions.map((r) => [r.plant, r.area])).toEqual([['X', 1]]);

    const pUniform = partitionGarden(parseGardenMap('AAA\nAAA\nAAA'));
    expect(pUniform.regions.map((r) => [r.plant, r.area])).toEqual([['A', 9]]);

    const pDiag = partitionGarden(parseGardenMap('AB\nBA'));
    expect(pDiag.regions.map((r) => [r.plant, r.area])).toEqual([
      ['A', 1],
      ['B', 1],
      ['B', 1],
      ['A', 1],
    ]);

    const pSplit = partitionGarden(parseGardenMap('ABA'));
    expect(pSplit.regions.map((r) => [r.id, r.plant, r.area])).toEqual([
      [0, 'A', 1],
      [1, 'B', 1],
      [2, 'A', 1],
    ]);
  });

  it('handles enclosed holes and multi-level nested A-B-A holes', () => {
    const hole = partitionGarden(parseGardenMap('AAA\nABA\nAAA'));
    expect(hole.regions.map((r) => [r.plant, r.area])).toEqual([
      ['A', 8],
      ['B', 1],
    ]);

    const nested = partitionGarden(
      parseGardenMap(['AAAAA', 'ABBBA', 'ABABA', 'ABBBA', 'AAAAA'].join('\n')),
    );
    expect(nested.regions.map((r) => [r.plant, r.area])).toEqual([
      ['A', 16],
      ['B', 8],
      ['A', 1],
    ]);
  });
});
