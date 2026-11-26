import { describe, expect, it } from 'vitest';
import { Grid2D } from '../../../shared/core';
import { AntennaMap, CELL_CHAR_PATTERN, EMPTY_CELL, GridPoint, parseAntennaMap } from './map';

describe('GridPoint', () => {
  it('stores integer coordinates including negative and out-of-bounds values and freezes itself', () => {
    const pt = new GridPoint(-2, 15);
    expect(pt.row).toBe(-2);
    expect(pt.col).toBe(15);
    expect(Object.isFrozen(pt)).toBe(true);
  });

  it('compares points by row and column equality', () => {
    const a = new GridPoint(3, 4);
    expect(a.equals(new GridPoint(3, 4))).toBe(true);
    expect(a.equals(new GridPoint(3, 5))).toBe(false);
    expect(a.equals(new GridPoint(2, 4))).toBe(false);
  });

  it('rejects non-integer row coordinates', () => {
    expect(() => new GridPoint(1.5, 0)).toThrow(RangeError);
    expect(() => new GridPoint(Number.NaN, 0)).toThrow(RangeError);
  });

  it('rejects non-integer column coordinates', () => {
    expect(() => new GridPoint(0, 2.25)).toThrow(RangeError);
    expect(() => new GridPoint(0, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe('AntennaMap and parseAntennaMap', () => {
  it('exposes EMPTY_CELL and CELL_CHAR_PATTERN constants', () => {
    expect(EMPTY_CELL).toBe('.');
    expect(CELL_CHAR_PATTERN.test('0')).toBe(true);
    expect(CELL_CHAR_PATTERN.test('A')).toBe(true);
    expect(CELL_CHAR_PATTERN.test('z')).toBe(true);
    expect(CELL_CHAR_PATTERN.test('#')).toBe(false);
  });

  it('parses a valid map, preserves case sensitivity, and computes groups and totalPairs dynamically', () => {
    const raw = ['a.A.', '..a.', '0..0', '.a..'].join('\n');
    const map = parseAntennaMap(raw);

    expect(Object.isFrozen(map)).toBe(true);
    expect(map.rows).toBe(4);
    expect(map.cols).toBe(4);
    expect(map.inBounds(0, 0)).toBe(true);
    expect(map.inBounds(-1, 0)).toBe(false);
    expect(map.cellAt(0, 2)).toBe('A');
    expect(map.isAntennaAt(-1, 0)).toBe(false);
    expect(map.isAntennaAt(0, 1)).toBe(false);
    expect(map.isAntennaAt(0, 0)).toBe(true);

    const groups = map.frequencyGroups;
    expect(Array.from(groups.keys())).toEqual(['a', 'A', '0']);
    expect(groups.get('a')).toEqual([new GridPoint(0, 0), new GridPoint(1, 2), new GridPoint(3, 1)]);
    expect(groups.get('A')).toEqual([new GridPoint(0, 2)]);
    expect(groups.get('0')).toEqual([new GridPoint(2, 0), new GridPoint(2, 3)]);
    expect(Object.isFrozen(groups.get('a'))).toBe(true);
    // 3 choose 2 = 3 ('a') + 0 ('A') + 1 ('0') = 4
    expect(map.totalPairs).toBe(4);
  });

  it('returns empty groups and zero totalPairs when no antennas exist', () => {
    const map = parseAntennaMap('..\n..');
    expect(map.frequencyGroups.size).toBe(0);
    expect(map.totalPairs).toBe(0);
  });

  it('rejects invalid grid characters', () => {
    expect(() => parseAntennaMap('a#\n..')).toThrow(/Invalid grid character/);
    expect(() => new AntennaMap(new Grid2D(1, 2, ['.', '*']))).toThrow(/Invalid grid character/);
  });

  it('propagates Grid2D structural errors on empty or jagged inputs', () => {
    expect(() => parseAntennaMap('')).toThrow(/empty/i);
    expect(() => parseAntennaMap('...\n..')).toThrow(/length/);
  });
});
