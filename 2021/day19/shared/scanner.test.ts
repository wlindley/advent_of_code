import { describe, expect, it } from 'vitest';
import { IDENTITY_ROTATION } from './rotation';
import {
  AlignedScanner,
  computePairwiseSqDistances,
  countSharedDistances,
  ScannerReport,
} from './scanner';
import { Vec3 } from './vec3';

describe('ScannerReport and AlignedScanner', () => {
  it('deduplicates beacons by key, freezes report, and computes beaconCount dynamically', () => {
    const beacons = [new Vec3(1, 2, 3), new Vec3(4, 5, 6), new Vec3(1, 2, 3)];
    const report = new ScannerReport(-0, beacons);
    expect(Object.is(report.id, 0)).toBe(true);
    expect(report.beaconCount).toBe(2);
    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.beacons)).toBe(true);
  });

  it('rejects invalid scanner ids and empty beacon lists', () => {
    const pt = new Vec3(0, 0, 0);
    expect(() => new ScannerReport(-1, [pt])).toThrow(RangeError);
    expect(() => new ScannerReport(1.5, [pt])).toThrow(RangeError);
    expect(() => new ScannerReport(0, [])).toThrow(RangeError);
  });

  it('constructs AlignedScanner with anchor and child metadata', () => {
    const pos = new Vec3(0, 0, 0);
    const b1 = new Vec3(1, 0, 0);
    const b2 = new Vec3(0, 1, 0);
    const anchor = new AlignedScanner(0, pos, IDENTITY_ROTATION, null, 2, [b1, b2]);
    expect(anchor.isAnchor).toBe(true);
    expect(anchor.beaconCount).toBe(2);
    expect(Object.isFrozen(anchor)).toBe(true);
    expect(Object.isFrozen(anchor.beacons)).toBe(true);

    const child = new AlignedScanner(1, new Vec3(10, 0, 0), IDENTITY_ROTATION, 0, 12, [b1]);
    expect(child.isAnchor).toBe(false);
    expect(child.matchedParentId).toBe(0);
    expect(child.overlapCount).toBe(12);
    expect(() => new AlignedScanner(-1, pos, IDENTITY_ROTATION, null, 0, [b1])).toThrow(RangeError);
    expect(() => new AlignedScanner(1, pos, IDENTITY_ROTATION, -1, 0, [b1])).toThrow(RangeError);
    expect(() => new AlignedScanner(1, pos, IDENTITY_ROTATION, 0, -1, [b1])).toThrow(RangeError);
    expect(() => new AlignedScanner(1, pos, IDENTITY_ROTATION, 0, 1, [])).toThrow(RangeError);
  });

  it('computes sorted Float64Array pairwise squared distances and multiset intersection', () => {
    const a = computePairwiseSqDistances([new Vec3(0, 0, 0), new Vec3(3, 0, 0), new Vec3(0, 1, 0)]);
    expect(a).toBeInstanceOf(Float64Array);
    expect(Array.from(a)).toEqual([1, 9, 10]);

    const b = computePairwiseSqDistances([
      new Vec3(0, 0, 0),
      new Vec3(0, 1, 0),
      new Vec3(0, 2, 0),
      new Vec3(0, 10, 0),
    ]);
    expect(Array.from(b)).toEqual([1, 1, 4, 64, 81, 100]);
    expect(countSharedDistances(a, b)).toBe(1);
    expect(countSharedDistances(b, a)).toBe(1);
    expect(countSharedDistances(a, a)).toBe(3);
  });
});
