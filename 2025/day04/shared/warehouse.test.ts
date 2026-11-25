import { describe, expect, it } from 'vitest';
import { MAX_BLOCKING_NEIGHBORS, WarehouseFloor, parseWarehouse } from './index';

describe('2025 Day 4 shared WarehouseFloor', () => {
  it('parses valid warehouse grids and exposes dimensions and roll lookups', () => {
    const floor = parseWarehouse('.@.\n@@@\n');
    expect(MAX_BLOCKING_NEIGHBORS).toBe(4);
    expect(floor).toBeInstanceOf(WarehouseFloor);
    expect(floor.rows).toBe(2);
    expect(floor.cols).toBe(3);
    expect(floor.isRoll(0, 0)).toBe(false);
    expect(floor.isRoll(0, 1)).toBe(true);
    expect(floor.isRoll(1, 2)).toBe(true);
    expect(() => floor.isRoll(2, 0)).toThrow(RangeError);
  });

  it('computes 1x1 degrees accurately for empty and occupied cells', () => {
    const empty = parseWarehouse('.');
    expect(Array.from(empty.computeDegreeMap().degrees)).toEqual([0]);

    const single = parseWarehouse('@');
    const map = single.computeDegreeMap();
    expect(Array.from(map.degrees)).toEqual([0]);
    expect(map.paddedOccupied.length).toBe(9);
    expect(map.paddedOccupied[4]).toBe(1);
  });

  it('computes exact corner (3), edge (5), and center (8) degrees on a full 3x3 grid', () => {
    const floor = parseWarehouse('@@@\n@@@\n@@@');
    const { degrees } = floor.computeDegreeMap();
    expect(Array.from(degrees)).toEqual([
      3, 5, 3,
      5, 8, 5,
      3, 5, 3,
    ]);
  });

  it('prevents row wrap-around leakage across padded sentinel columns in 2x3 grid', () => {
    // Unpadded 1D indexing would falsely treat (0,2) and (1,0) as +1/-1 neighbors.
    const floor = parseWarehouse('..@\n@..');
    const { degrees, paddedOccupied } = floor.computeDegreeMap();
    expect(paddedOccupied.length).toBe((2 + 2) * (3 + 2));
    expect(Array.from(degrees)).toEqual([
      1, 2, 0,
      0, 2, 1,
    ]);
  });

  it('allocates fresh degree buffers per call to preserve immutability', () => {
    const floor = parseWarehouse('@@\n@@');
    const first = floor.computeDegreeMap();
    first.degrees[0] = 99;
    first.paddedOccupied[0] = 99;

    const second = floor.computeDegreeMap();
    expect(Array.from(second.degrees)).toEqual([3, 3, 3, 3]);
    expect(second.paddedOccupied[0]).toBe(0);
  });

  it('rejects invalid characters and spaces with row/col context', () => {
    expect(() => parseWarehouse('.@.\n.x.')).toThrow(/row 1, col 1/i);
    expect(() => parseWarehouse(' .@\n...')).toThrow(/row 0, col 0/i);
    expect(() => parseWarehouse('')).toThrow(Error);
  });
});
