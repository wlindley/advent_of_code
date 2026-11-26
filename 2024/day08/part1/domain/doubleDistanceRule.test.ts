import { describe, expect, it } from 'vitest';
import { GridPoint } from '../../shared';
import { DOUBLE_DISTANCE_RULE } from './doubleDistanceRule';

function pointKeySet(points: readonly GridPoint[]): Set<string> {
  return new Set(points.map((p) => `${p.row},${p.col}`));
}

describe('DOUBLE_DISTANCE_RULE', () => {
  it('exposes rule metadata', () => {
    expect(DOUBLE_DISTANCE_RULE.id).toBe('double-distance');
    expect(DOUBLE_DISTANCE_RULE.label.length).toBeGreaterThan(0);
  });

  it('projects exterior reflections across horizontal, vertical, diagonal, and oblique slopes', () => {
    const horiz = DOUBLE_DISTANCE_RULE.projectPair(new GridPoint(2, 2), new GridPoint(2, 4), 10, 10);
    expect(horiz.inBounds).toEqual([new GridPoint(2, 0), new GridPoint(2, 6)]);
    expect(horiz.outOfBounds).toEqual([]);
    expect(Object.isFrozen(horiz)).toBe(true);
    expect(Object.isFrozen(horiz.inBounds)).toBe(true);

    const vert = DOUBLE_DISTANCE_RULE.projectPair(new GridPoint(3, 5), new GridPoint(5, 5), 10, 10);
    expect(vert.inBounds).toEqual([new GridPoint(1, 5), new GridPoint(7, 5)]);

    const oblique = DOUBLE_DISTANCE_RULE.projectPair(new GridPoint(4, 3), new GridPoint(3, 5), 10, 10);
    expect(oblique.inBounds).toEqual([new GridPoint(5, 1), new GridPoint(2, 7)]);
  });

  it('is symmetric with respect to anchor ordering', () => {
    const a = new GridPoint(2, 5);
    const b = new GridPoint(4, 3);
    const ab = DOUBLE_DISTANCE_RULE.projectPair(a, b, 10, 10);
    const ba = DOUBLE_DISTANCE_RULE.projectPair(b, a, 10, 10);
    expect(pointKeySet(ab.inBounds)).toEqual(pointKeySet(ba.inBounds));
    expect(pointKeySet(ab.outOfBounds)).toEqual(pointKeySet(ba.outOfBounds));
  });

  it('partitions boundary and out-of-bounds reflections cleanly', () => {
    const oneOut = DOUBLE_DISTANCE_RULE.projectPair(new GridPoint(0, 1), new GridPoint(1, 2), 4, 4);
    expect(oneOut.inBounds).toEqual([new GridPoint(2, 3)]);
    expect(oneOut.outOfBounds).toEqual([new GridPoint(-1, 0)]);

    const bothOut = DOUBLE_DISTANCE_RULE.projectPair(new GridPoint(0, 0), new GridPoint(1, 1), 2, 2);
    expect(bothOut.inBounds).toEqual([]);
    expect(bothOut.outOfBounds).toEqual([new GridPoint(-1, -1), new GridPoint(2, 2)]);

    const horizOut = DOUBLE_DISTANCE_RULE.projectPair(new GridPoint(1, 0), new GridPoint(1, 1), 2, 2);
    expect(horizOut.inBounds).toEqual([]);
    expect(horizOut.outOfBounds).toEqual([new GridPoint(1, -1), new GridPoint(1, 2)]);
  });

  it('does not emit interior trisection points when separation is divisible by 3', () => {
    const proj = DOUBLE_DISTANCE_RULE.projectPair(new GridPoint(3, 4), new GridPoint(6, 7), 10, 10);
    expect(proj.inBounds).toEqual([new GridPoint(0, 1)]);
    expect(proj.outOfBounds).toEqual([new GridPoint(9, 10)]);
  });

  it('rejects non-positive or non-integer rows', () => {
    const a = new GridPoint(0, 0);
    const b = new GridPoint(0, 1);
    expect(() => DOUBLE_DISTANCE_RULE.projectPair(a, b, 0, 5)).toThrow(RangeError);
    expect(() => DOUBLE_DISTANCE_RULE.projectPair(a, b, 2.5, 5)).toThrow(RangeError);
  });

  it('rejects non-positive or non-integer cols', () => {
    const a = new GridPoint(0, 0);
    const b = new GridPoint(0, 1);
    expect(() => DOUBLE_DISTANCE_RULE.projectPair(a, b, 5, 0)).toThrow(RangeError);
    expect(() => DOUBLE_DISTANCE_RULE.projectPair(a, b, 5, 3.5)).toThrow(RangeError);
  });

  it('rejects identical anchor points', () => {
    const a = new GridPoint(1, 2);
    expect(() => DOUBLE_DISTANCE_RULE.projectPair(a, new GridPoint(1, 2), 5, 5)).toThrow(RangeError);
  });
});
