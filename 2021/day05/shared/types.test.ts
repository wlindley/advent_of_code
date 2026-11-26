import { describe, expect, it } from 'vitest';
import {
  VentBounds,
  VentField,
  VentPoint,
  VentSegment,
  computeSegmentBounds,
  type VentSelectionPolicy,
} from './types';

const ONLY_HORIZONTAL: VentSelectionPolicy = {
  id: 'axis-aligned',
  label: 'Horizontal',
  description: 'Horizontal only',
  includes: (segment) => segment.orientation === 'horizontal',
};

describe('VentPoint', () => {
  it('normalizes -0 to +0, checks equality, and freezes', () => {
    const a = new VentPoint(-0, 5);
    const b = new VentPoint(0, 5);
    const c = new VentPoint(1, 5);
    const d = new VentPoint(0, 6);
    expect(Object.is(a.x, 0)).toBe(true);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
    expect(a.equals(d)).toBe(false);
    expect(Object.isFrozen(a)).toBe(true);
  });

  it('rejects non-safe-integer coordinates', () => {
    expect(() => new VentPoint(1.5, 0)).toThrow(RangeError);
    expect(() => new VentPoint(0, Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });
});

describe('VentSegment', () => {
  it('derives geometry and steps for point, horizontal, vertical, and diagonal segments', () => {
    const pt = new VentSegment(new VentPoint(3, 4), new VentPoint(3, 4));
    expect(pt.orientation).toBe('point');
    expect(pt.isAxisAligned).toBe(true);
    expect(pt.isOctilinear).toBe(true);
    expect(pt.pointCount).toBe(1);
    expect([pt.stepX, pt.stepY]).toEqual([0, 0]);

    const horiz = new VentSegment(new VentPoint(5, 2), new VentPoint(2, 2));
    expect(horiz.orientation).toBe('horizontal');
    expect([horiz.minX, horiz.maxX, horiz.minY, horiz.maxY]).toEqual([2, 5, 2, 2]);
    expect([horiz.stepX, horiz.stepY, horiz.pointCount]).toEqual([-1, 0, 4]);

    const vert = new VentSegment(new VentPoint(1, 1), new VentPoint(1, 3));
    expect(vert.orientation).toBe('vertical');
    expect([vert.stepX, vert.stepY, vert.pointCount]).toEqual([0, 1, 3]);

    const diag = new VentSegment(new VentPoint(3, 3), new VentPoint(1, 5));
    expect(diag.orientation).toBe('diagonal');
    expect(diag.isAxisAligned).toBe(false);
    expect(diag.isOctilinear).toBe(true);
    const visited: string[] = [];
    diag.forEachPoint((x, y) => visited.push(`${x},${y}`));
    expect(visited).toEqual(['3,3', '2,4', '1,5']);
  });

  it('identifies oblique segments and rejects unsafe deltas or non-octilinear rasterization', () => {
    const oblique = new VentSegment(new VentPoint(0, 0), new VentPoint(2, 1));
    expect(oblique.orientation).toBe('oblique');
    expect(oblique.isOctilinear).toBe(false);
    expect(() => oblique.pointCount).toThrow(RangeError);
    expect(() => oblique.forEachPoint(() => {})).toThrow(RangeError);

    expect(
      () => new VentSegment(new VentPoint(-1, 0), new VentPoint(Number.MAX_SAFE_INTEGER, 0)),
    ).toThrow(RangeError);
    expect(
      () => new VentSegment(new VentPoint(0, -1), new VentPoint(0, Number.MAX_SAFE_INTEGER)),
    ).toThrow(RangeError);
  });
});

describe('VentBounds & VentField', () => {
  it('computes BigInt dimensions, containment, bounds, and policy filtering', () => {
    const b = new VentBounds(-0, 9, 1, 5);
    expect(b.width).toBe(10n);
    expect(b.height).toBe(5n);
    expect(b.area).toBe(50n);
    expect(b.contains(new VentPoint(0, 1))).toBe(true);
    expect(b.contains(new VentPoint(-1, 1))).toBe(false);
    expect(b.contains(new VentPoint(10, 1))).toBe(false);
    expect(b.contains(new VentPoint(0, 0))).toBe(false);
    expect(b.contains(new VentPoint(0, 6))).toBe(false);

    expect(() => new VentBounds(5, 4, 0, 1)).toThrow(RangeError);
    expect(() => new VentBounds(0, 1, 5, 4)).toThrow(RangeError);
    expect(() => computeSegmentBounds([])).toThrow(RangeError);
    expect(() => new VentField([])).toThrow(RangeError);

    const s1 = new VentSegment(new VentPoint(2, 2), new VentPoint(4, 4));
    const s2 = new VentSegment(new VentPoint(0, 9), new VentPoint(5, 9));
    const s3 = new VentSegment(new VentPoint(1, 1), new VentPoint(3, 1));
    const field = new VentField([s1, s2, s3]);
    expect(field.segmentCount).toBe(3);
    expect(field.bounds.minX).toBe(0);
    expect(field.bounds.maxX).toBe(5);
    expect(field.bounds.minY).toBe(1);
    expect(field.bounds.maxY).toBe(9);
    expect(field.filter(ONLY_HORIZONTAL)).toEqual([s2, s3]);
    expect(Object.isFrozen(field)).toBe(true);
  });
});
