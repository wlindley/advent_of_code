import { describe, expect, it } from 'vitest';
import {
  BLIZZARD_DOWN,
  BLIZZARD_LEFT,
  BLIZZARD_RIGHT,
  BLIZZARD_UP,
  BlizzardBasin,
  POPCOUNT_4,
  START_CELL_ID,
} from './basin';

describe('BlizzardBasin', () => {
  it('computes dynamic dimensions, cell IDs, period, and blizzardCount', () => {
    const blizzards = new Uint8Array([
      BLIZZARD_RIGHT, BLIZZARD_LEFT, 0,
      0, BLIZZARD_UP | BLIZZARD_DOWN, BLIZZARD_RIGHT,
    ]);
    const basin = new BlizzardBasin(4, 5, 1, 3, blizzards);
    blizzards[0] = 0; // External mutation must not alter basin state.

    expect(basin.height).toBe(4);
    expect(basin.width).toBe(5);
    expect(basin.innerHeight).toBe(2);
    expect(basin.innerWidth).toBe(3);
    expect(basin.innerArea).toBe(6);
    expect(basin.numCells).toBe(8);
    expect(basin.startCellId).toBe(START_CELL_ID);
    expect(basin.endCellId).toBe(7);
    expect(basin.startEntryId).toBe(1);
    expect(basin.endEntryId).toBe(6);
    expect(basin.period).toBe(6);
    expect(basin.blizzardCount).toBe(5);
    expect(POPCOUNT_4[15]).toBe(4);
  });

  it('maps cell IDs to grid coordinates and rejects out-of-range IDs', () => {
    const basin = new BlizzardBasin(4, 5, 1, 3, new Uint8Array(6));
    expect(basin.cellCoord(0)).toEqual({ row: 0, col: 1 });
    expect(basin.cellCoord(1)).toEqual({ row: 1, col: 1 });
    expect(basin.cellCoord(6)).toEqual({ row: 2, col: 3 });
    expect(basin.cellCoord(7)).toEqual({ row: 3, col: 3 });
    expect(() => basin.cellCoord(-1)).toThrow(RangeError);
    expect(() => basin.cellCoord(8)).toThrow(RangeError);
    expect(() => basin.cellCoord(1.5)).toThrow(RangeError);
  });

  it('wraps blizzards in all four directions over time', () => {
    const blizzards = new Uint8Array(6);
    blizzards[0] = BLIZZARD_UP | BLIZZARD_LEFT;
    blizzards[4] = BLIZZARD_DOWN | BLIZZARD_RIGHT;
    const basin = new BlizzardBasin(4, 5, 1, 3, blizzards);

    expect(basin.blizzardMaskAt(0, 0, 0)).toBe(BLIZZARD_UP | BLIZZARD_LEFT);
    expect(basin.blizzardCountAt(0, 0, 0)).toBe(2);
    expect(basin.blizzardMaskAt(1, 0, 1)).toBe(BLIZZARD_UP);
    expect(basin.blizzardMaskAt(0, 2, 1)).toBe(BLIZZARD_LEFT);
    expect(basin.blizzardMaskAt(0, 1, 1)).toBe(BLIZZARD_DOWN);
    expect(basin.blizzardMaskAt(1, 2, 1)).toBe(BLIZZARD_RIGHT);
    expect(basin.blizzardMaskAt(0, 1, -1)).toBe(BLIZZARD_DOWN | BLIZZARD_LEFT);

    expect(basin.isCellFreeAtMod(basin.startCellId, 0, 0)).toBe(true);
    expect(basin.isCellFreeAtMod(basin.endCellId, 1, 1)).toBe(true);
    expect(basin.isCellFreeAtMod(1, 0, 0)).toBe(false);
    expect(basin.isCellFreeAtMod(2, 0, 0)).toBe(true);
  });

  it('validates dimensions, openings, buffer length, bitmasks, and query coordinates', () => {
    expect(() => new BlizzardBasin(2, 5, 1, 1, new Uint8Array(0))).toThrow(RangeError);
    expect(() => new BlizzardBasin(4, 2, 1, 1, new Uint8Array(0))).toThrow(RangeError);
    expect(() => new BlizzardBasin(4.5, 5, 1, 1, new Uint8Array(6))).toThrow(RangeError);
    expect(() => new BlizzardBasin(4, 5, 0, 3, new Uint8Array(6))).toThrow(RangeError);
    expect(() => new BlizzardBasin(4, 5, 1, 4, new Uint8Array(6))).toThrow(RangeError);
    expect(() => new BlizzardBasin(4, 5, 1.5, 3, new Uint8Array(6))).toThrow(RangeError);
    expect(() => new BlizzardBasin(4, 5, 1, 3, new Uint8Array(5))).toThrow(RangeError);
    expect(() => new BlizzardBasin(4, 5, 1, 3, new Uint8Array([16, 0, 0, 0, 0, 0]))).toThrow(RangeError);

    const basin = new BlizzardBasin(4, 5, 1, 3, new Uint8Array(6));
    expect(() => basin.blizzardMaskAt(-1, 0, 0)).toThrow(RangeError);
    expect(() => basin.blizzardMaskAt(2, 0, 0)).toThrow(RangeError);
    expect(() => basin.blizzardMaskAt(0, -1, 0)).toThrow(RangeError);
    expect(() => basin.blizzardMaskAt(0, 3, 0)).toThrow(RangeError);
    expect(() => basin.blizzardMaskAt(0, 0, 0.5)).toThrow(RangeError);
  });
});
