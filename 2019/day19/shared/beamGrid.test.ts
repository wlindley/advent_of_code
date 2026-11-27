import { describe, expect, it } from 'vitest';
import { BeamGrid, countAffectedSpans, type BeamPoint, type RowSpan } from './beamGrid';

describe('BeamGrid', () => {
  it('stores immutable row spans and computes size and affectedCount dynamically', () => {
    const spans: readonly (RowSpan | null)[] = [
      { y: 0, left: 0, right: 0 },
      null,
      { y: 2, left: 1, right: 3 },
      { y: 3, left: 2, right: 2 },
    ];
    const grid = new BeamGrid(spans);
    const pt: BeamPoint = { x: 2, y: 2 };

    expect(grid.size).toBe(4);
    expect(grid.affectedCount).toBe(5);
    expect(countAffectedSpans(spans)).toBe(5);
    expect(grid.isPulled(0, 0)).toBe(true);
    expect(grid.isPulled(1, 0)).toBe(false);
    expect(grid.isPulled(1, 1)).toBe(false);
    expect(grid.isPulled(pt.x, pt.y)).toBe(true);
    expect(grid.isPulled(0, 2)).toBe(false);
    expect(grid.isPulled(4, 2)).toBe(false);
    expect(grid.isPulled(-1, 0)).toBe(false);
    expect(grid.isPulled(0, -1)).toBe(false);
    expect(grid.isPulled(1.5, 2)).toBe(false);

    expect(grid.rowSpan(0)).toEqual({ y: 0, left: 0, right: 0 });
    expect(grid.rowSpan(1)).toBeNull();
    expect(grid.spans()).toHaveLength(4);
    expect(Object.isFrozen(grid)).toBe(true);
    expect(Object.isFrozen(grid.spans())).toBe(true);
    expect(Object.isFrozen(grid.rowSpan(0))).toBe(true);
  });

  it('rejects empty grids, invalid span bounds, and out-of-range row lookups', () => {
    expect(() => new BeamGrid([])).toThrow(RangeError);
    expect(() => new BeamGrid([{ y: 1, left: 0, right: 0 }])).toThrow(RangeError);
    expect(() => new BeamGrid([{ y: 0, left: -1, right: 0 }])).toThrow(RangeError);
    expect(() => new BeamGrid([{ y: 0, left: 1, right: 0 }])).toThrow(RangeError);
    expect(() => new BeamGrid([{ y: 0, left: 0, right: 1 }])).toThrow(RangeError);
    expect(() => new BeamGrid([{ y: 0, left: 0.5, right: 0 }])).toThrow(RangeError);

    const grid = new BeamGrid([null, { y: 1, left: 1, right: 1 }]);
    expect(() => grid.rowSpan(-1)).toThrow(RangeError);
    expect(() => grid.rowSpan(2)).toThrow(RangeError);
    expect(() => grid.rowSpan(0.5)).toThrow(RangeError);
  });
});
