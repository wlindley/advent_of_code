import { describe, expect, it } from 'vitest';
import { Grid2D } from '../../../shared/core';
import { Heightmap, RIDGE_HEIGHT } from './heightmap';
import { parseHeightmap } from './parser';

describe('Heightmap & parseHeightmap', () => {
  it('parses a rectangular heightmap and exposes dimensions, cells, and immutability', () => {
    const map = parseHeightmap('219\n398\r\n');
    expect(RIDGE_HEIGHT).toBe(9);
    expect(map.rows).toBe(2);
    expect(map.cols).toBe(3);
    expect(map.size).toBe(6);
    expect(Object.isFrozen(map)).toBe(true);
    expect(map.at(0, 0)).toBe(2);
    expect(map.at(0, 2)).toBe(9);
    expect(map.isRidge(0, 2)).toBe(true);
    expect(map.isRidge(0, 0)).toBe(false);
    expect(map.inBounds(1, 2)).toBe(true);
    expect(map.inBounds(2, 0)).toBe(false);
  });

  it('detects strict 4-neighbor low points including 1x1 vacuous truth and throws OOB', () => {
    const single = parseHeightmap('9');
    expect(single.isLowPoint(0, 0)).toBe(true);
    expect(single.isRidge(0, 0)).toBe(true);

    const tie = parseHeightmap('11\n22');
    expect(tie.isLowPoint(0, 0)).toBe(false);
    expect(tie.isLowPoint(0, 1)).toBe(false);

    const valley = parseHeightmap('219\n398');
    expect(valley.isLowPoint(0, 1)).toBe(true);
    expect(valley.isLowPoint(0, 0)).toBe(false);
    expect(valley.isLowPoint(1, 2)).toBe(true);
    expect(() => valley.at(-1, 0)).toThrow(RangeError);
    expect(() => valley.isLowPoint(0, 3)).toThrow(RangeError);
  });

  it('rejects out-of-range cell values in Heightmap constructor', () => {
    expect(() => new Heightmap(new Grid2D(1, 1, [-1]))).toThrow(RangeError);
    expect(() => new Heightmap(new Grid2D(1, 1, [10]))).toThrow(RangeError);
    expect(() => new Heightmap(new Grid2D(1, 1, [1.5]))).toThrow(RangeError);
  });

  it('rejects empty, ragged, or non-digit heightmap inputs', () => {
    expect(() => parseHeightmap('')).toThrow();
    expect(() => parseHeightmap('12\n3')).toThrow();
    expect(() => parseHeightmap('1a3')).toThrow(RangeError);
    expect(() => parseHeightmap('1/3')).toThrow(RangeError);
  });
});
