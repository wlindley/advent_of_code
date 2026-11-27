import { describe, expect, it } from 'vitest';
import { Grid2D } from '../../../shared/core';
import { FLASH_THRESHOLD, MAX_ENERGY, OctopusGrid } from './grid';

describe('OctopusGrid', () => {
  it('exposes energy constants and frozen grid dimensions/cells', () => {
    expect(MAX_ENERGY).toBe(9);
    expect(FLASH_THRESHOLD).toBe(10);

    const grid = new OctopusGrid(new Grid2D(2, 3, [0, 1, 2, 7, 8, 9]));
    expect(Object.isFrozen(grid)).toBe(true);
    expect(grid.rows).toBe(2);
    expect(grid.cols).toBe(3);
    expect(grid.size).toBe(6);
    expect(grid.at(0, 0)).toBe(0);
    expect(grid.at(1, 2)).toBe(9);
    expect(grid.inBounds(1, 2)).toBe(true);
    expect(grid.inBounds(-1, 0)).toBe(false);
    expect(grid.inBounds(2, 0)).toBe(false);
  });

  it('throws RangeError on out-of-bounds access', () => {
    const grid = new OctopusGrid(new Grid2D(1, 1, [5]));
    expect(() => grid.at(0, 1)).toThrow(RangeError);
    expect(() => grid.at(-1, 0)).toThrow(RangeError);
  });

  it('rejects negative, above-9, and non-integer energies', () => {
    expect(() => new OctopusGrid(new Grid2D(1, 1, [-1]))).toThrow(RangeError);
    expect(() => new OctopusGrid(new Grid2D(1, 1, [10]))).toThrow(RangeError);
    expect(() => new OctopusGrid(new Grid2D(1, 1, [4.5]))).toThrow(RangeError);
    expect(() => new OctopusGrid(new Grid2D(1, 1, [Number.NaN]))).toThrow(RangeError);
  });
});
