import { describe, expect, it } from 'vitest';
import { TilePoint, TileRect, parseTilePoints } from '../../shared';
import { CompressedAxis, PolygonTileGrid } from './compressedGrid';

const EXAMPLE_POINTS = parseTilePoints(['7,1', '11,1', '11,7', '9,7', '9,5', '2,5', '2,3', '7,3'].join('\n'));
const pt = (x: number, y: number) => new TilePoint(BigInt(x), BigInt(y));

describe('CompressedAxis', () => {
  it('deduplicates, sorts negative/huge bigints, and inserts gaps only for delta > 1', () => {
    const huge = 10n ** 18n;
    const axis = new CompressedAxis([5n, -3n, 6n, huge, 5n]);
    expect(Object.isFrozen(axis) && Object.isFrozen(axis.slabs)).toBe(true);
    expect(axis.slabs).toEqual([
      { start: -3n, end: -3n, isPoint: true },
      { start: -2n, end: 4n, isPoint: false },
      { start: 5n, end: 5n, isPoint: true },
      { start: 6n, end: 6n, isPoint: true },
      { start: 7n, end: huge - 1n, isPoint: false },
      { start: huge, end: huge, isPoint: true },
    ]);
    expect(axis.size).toBe(6);
    expect([axis.indexOfPoint(-3n), axis.indexOfPoint(6n), axis.indexOfPoint(huge)]).toEqual([0, 3, 5]);
    expect(() => axis.indexOfPoint(0n)).toThrow(RangeError);
    expect(() => new CompressedAxis([])).toThrow(Error);
  });
});

describe('PolygonTileGrid', () => {
  it('validates vertex count, zero-length edges, and diagonal edges (interior & wrap-around)', () => {
    expect(() => new PolygonTileGrid([pt(0, 0), pt(1, 0), pt(1, 1)])).toThrow(Error);
    expect(() => new PolygonTileGrid([pt(0, 0), pt(0, 0), pt(2, 0), pt(2, 2)])).toThrow(Error);
    expect(() => new PolygonTileGrid([pt(0, 0), pt(2, 0), pt(2, 2), pt(0, 2), pt(0, 0)])).toThrow(Error);
    expect(() => new PolygonTileGrid([pt(0, 0), pt(2, 1), pt(2, 2), pt(0, 2)])).toThrow(Error);
    expect(() => new PolygonTileGrid([pt(0, 0), pt(2, 0), pt(2, 2), pt(1, 3)])).toThrow(Error);
  });

  it('classifies interior, boundary, and exterior cells and rects on the 8-tile example', () => {
    const grid = new PolygonTileGrid(EXAMPLE_POINTS);
    expect(Object.isFrozen(grid)).toBe(true);
    expect([grid.width, grid.height]).toEqual([7, 7]);
    expect(grid.isCellValid(0, 0)).toBe(false);
    expect(grid.isCellValid(3, 1)).toBe(true);
    expect(grid.isCellValid(1, 3)).toBe(true);
    expect(grid.isCellValid(1, 5)).toBe(false);
    expect(grid.containsRect(new TileRect(pt(9, 5), pt(2, 3)))).toBe(true);
    expect(grid.containsRect(new TileRect(pt(11, 7), pt(2, 1)))).toBe(false);
    expect(grid.invalidCellsInBox(6, 6, 0, 0)).toBeGreaterThan(0);
  });

  it('handles 0-gap pinch with exterior pocket behind it, 1-tile bottleneck, and collinear edges', () => {
    const pinched = new PolygonTileGrid([
      pt(0, 0), pt(3, 0), pt(5, 0), pt(5, 5), pt(3, 5), pt(3, 3),
      pt(4, 3), pt(4, 1), pt(1, 1), pt(1, 3), pt(2, 3), pt(2, 5), pt(0, 5), pt(0, 2),
    ]);
    expect(pinched.isCellValid(pinched.xAxis.indexOfPoint(2n), pinched.yAxis.indexOfPoint(2n))).toBe(false);
    expect(pinched.isCellValid(pinched.xAxis.indexOfPoint(3n), pinched.yAxis.indexOfPoint(2n))).toBe(false);
    expect(pinched.containsRect(new TileRect(pt(0, 0), pt(5, 5)))).toBe(false);
    expect(pinched.containsRect(new TileRect(pt(0, 0), pt(5, 1)))).toBe(true);
    const cavity = new PolygonTileGrid([
      pt(0, 0), pt(6, 0), pt(6, 4), pt(4, 4), pt(4, 2), pt(2, 2), pt(2, 4), pt(0, 4),
    ]);
    expect(cavity.isCellValid(cavity.xAxis.indexOfPoint(2n) + 1, cavity.yAxis.indexOfPoint(2n) + 1)).toBe(false);
    expect(cavity.containsRect(new TileRect(pt(0, 0), pt(6, 4)))).toBe(false);
    expect(cavity.containsRect(new TileRect(pt(0, 0), pt(6, 2)))).toBe(true);
  });

  it('throws RangeError for out-of-bounds or non-integer box indices', () => {
    const grid = new PolygonTileGrid(EXAMPLE_POINTS);
    expect(() => grid.isCellValid(1.5, 0)).toThrow(RangeError);
    expect(() => grid.isCellValid(-1, 0)).toThrow(RangeError);
    expect(() => grid.isCellValid(grid.width, 0)).toThrow(RangeError);
    expect(() => grid.invalidCellsInBox(0, 0, 0, grid.height)).toThrow(RangeError);
  });
});
