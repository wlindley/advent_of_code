import { describe, expect, it } from 'vitest';
import { CaveBounds, type CaveBoundaryPolicy } from './boundaryPolicy';
import { CavePoint, parseCaveScan, SOURCE_X, SOURCE_Y } from './caveScan';
import { CELL_AIR, CELL_ROCK, ReservoirField, simulateReservoir } from './simulation';

const EXAMPLE_SCAN = '498,4 -> 498,6 -> 496,6\n503,4 -> 502,4 -> 502,9 -> 494,9';

const TEST_ABYSS_POLICY: CaveBoundaryPolicy = {
  label: 'TestAbyss',
  computeBounds(scan) {
    const maxY = scan.maxY + 1;
    const minX = Math.max(SOURCE_X - maxY, Math.min(scan.minX, SOURCE_X) - 1);
    const maxX = Math.min(SOURCE_X + maxY, Math.max(scan.maxX, SOURCE_X) + 1);
    return new CaveBounds(minX, maxX, maxY, null);
  },
  isEscape: (y, bounds) => y >= bounds.maxY,
};

const TEST_FLOOR_POLICY: CaveBoundaryPolicy = {
  label: 'TestFloor',
  computeBounds(scan) {
    const floorY = scan.maxY + 2;
    return new CaveBounds(SOURCE_X - floorY, SOURCE_X + floorY, floorY, floorY);
  },
  isEscape: () => false,
};

describe('ReservoirField', () => {
  it('validates cell buffer size and out-of-range queries', () => {
    const bounds = new CaveBounds(499, 501, 2, null);
    expect(() => new ReservoirField(bounds, new Int32Array(2), new Int32Array(0), [])).toThrow(RangeError);
    const rawCells = new Int32Array(bounds.cellCount);
    rawCells[0] = CELL_ROCK;
    const rawSettled = new Int32Array([4]);
    const field = new ReservoirField(bounds, rawCells, rawSettled, [new CavePoint(500, 0)]);
    rawCells[0] = 99;
    rawSettled[0] = 0;
    expect(field.cellAt(499, 0)).toBe(CELL_ROCK);
    expect(field.settledPointAt(0)).toEqual(new CavePoint(500, 1));
    expect(field.escaped).toBe(true);
    expect(Object.isFrozen(field)).toBe(true);
    expect(Object.isFrozen(field.escapePath)).toBe(true);
    expect(() => field.cellAt(498, 0)).toThrow(RangeError);
    expect(() => field.settledPointAt(-1)).toThrow(RangeError);
    expect(() => field.settledPointAt(1)).toThrow(RangeError);
    expect(() => field.settledPointAt(0.5)).toThrow(RangeError);
  });
});

describe('simulateReservoir', () => {
  it('simulates example with abyss policy yielding 24 settled grains and escape path', () => {
    const field = simulateReservoir(parseCaveScan(EXAMPLE_SCAN), TEST_ABYSS_POLICY);
    expect(field.settledCount).toBe(24);
    expect(field.escaped).toBe(true);
    expect(field.escapePath[0]).toEqual(new CavePoint(SOURCE_X, SOURCE_Y));
    expect(field.escapePath[field.escapePath.length - 1]!.y).toBe(field.bounds.maxY);
    expect(field.cellAt(498, 5)).toBe(CELL_ROCK);
    expect(field.cellAt(500, 0)).toBe(CELL_AIR);
    expect(field.settledPointAt(0)).toEqual(new CavePoint(500, 8));
    expect(field.cellAt(500, 8)).toBe(1);
    expect(field.settledPointAt(23)).toEqual(new CavePoint(495, 8));
  });

  it('simulates example with floor policy yielding 93 settled grains and blocked source', () => {
    const field = simulateReservoir(parseCaveScan(EXAMPLE_SCAN), TEST_FLOOR_POLICY);
    expect(field.settledCount).toBe(93);
    expect(field.escaped).toBe(false);
    expect(field.escapePath).toHaveLength(0);
    expect(field.cellAt(SOURCE_X, SOURCE_Y)).toBe(93);
    expect(field.cellAt(SOURCE_X, field.bounds.floorY!)).toBe(CELL_ROCK);
  });

  it('handles rock directly on source and clamps out-of-bounds single/segment rocks', () => {
    const blocked = simulateReservoir(parseCaveScan('500,0\n470,2 -> 475,2'), TEST_ABYSS_POLICY);
    expect(blocked.settledCount).toBe(0);
    expect(blocked.escaped).toBe(false);
    expect(blocked.cellAt(500, 0)).toBe(CELL_ROCK);
  });
});
